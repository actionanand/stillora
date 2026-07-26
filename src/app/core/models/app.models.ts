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
  readonly mixable?: boolean;
  readonly mixTitle?: string;
  readonly mixVariant?: string;
}

export interface MixLayer {
  readonly soundId: string;
  readonly volume: number;
}

export interface SavedMix {
  readonly id: string;
  readonly name: string;
  readonly primarySoundId: string;
  readonly layers: readonly MixLayer[];
  readonly createdAt: string;
}

export interface StilloraBackup {
  readonly schemaVersion: 1;
  readonly app: 'Stillora';
  readonly exportedAt: string;
  readonly settings: AppSettings;
}

export interface AppSettings {
  readonly theme: ThemePreference;
  readonly fadeDuration: FadeDuration;
  readonly rememberSound: boolean;
  readonly mediaControlsEnabled: boolean;
  readonly defaultTimer: TimerDuration;
  readonly volume: number;
  readonly lastSoundId: string;
  readonly lastBackground: string;
  readonly mixLayers: readonly MixLayer[];
  readonly savedMixes: readonly SavedMix[];
}
