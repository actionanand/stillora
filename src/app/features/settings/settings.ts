import { Component, inject } from '@angular/core';
import { FadeDuration, ThemePreference, TimerDuration } from '../../core/models/app.models';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
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
  protected readonly settings = inject(SettingsService);
  private readonly themeService = inject(ThemeService);

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
}
