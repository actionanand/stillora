import { DecimalPipe, DOCUMENT, NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { SOUNDS } from '../../core/data/sounds';
import { Sound, TimerDuration } from '../../core/models/app.models';
import { AudioService } from '../../core/services/audio.service';
import { TimerService } from '../../core/services/timer.service';
import { VideoService } from '../../core/services/video.service';
import { SettingsStore } from '../../core/stores/settings.store';
import { BackgroundVideo } from '../../shared/components/background-video/background-video';
import { SoundNavigation } from './components/sound-navigation/sound-navigation';
import { SoundscapeMixer } from './components/soundscape-mixer/soundscape-mixer';

@Component({
  selector: 'app-home',
  imports: [BackgroundVideo, DecimalPipe, NgOptimizedImage, SoundNavigation, SoundscapeMixer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  host: {
    '(document:keydown.escape)': 'closeOverlays()',
  },
})
export class Home {
  protected readonly audio = inject(AudioService);
  protected readonly timer = inject(TimerService);
  protected readonly video = inject(VideoService);
  private readonly settings = inject(SettingsStore);
  private readonly document = inject(DOCUMENT);

  protected readonly sounds = SOUNDS;
  protected readonly timerOptions: readonly TimerDuration[] = [
    5,
    10,
    15,
    20,
    30,
    45,
    60,
    'continuous',
  ];
  protected readonly timerSheetOpen = signal(false);
  protected readonly volumeSheetOpen = signal(false);
  protected readonly mixerSheetOpen = signal(false);
  protected readonly soundNavigationOpen = signal(false);

  constructor() {
    this.video.select(this.audio.currentSound());
    this.timer.select(this.settings.defaultTimer());
  }

  protected async selectSound(sound: Sound): Promise<void> {
    this.video.select(sound);
    await this.audio.select(sound);
    this.soundNavigationOpen.set(false);
  }

  protected async togglePlayback(): Promise<void> {
    const wasPlaying = this.audio.playing();
    await this.audio.toggle();
    if (wasPlaying) {
      this.timer.pause();
      return;
    }
    if (this.audio.playing()) this.timer.start(() => this.audio.fadeOutAndStop(15));
  }

  protected selectTimer(duration: TimerDuration): void {
    this.timer.select(duration);
    this.settings.updateDefaultTimer(duration);
    this.timerSheetOpen.set(false);
    if (this.audio.playing()) this.timer.start(() => this.audio.fadeOutAndStop(15));
  }

  protected updateVolume(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.audio.setVolume(Number(input.value));
  }

  protected openSoundNavigation(): void {
    if (this.document.defaultView?.matchMedia('(max-width: 759px)').matches) {
      this.soundNavigationOpen.set(true);
    }
  }

  protected closeOverlays(): void {
    this.timerSheetOpen.set(false);
    this.volumeSheetOpen.set(false);
    this.mixerSheetOpen.set(false);
    this.soundNavigationOpen.set(false);
  }

  protected timerName(duration: TimerDuration): string {
    return duration === 'continuous' ? 'Continuous' : `${duration} minutes`;
  }
}
