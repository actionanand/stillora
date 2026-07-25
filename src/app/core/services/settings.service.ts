import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { AppSettings, FadeDuration, ThemePreference, TimerDuration } from '../models/app.models';

const STORAGE_KEY = 'stillora.settings';
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fadeDuration: 5,
  rememberSound: true,
  defaultTimer: 5,
  volume: 0.72,
  lastSoundId: 'gentle-rain',
  lastBackground: 'video/rain.mp4',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly document = inject(DOCUMENT);
  private readonly state = signal<AppSettings>(this.read());

  readonly settings = this.state.asReadonly();
  readonly theme = computed(() => this.state().theme);
  readonly fadeDuration = computed(() => this.state().fadeDuration);
  readonly rememberSound = computed(() => this.state().rememberSound);
  readonly defaultTimer = computed(() => this.state().defaultTimer);
  readonly volume = computed(() => this.state().volume);

  updateTheme(theme: ThemePreference): void {
    this.update({ theme });
  }

  updateFadeDuration(fadeDuration: FadeDuration): void {
    this.update({ fadeDuration });
  }

  updateRememberSound(rememberSound: boolean): void {
    this.update({ rememberSound });
  }

  updateDefaultTimer(defaultTimer: TimerDuration): void {
    this.update({ defaultTimer });
  }

  updateVolume(volume: number): void {
    this.update({ volume: Math.min(1, Math.max(0, volume)) });
  }

  rememberSelection(lastSoundId: string, lastBackground: string): void {
    this.update({ lastSoundId, lastBackground });
  }

  private update(changes: Partial<AppSettings>): void {
    this.state.update((current) => ({ ...current, ...changes }));
    this.write(this.state());
  }

  private read(): AppSettings {
    const storage = this.document.defaultView?.localStorage;
    if (!storage) return DEFAULT_SETTINGS;

    try {
      const saved = storage.getItem(STORAGE_KEY);
      if (!saved) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(saved) as Partial<AppSettings>) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private write(settings: AppSettings): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Persistence can be unavailable in privacy-restricted browser contexts.
    }
  }
}
