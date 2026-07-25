import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { SOUNDS } from '../data/sounds';
import { Sound } from '../models/app.models';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class AudioService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly settings = inject(SettingsService);
  private activeAudio: HTMLAudioElement | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;

  readonly currentSound = signal<Sound>(this.initialSound());
  readonly playing = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly volume = computed(() => this.settings.volume());

  async toggle(): Promise<void> {
    if (this.playing()) {
      this.pause();
      return;
    }
    await this.play();
  }

  async play(): Promise<void> {
    this.error.set('');
    if (!this.activeAudio) this.activeAudio = this.createAudio(this.currentSound());
    this.activeAudio.volume = this.volume();
    this.loading.set(true);
    try {
      await this.activeAudio.play();
      this.playing.set(true);
    } catch {
      this.error.set('This sound could not be played. Try another atmosphere.');
      this.playing.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  pause(): void {
    this.clearFade();
    this.activeAudio?.pause();
    this.playing.set(false);
  }

  stop(): void {
    this.clearFade();
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
    }
    this.playing.set(false);
  }

  async select(sound: Sound): Promise<void> {
    if (sound.id === this.currentSound().id) return;
    const wasPlaying = this.playing();
    const previous = this.activeAudio;
    this.currentSound.set(sound);
    this.settings.rememberSelection(sound.id, sound.videoPath);
    this.error.set('');

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
      this.error.set('This sound is unavailable. Your previous atmosphere will continue.');
    } finally {
      this.loading.set(false);
    }
  }

  setVolume(volume: number): void {
    this.settings.updateVolume(volume);
    if (this.activeAudio) this.activeAudio.volume = this.volume();
  }

  fadeOutAndStop(seconds = 15): void {
    const audio = this.activeAudio;
    if (!audio) return;
    this.clearFade();
    const startVolume = audio.volume;
    const startedAt = Date.now();
    this.fadeTimer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / (seconds * 1000));
      audio.volume = startVolume * (1 - progress);
      if (progress < 1) return;
      this.clearFade();
      audio.pause();
      audio.currentTime = 0;
      audio.volume = this.volume();
      this.playing.set(false);
    }, 80);
  }

  ngOnDestroy(): void {
    this.stop();
    this.activeAudio = null;
  }

  private initialSound(): Sound {
    const savedId = this.settings.settings().lastSoundId;
    return (
      (this.settings.rememberSound() && SOUNDS.find((sound) => sound.id === savedId)) || SOUNDS[0]
    );
  }

  private createAudio(sound: Sound): HTMLAudioElement {
    const audio = this.document.createElement('audio');
    audio.src = sound.audioPath;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = this.volume();
    audio.addEventListener('error', () => {
      if (this.currentSound().id === sound.id) {
        this.error.set('This sound file is missing or cannot be read.');
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
    const target = this.volume();
    const startedAt = Date.now();
    this.fadeTimer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / (seconds * 1000));
      incoming.volume = target * progress;
      if (outgoing) outgoing.volume = target * (1 - progress);
      if (progress < 1) return;
      this.clearFade();
      if (outgoing) {
        outgoing.pause();
        outgoing.src = '';
      }
      incoming.volume = target;
    }, 80);
  }

  private clearFade(): void {
    if (!this.fadeTimer) return;
    clearInterval(this.fadeTimer);
    this.fadeTimer = null;
  }
}
