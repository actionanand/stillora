# Stillora Android build guide

Stillora uses Capacitor and GitHub Actions to package the Angular application as Android APK and
AAB artifacts. The `android/` directory is generated locally or in CI and is intentionally not
committed.

## Build files

| File                                  | Purpose                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `capacitor.config.ts`                 | App ID, name, Angular output directory, native background and splash defaults                  |
| `.github/workflows/android-build.yml` | Lints, tests, builds, signs, verifies and uploads Android artifacts                            |
| `android-version.json`                | Android `versionCode` and `versionName`                                                        |
| `scripts/bump-android-version.js`     | Increments Android versions                                                                    |
| `scripts/patch-android.mjs`           | Applies R8, splash, system bars, notification icon and backup export after each Capacitor sync |
| `scripts/generate-keystore.mjs`       | Creates a PKCS12 release keystore                                                              |
| `scripts/detect-keystore-format.mjs`  | Reports a keystore's internal format                                                           |
| `public/stillora.png`                 | Canonical launcher, splash and Play Store icon source                                          |

## Local workflow

Install the locked dependencies, build Angular and generate the native project:

```bash
npm ci
npm run android:add
npm run android:sync
```

`android:sync` rebuilds Angular, synchronizes Capacitor, and reapplies Stillora's idempotent native
patch. Open the generated project in Android Studio:

```bash
npm run android:open
```

If `android/` does not exist, `npx cap sync android` reporting a missing platform is expected. Run
`npm run android:add` first.

## Notification and lock-screen media controls

Stillora publishes the current atmosphere to Android's media session. This provides play/pause and
stop actions in the notification shade, Quick Settings media area, lock screen, and supported
headsets. The notification represents the whole soundscape: the selected atmosphere is the title
and active mixer layers continue to follow the same controls.

Install the Capacitor 8-compatible plugin from WSL:

```bash
npm i @capgo/capacitor-media-session@8.0.29 --save-exact
npx cap sync android
```

The dependency is already declared in `package.json`; running the first command also updates
`package-lock.json`. A normal `npm run android:sync` builds Angular, synchronizes the plugin, and
reapplies Stillora's native patch.

The native patch declares both `FOREGROUND_SERVICE` and
`FOREGROUND_SERVICE_MEDIA_PLAYBACK`. Android 14 and newer enforce the type-specific permission
when the media plugin starts its playback foreground service. Omitting it causes a native
`SecurityException` when Play is pressed.

The **Settings > Playback > Notification media controls** switch is enabled by default. It is
stored by `SettingsStore` in local storage and included in Stillora JSON exports. Turning it off
removes the active media session without stopping in-app playback.

Android chooses the exact button arrangement for the OS version and device. Test on a physical
device:

1. Start an atmosphere and open the notification shade and Quick Settings.
2. Confirm the Stillora title, atmosphere name, and playing state.
3. Pause and resume from Android, then confirm the in-app button and background video follow.
4. Stop from Android and confirm audio, mixer layers, video, and the media notification stop.
5. Repeat from the lock screen and a headset if available.
6. Disable the setting while playing and confirm the media controls disappear.

The current player uses bundled HTML audio inside Capacitor's WebView. Device manufacturers can
apply different background-process limits, so long-running playback with the screen off must be
tested on every supported Android family.

## Versioning

```bash
npm run android:version
npm run android:version:patch
npm run android:version:minor
npm run android:version:major
```

The plain command increments only `versionCode`. The other commands increment `versionCode` and
the selected part of `versionName`. Google Play requires `versionCode` to increase for every
uploaded release.

## CI triggers and artifacts

The workflow runs manually, on the `main-android` branch, and for `v*` tags.

- Every run creates a release APK and AAB.
- With complete signing secrets, CI publishes `stillora-<version>.apk` and
  `stillora-<version>.aab`.
- Without signing secrets, or when signing fails, CI publishes clearly named
  `stillora-<version>-unsigned.apk` and `stillora-<version>-unsigned.aab`.
- APK, AAB and `playstore-icon.png` are retained as workflow artifacts for 30 days.
- Every release requires and preserves its matching R8 mapping as
  `stillora-<version>-mapping.txt`.
- Builds on `main-android` also commit the generated release files under `releases/`.
- Tag builds create a GitHub Release.
- A missing APK or AAB fails the job instead of producing an empty successful workflow.

The CI environment uses minimum SDK 24, target SDK 36, Java 21 and Node 24.16.

## R8 optimization and Play Console mappings

Release builds enable R8 obfuscation and resource shrinking. The workflow fails when Gradle does
not generate a non-empty mapping, then preserves that exact file with the APK and AAB for Play
Console crash and ANR deobfuscation.

See [R8-DEOBFUSCATION.md](R8-DEOBFUSCATION.md) for the generated Gradle configuration, keep rules,
mapping location, Play Console upload steps, and physical-device verification checklist.

## Signing secrets

Add these under **Repository Settings → Secrets and variables → Actions**:

| Secret              | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `KEYSTORE_BASE64`   | Base64 text containing the complete keystore               |
| `KEYSTORE_PASSWORD` | Password used to open the keystore                         |
| `KEY_ALIAS`         | Signing-key alias; the included generator uses `stillora`  |
| `KEY_PASSWORD`      | Private-key password; for PKCS12 use the keystore password |

Generate the keystore once on a trusted Linux or WSL machine:

```bash
npm run generate-keystore -- --password 'YOUR_STRONG_PASSWORD'
# or
npm run generate-keystore
test -s release-keystore.jks && base64 -w 0 release-keystore.jks > keystore.b64.txt
```

Verify its type:

```bash
npm run keystore:type
```

Never commit the keystore, its Base64 representation, or any password. Keep an offline backup;
losing the release key can prevent future Play Store updates.

## Theme and splash behavior

Angular CSS cannot style Android surfaces shown before or outside the WebView.
`scripts/patch-android.mjs` therefore:

- applies Stillora's dark branded Android 12+ launch theme;
- shows the same transparent logo until Angular is ready;
- gives light mode matching light status/navigation bars with dark icons;
- gives dark mode matching dark bars with white icons;
- synchronizes the window, decor view and WebView background so no white top or bottom strip can
  appear;
- reapplies bar styling after the app resumes or regains focus; and
- writes `ic_stat_stillora`, a white vector icon suitable for Android notification tinting.
- sends the full Stillora JSON backup to Android's system document picker without broad storage
  permission.

See [ANDROID_SPECIAL_CASES.md](ANDROID_SPECIAL_CASES.md) for the device verification checklist.
