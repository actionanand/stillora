export type ThemePreference = 'light' | 'dark' | 'system';
export type TimerDuration = 5 | 10 | 15 | 20 | 30 | 45 | 60 | 'continuous';
export type FadeDuration = 5 | 10 | 15;

export interface Sound {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly audioPath: string;
  readonly videoPath: string;
  readonly icon: string;
  readonly accent: string;
}

export interface AppSettings {
  readonly theme: ThemePreference;
  readonly fadeDuration: FadeDuration;
  readonly rememberSound: boolean;
  readonly defaultTimer: TimerDuration;
  readonly volume: number;
  readonly lastSoundId: string;
  readonly lastBackground: string;
}
