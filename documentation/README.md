# Stillora

Stillora is a private, offline meditation and relaxation app built with Angular 22 and packaged for
Android with Capacitor. It plays bundled ambient audio over looping local video backgrounds, with
cross-fades, sleep timers, layered soundscapes, theme controls and local-only preferences.

## Run locally

Use Node 24.16 or another version allowed by `package.json`.

```bash
npm install
npm run develop
```

Open `http://localhost:3029/`.

Production checks:

```bash
npm run lint
npm test -- --watch=false
npm run build
```

## Architecture

```text
src/app/
|-- core/
|   |-- data/          # Typed ambient-sound catalogue
|   |-- models/        # Shared application contracts
|   |-- services/      # Audio, timer, video, presets and theme behavior
|   `-- stores/        # NgRx Signal Store with validated local persistence
|-- features/
|   |-- home/          # Player, atmosphere drawer and soundscape mixer
|   |-- mixes/         # Up to five named, reusable soundscape presets
|   |-- settings/      # Theme and playback preferences
|   `-- about/         # Offline/privacy information and credits
`-- shared/components/ # Background video and Android-style picker
```

Feature routes are lazy loaded and every service has one responsibility:

- `AudioService` owns the primary audio element and up to three optional mix layers, including
  looping, cross-fades, fades, per-layer volume and missing-file errors.
- `MediaControlsService` publishes the soundscape and play, pause, and stop actions to Android's
  notification, Quick Settings, lock screen, and supported media buttons.
- `TimerService` owns the session countdown and continuous mode.
- `SettingsStore` uses `@ngrx/signals` for theme, timer, volume, last atmosphere, active layers and
  up to five named presets, validating values as they load from `localStorage`.
- `ThemeService` resolves Light, Dark or System appearance and sends the effective result to
  Android's native system-bar bridge.
- `VideoService` selects the matching bundled video and exposes a gradient fallback state.
- `BackupFileService` transports versioned JSON backups through the browser or Android document
  picker. Backup mapping, validation, restoration and persistence remain in `SettingsStore`.

All audio and video files are served from `public/`; there is no account, database, API or backend.

## Android

See [ANDROID.md](ANDROID.md) for local builds, versioning, GitHub Actions artifacts and signing.
Splash-screen, system-bar, and media-session behavior is documented in
[ANDROID_SPECIAL_CASES.md](ANDROID_SPECIAL_CASES.md).

## Media assets

See [MEDIA_ASSETS.md](MEDIA_ASSETS.md) for audio/video libraries, licence checks, OGG conversion,
video preparation, and the checklist for adding new Stillora media.

## State management

See [NGRX_SIGNALS.md](NGRX_SIGNALS.md) for the project-focused guide to SignalStore state, side
effects, localStorage persistence, JSON backup mapping, testing, and the differences from classic
`@ngrx/store`.
