# Stillora

Stillora is a private, offline meditation and relaxation app built with Angular 22 and packaged for
Android with Capacitor. It plays bundled ambient audio over looping local video backgrounds, with
cross-fades, sleep timers, theme controls and local-only preferences.

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
├── core/
│   ├── data/          # Typed ambient-sound catalogue
│   ├── models/        # Shared application contracts
│   └── services/      # Audio, timer, video, settings and theme state
├── features/
│   ├── home/          # Player, sound library, timer and volume sheets
│   ├── settings/      # Theme and playback preferences
│   └── about/         # Offline/privacy information and credits
└── shared/components/ # Background video and Android-style picker
```

Feature routes are lazy loaded. Signals hold local state and derived values. The services each have
one responsibility:

- `AudioService` owns the only active HTML audio element and handles looping, cross-fades, fades,
  volume and missing-file errors.
- `TimerService` owns the session countdown and continuous mode.
- `SettingsService` persists only the approved preferences to `localStorage`.
- `ThemeService` resolves Light, Dark or System appearance and sends the effective result to
  Android's native system-bar bridge.
- `VideoService` selects the matching bundled video and exposes a gradient fallback state.

All audio and video files are served from `public/`; there is no account, database, API or backend.

## Android

See [documentation/ANDROID.md](documentation/ANDROID.md) for local builds, versioning, GitHub
Actions artifacts and signing. Splash-screen and system-bar behavior is documented in
[documentation/ANDROID_SPECIAL_CASES.md](documentation/ANDROID_SPECIAL_CASES.md).
