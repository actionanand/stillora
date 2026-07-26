import { DOCUMENT } from '@angular/common';
import { effect, inject } from '@angular/core';
import {
  getState,
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  AppSettings,
  FadeDuration,
  MixLayer,
  StilloraBackup,
  ThemePreference,
  TimerDuration,
} from '../models/app.models';

const STORAGE_KEY = 'stillora.settings';
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fadeDuration: 5,
  rememberSound: true,
  defaultTimer: 5,
  volume: 0.72,
  lastSoundId: 'gentle-rain',
  lastBackground: 'video/rain.mp4',
  mixLayers: [],
};

function readSettings(document: Document): AppSettings {
  try {
    const saved = document.defaultView?.localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    const value: unknown = JSON.parse(saved);
    return mapSettings(value);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function mapSettings(value: unknown): AppSettings {
  if (!isRecord(value)) throw new Error('The backup does not contain valid settings.');
  return {
    theme: isTheme(value['theme']) ? value['theme'] : DEFAULT_SETTINGS.theme,
    fadeDuration: isFadeDuration(value['fadeDuration'])
      ? value['fadeDuration']
      : DEFAULT_SETTINGS.fadeDuration,
    rememberSound:
      typeof value['rememberSound'] === 'boolean'
        ? value['rememberSound']
        : DEFAULT_SETTINGS.rememberSound,
    defaultTimer: isTimerDuration(value['defaultTimer'])
      ? value['defaultTimer']
      : DEFAULT_SETTINGS.defaultTimer,
    volume:
      typeof value['volume'] === 'number' && Number.isFinite(value['volume'])
        ? Math.min(1, Math.max(0, value['volume']))
        : DEFAULT_SETTINGS.volume,
    lastSoundId:
      typeof value['lastSoundId'] === 'string'
        ? value['lastSoundId']
        : DEFAULT_SETTINGS.lastSoundId,
    lastBackground:
      typeof value['lastBackground'] === 'string'
        ? value['lastBackground']
        : DEFAULT_SETTINGS.lastBackground,
    mixLayers: readMixLayers(value['mixLayers']),
  };
}

function writeSettings(document: Document, settings: AppSettings): void {
  try {
    document.defaultView?.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Persistence can be unavailable in privacy-restricted browser contexts.
  }
}

function readMixLayers(value: unknown): readonly MixLayer[] {
  if (!Array.isArray(value)) return [];
  const layers: MixLayer[] = [];
  for (const item of value.slice(0, 3)) {
    if (
      !isRecord(item) ||
      typeof item['soundId'] !== 'string' ||
      typeof item['volume'] !== 'number' ||
      !Number.isFinite(item['volume'])
    ) {
      continue;
    }
    layers.push({
      soundId: item['soundId'],
      volume: Math.min(1, Math.max(0.05, item['volume'])),
    });
  }
  return layers;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTheme(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isFadeDuration(value: unknown): value is FadeDuration {
  return value === 5 || value === 10 || value === 15;
}

function isTimerDuration(value: unknown): value is TimerDuration {
  return (
    value === 5 ||
    value === 10 ||
    value === 15 ||
    value === 20 ||
    value === 30 ||
    value === 45 ||
    value === 60 ||
    value === 'continuous'
  );
}

export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState(() => readSettings(inject(DOCUMENT))),
  withMethods((store) => {
    const update = (changes: Partial<AppSettings>): void => {
      patchState(store, changes);
    };

    return {
      updateTheme(theme: ThemePreference): void {
        update({ theme });
      },
      updateFadeDuration(fadeDuration: FadeDuration): void {
        update({ fadeDuration });
      },
      updateRememberSound(rememberSound: boolean): void {
        update({ rememberSound });
      },
      updateDefaultTimer(defaultTimer: TimerDuration): void {
        update({ defaultTimer });
      },
      updateVolume(volume: number): void {
        update({ volume: Math.min(1, Math.max(0, volume)) });
      },
      rememberSelection(lastSoundId: string, lastBackground: string): void {
        update({ lastSoundId, lastBackground });
      },
      updateMixLayers(mixLayers: readonly MixLayer[]): void {
        update({ mixLayers });
      },
      createBackup(): StilloraBackup {
        return {
          schemaVersion: 1,
          app: 'Stillora',
          exportedAt: new Date().toISOString(),
          settings: getState(store),
        };
      },
      restoreBackup(value: unknown): AppSettings {
        if (!isRecord(value) || value['app'] !== 'Stillora' || value['schemaVersion'] !== 1) {
          throw new Error('This is not a supported Stillora backup.');
        }
        const settings = mapSettings(value['settings']);
        patchState(store, settings);
        return settings;
      },
    };
  }),
  withHooks((store) => {
    const document = inject(DOCUMENT);
    return {
      onInit(): void {
        effect(() => writeSettings(document, getState(store)));
      },
    };
  }),
);
