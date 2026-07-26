import { Component, inject, signal } from '@angular/core';
import { SOUNDS } from '../../core/data/sounds';
import { FadeDuration, ThemePreference, TimerDuration } from '../../core/models/app.models';
import { AudioService } from '../../core/services/audio.service';
import { BackupFileService } from '../../core/services/backup-file.service';
import { ThemeService } from '../../core/services/theme.service';
import { VideoService } from '../../core/services/video.service';
import { SettingsStore } from '../../core/stores/settings.store';
import {
  SelectPicker,
  SelectPickerOption,
} from '../../shared/components/select-picker/select-picker';

@Component({
  selector: 'app-settings',
  imports: [SelectPicker],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  protected readonly settings = inject(SettingsStore);
  private readonly themeService = inject(ThemeService);
  private readonly audio = inject(AudioService);
  private readonly video = inject(VideoService);
  private readonly backupFiles = inject(BackupFileService);
  protected readonly backupMessage = signal('');

  protected readonly themes: readonly {
    value: ThemePreference;
    label: string;
    icon: string;
    detail: string;
  }[] = [
    { value: 'light', label: 'Light', icon: 'light_mode', detail: 'Bright and airy' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode', detail: 'Gentle on the eyes' },
    { value: 'system', label: 'System', icon: 'contrast', detail: 'Match your device' },
  ];

  protected readonly fadeOptions: readonly SelectPickerOption[] = [
    { value: '5', label: '5 seconds', detail: 'A quick, smooth transition', icon: 'fast_forward' },
    {
      value: '10',
      label: '10 seconds',
      detail: 'Balanced and unhurried',
      icon: 'slow_motion_video',
    },
    {
      value: '15',
      label: '15 seconds',
      detail: 'The gentlest transition',
      icon: 'hourglass_bottom',
    },
  ];

  protected readonly timerOptions: readonly SelectPickerOption[] = [
    { value: '5', label: '5 minutes', detail: 'A small reset', icon: 'timer' },
    { value: '10', label: '10 minutes', detail: 'A mindful pause', icon: 'timer' },
    { value: '15', label: '15 minutes', detail: 'A short meditation', icon: 'timer' },
    { value: '20', label: '20 minutes', detail: 'Settle in and soften', icon: 'timer' },
    { value: '30', label: '30 minutes', detail: 'Deep relaxation', icon: 'timer' },
    { value: '45', label: '45 minutes', detail: 'A long unwinding session', icon: 'timer' },
    { value: '60', label: '60 minutes', detail: 'A full restorative hour', icon: 'timer' },
    {
      value: 'continuous',
      label: 'Continuous',
      detail: 'Keep playing until you stop',
      icon: 'all_inclusive',
    },
  ];

  protected setTheme(theme: ThemePreference): void {
    this.themeService.setPreference(theme);
  }

  protected setFadeDuration(value: string): void {
    this.settings.updateFadeDuration(Number(value) as FadeDuration);
  }

  protected setTimer(value: string): void {
    this.settings.updateDefaultTimer(
      value === 'continuous' ? 'continuous' : (Number(value) as TimerDuration),
    );
  }

  protected setRememberSound(event: Event): void {
    this.settings.updateRememberSound((event.target as HTMLInputElement).checked);
  }

  protected exportBackup(): void {
    try {
      const destination = this.backupFiles.export(this.settings.createBackup());
      this.backupMessage.set(
        destination === 'native'
          ? 'Choose where to save your Stillora backup.'
          : 'Your Stillora backup was exported.',
      );
    } catch (error) {
      this.backupMessage.set(
        error instanceof Error ? error.message : 'The backup could not be exported.',
      );
    }
  }

  protected async importBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    try {
      const raw = await this.backupFiles.import(file);
      const restored = this.settings.restoreBackup(raw);
      const selectedSound = SOUNDS.find((sound) => sound.id === restored.lastSoundId);
      if (selectedSound) {
        this.video.select(selectedSound);
        await this.audio.select(selectedSound);
      }
      await this.audio.replaceMix(restored.mixLayers);
      this.backupMessage.set('Backup restored. Your preferences and soundscape are ready.');
    } catch (error) {
      this.backupMessage.set(
        error instanceof Error ? error.message : 'The backup could not be imported.',
      );
    }
  }
}
