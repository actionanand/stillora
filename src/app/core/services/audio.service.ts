import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { getMixAvailability } from '../data/mix-compatibility';
import { SOUNDS } from '../data/sounds';
import { MixLayer, Sound } from '../models/app.models';
import { SettingsStore } from '../stores/settings.store';
import { MediaControlsService } from './media-controls.service';
import { TimerService } from './timer.service';

@Injectable({ providedIn: 'root' })
export class AudioService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly settings = inject(SettingsStore);
  private readonly mediaControls = inject(MediaControlsService);
  private readonly timer = inject(TimerService);
  private activeAudio: HTMLAudioElement | null = null;
  private readonly mixAudio = new Map<string, HTMLAudioElement>();
  private readonly disposedAudio = new WeakSet<HTMLAudioElement>();
  private fadingAudio: HTMLAudioElement | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly mediaSessionActive = signal(false);

  readonly currentSound = signal<Sound>(this.initialSound());
  readonly playing = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly volume = computed(() => this.settings.volume());
  readonly mixLayers = this.settings.mixLayers;
  readonly mixCount = computed(() => this.mixLayers().length);

  constructor() {
    this.restoreMix();
    this.mediaControls.initialize({
      play: () => void this.playFromMediaControls(),
      pause: () => this.pauseFromMediaControls(),
      stop: () => this.stopFromMediaControls(),
    });
    effect(() => {
      this.mediaControls.sync({
        enabled: this.settings.mediaControlsEnabled(),
        active: this.mediaSessionActive(),
        playing: this.playing(),
        sound: this.currentSound(),
        mixCount: this.mixCount(),
      });
    });
  }

  async toggle(): Promise<void> {
    if (this.playing()) {
      this.pause();
      return;
    }
    await this.play();
  }

  async play(): Promise<void> {
    this.clearError();
    if (!this.activeAudio) this.activeAudio = this.createAudio(this.currentSound());
    this.activeAudio.volume = this.volume();
    this.loading.set(true);
    try {
      await this.activeAudio.play();
      await Promise.allSettled([...this.mixAudio.values()].map((layerAudio) => layerAudio.play()));
      this.mediaSessionActive.set(true);
      this.playing.set(true);
    } catch {
      this.showError('This sound could not be played. Try another atmosphere.');
      this.mediaSessionActive.set(false);
      this.playing.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  pause(): void {
    this.clearFade();
    this.activeAudio?.pause();
    for (const layerAudio of this.mixAudio.values()) layerAudio.pause();
    this.playing.set(false);
  }

  stop(): void {
    this.clearFade();
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
    }
    for (const layerAudio of this.mixAudio.values()) {
      layerAudio.pause();
      layerAudio.currentTime = 0;
    }
    this.mediaSessionActive.set(false);
    this.playing.set(false);
  }

  async select(sound: Sound): Promise<void> {
    if (sound.id === this.currentSound().id) return;
    const wasPlaying = this.playing();
    const previous = this.activeAudio;
    this.clearMix();
    this.currentSound.set(sound);
    this.settings.rememberSelection(sound.id, sound.videoPath);
    this.clearError();

    if (!wasPlaying) {
      previous?.pause();
      this.activeAudio = null;
      this.preload(sound);
      return;
    }

    const incoming = this.createAudio(sound);
    incoming.volume = 0;
    this.loading.set(true);
    try {
      await incoming.play();
      this.activeAudio = incoming;
      this.crossFade(previous, incoming, this.settings.fadeDuration());
    } catch {
      incoming.pause();
      this.showError('This sound is unavailable. Your previous atmosphere will continue.');
    } finally {
      this.loading.set(false);
    }
  }

  setVolume(volume: number): void {
    this.settings.updateVolume(volume);
    if (this.activeAudio) this.activeAudio.volume = this.volume();
    this.applyMixVolumes();
  }

  async toggleMix(sound: Sound): Promise<void> {
    if (!sound.mixable || !this.canMix(sound.id)) return;
    if (this.isMixed(sound.id)) {
      this.removeMix(sound.id);
      return;
    }
    if (this.mixCount() >= 3) {
      this.showError('Your soundscape can contain up to three additional layers.');
      return;
    }

    const layer: MixLayer = { soundId: sound.id, volume: 0.34 };
    const audio = this.createAudio(sound, () => {
      this.removeMix(sound.id);
      this.showError(`${sound.title} could not be added to this soundscape.`);
    });
    audio.volume = this.layerVolume(layer.volume);
    this.mixAudio.set(sound.id, audio);
    this.settings.updateMixLayers([...this.mixLayers(), layer]);
    this.clearError();

    if (!this.playing()) return;
    try {
      await audio.play();
    } catch {
      if (this.disposedAudio.has(audio)) return;
      this.removeMix(sound.id);
      this.showError(`${sound.title} could not be added to this soundscape.`);
    }
  }

  setMixVolume(soundId: string, volume: number): void {
    const normalized = Math.min(1, Math.max(0, volume));
    this.settings.updateMixLayers(
      this.mixLayers().map((layer) =>
        layer.soundId === soundId ? { ...layer, volume: normalized } : layer,
      ),
    );
    const audio = this.mixAudio.get(soundId);
    if (audio) audio.volume = this.layerVolume(normalized);
  }

  isMixed(soundId: string): boolean {
    return this.mixLayers().some((layer) => layer.soundId === soundId);
  }

  canMix(soundId: string): boolean {
    return getMixAvailability(this.currentSound().id, soundId).allowed;
  }

  mixDisabledReason(soundId: string): string {
    return getMixAvailability(this.currentSound().id, soundId).reason;
  }

  mixVolume(soundId: string): number {
    return this.mixLayers().find((layer) => layer.soundId === soundId)?.volume ?? 0.34;
  }

  clearMix(): void {
    this.disposeMixAudio();
    this.settings.updateMixLayers([]);
    this.clearError();
  }

  async replaceMix(layers: readonly MixLayer[]): Promise<void> {
    this.disposeMixAudio();
    const accepted: MixLayer[] = [];
    const acceptedIds = new Set<string>();

    for (const layer of layers.slice(0, 3)) {
      const sound = SOUNDS.find((candidate) => candidate.id === layer.soundId);
      if (
        !sound?.mixable ||
        !this.canMix(sound.id) ||
        acceptedIds.has(sound.id) ||
        !Number.isFinite(layer.volume)
      ) {
        continue;
      }
      const normalized: MixLayer = {
        soundId: sound.id,
        volume: Math.min(1, Math.max(0.05, layer.volume)),
      };
      const audio = this.createAudio(sound, () => {
        this.removeMix(sound.id);
        this.showError(`${sound.title} could not be added to this soundscape.`);
      });
      audio.volume = this.layerVolume(normalized.volume);
      this.mixAudio.set(sound.id, audio);
      accepted.push(normalized);
      acceptedIds.add(sound.id);
    }

    this.settings.updateMixLayers(accepted);
    if (this.playing()) {
      await Promise.allSettled([...this.mixAudio.values()].map((audio) => audio.play()));
    }
  }

  fadeOutAndStop(seconds = 15): void {
    const audio = this.activeAudio;
    if (!audio) return;
    this.clearFade();
    const playingAudio = [audio, ...this.mixAudio.values()];
    const startVolumes = playingAudio.map((item) => item.volume);
    const startedAt = Date.now();
    this.fadeTimer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / (seconds * 1000));
      playingAudio.forEach((item, index) => {
        item.volume = startVolumes[index] * (1 - progress);
      });
      if (progress < 1) return;
      this.clearFade();
      for (const item of playingAudio) {
        item.pause();
        item.currentTime = 0;
      }
      audio.volume = this.volume();
      this.applyMixVolumes();
      this.mediaSessionActive.set(false);
      this.playing.set(false);
    }, 80);
  }

  ngOnDestroy(): void {
    this.clearError();
    this.stop();
    for (const audio of this.mixAudio.values()) {
      this.disposeAudio(audio);
    }
    this.mixAudio.clear();
    this.activeAudio = null;
    this.mediaControls.destroy();
  }

  private initialSound(): Sound {
    const savedId = this.settings.lastSoundId();
    return (
      (this.settings.rememberSound() && SOUNDS.find((sound) => sound.id === savedId)) || SOUNDS[0]
    );
  }

  private async playFromMediaControls(): Promise<void> {
    await this.play();
    if (this.playing()) this.timer.start(() => this.fadeOutAndStop(15));
  }

  private pauseFromMediaControls(): void {
    this.pause();
    this.timer.pause();
  }

  private stopFromMediaControls(): void {
    this.stop();
    this.timer.stop();
  }

  private createAudio(sound: Sound, onError?: () => void): HTMLAudioElement {
    const audio = this.document.createElement('audio');
    audio.src = sound.audioPath;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = this.volume();
    audio.addEventListener('error', () => {
      if (this.disposedAudio.has(audio)) return;
      if (onError) {
        onError();
        return;
      }
      if (this.currentSound().id === sound.id) {
        this.showError('This sound file is missing or cannot be read.');
        this.mediaSessionActive.set(false);
        this.playing.set(false);
      }
    });
    return audio;
  }

  private preload(sound: Sound): void {
    const audio = this.createAudio(sound);
    audio.preload = 'metadata';
    audio.load();
  }

  private crossFade(
    outgoing: HTMLAudioElement | null,
    incoming: HTMLAudioElement,
    seconds: number,
  ): void {
    this.clearFade();
    this.fadingAudio = outgoing;
    const target = this.volume();
    const startedAt = Date.now();
    this.fadeTimer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / (seconds * 1000));
      incoming.volume = target * progress;
      if (outgoing) outgoing.volume = target * (1 - progress);
      if (progress < 1) return;
      this.clearFade();
      incoming.volume = target;
    }, 80);
  }

  private clearFade(): void {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    if (this.fadingAudio) {
      this.disposeAudio(this.fadingAudio);
      this.fadingAudio = null;
    }
  }

  private removeMix(soundId: string): void {
    const audio = this.mixAudio.get(soundId);
    if (audio) {
      this.disposeAudio(audio);
      this.mixAudio.delete(soundId);
    }
    this.settings.updateMixLayers(this.mixLayers().filter((layer) => layer.soundId !== soundId));
    this.clearError();
  }

  private applyMixVolumes(): void {
    for (const layer of this.mixLayers()) {
      const audio = this.mixAudio.get(layer.soundId);
      if (audio) audio.volume = this.layerVolume(layer.volume);
    }
  }

  private layerVolume(volume: number): number {
    return Math.min(1, this.volume() * volume);
  }

  private restoreMix(): void {
    const saved = this.settings.mixLayers();
    if (!Array.isArray(saved)) {
      this.settings.updateMixLayers([]);
      return;
    }

    const restored: MixLayer[] = [];
    const restoredIds = new Set<string>();
    for (const layer of saved.slice(0, 3)) {
      const sound = SOUNDS.find((candidate) => candidate.id === layer.soundId);
      if (
        !sound?.mixable ||
        !this.canMix(sound.id) ||
        restoredIds.has(sound.id) ||
        !Number.isFinite(layer.volume)
      ) {
        continue;
      }
      const normalized: MixLayer = {
        soundId: sound.id,
        volume: Math.min(1, Math.max(0.05, layer.volume)),
      };
      const audio = this.createAudio(sound, () => {
        this.removeMix(sound.id);
        this.showError(`${sound.title} could not be restored to this soundscape.`);
      });
      audio.volume = this.layerVolume(normalized.volume);
      this.mixAudio.set(sound.id, audio);
      restored.push(normalized);
      restoredIds.add(sound.id);
    }
    this.settings.updateMixLayers(restored);
  }

  private disposeMixAudio(): void {
    for (const audio of this.mixAudio.values()) {
      this.disposeAudio(audio);
    }
    this.mixAudio.clear();
  }

  private disposeAudio(audio: HTMLAudioElement): void {
    this.disposedAudio.add(audio);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  private showError(message: string): void {
    this.clearError();
    this.error.set(message);
    this.noticeTimer = setTimeout(() => {
      this.error.set('');
      this.noticeTimer = null;
    }, 4500);
  }

  private clearError(): void {
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
      this.noticeTimer = null;
    }
    this.error.set('');
  }
}
