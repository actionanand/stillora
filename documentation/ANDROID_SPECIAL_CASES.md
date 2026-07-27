# Android splash and system-bar special cases

These Android surfaces appear before or outside Angular's WebView, so CSS alone cannot control
them. Run `npm run android:sync` after any native-theme or splash change so
`scripts/patch-android.mjs` can reapply them.

## Branded cold-start splash

Android 12+ draws a system launch window before Angular, JavaScript, Capacitor plugins or the
WebView exist. Stillora handles the launch in three layers:

1. `AndroidManifest.xml` assigns `AppTheme.NoActionBarLaunch` to `MainActivity`.
2. The launch theme uses the dark `#07140E` background and transparent
   `stillora_splash_icon`, then switches to `AppTheme.NoActionBar`.
3. `MainActivity` briefly displays the same transparent `public/stillora.png` while Angular
   renders. `ThemeService` calls `StilloraNative.hideSplash()` after initialization.

`public/stillora.png` is the canonical image. Keep its transparent background; Android controls the
system splash mask and safe area.

Capacitor may generate legacy `res/drawable*/splash.png` files during synchronization. The patch
removes those before writing `res/drawable/splash.xml`, preventing duplicate-resource errors and
white launch frames.

Verify a force-stopped cold launch on Android 12+ and one older supported version, in portrait and
landscape. Confirm there is no white tile, flash, clipping, stretching or mismatched transition.

## Light, dark and system bars

The Angular theme service sends the effective theme to
`StilloraSystemBars.setDarkMode(...)`. Native code then:

- sets status and navigation bar backgrounds to `#F2F7F3` in light mode or `#07140E` in dark
  mode;
- applies the same color to the Android window, decor view and WebView;
- uses dark system icons on light bars and white system icons on dark bars;
- disables automatic contrast scrims where Android supports it; and
- reapplies styling when the app resumes or regains focus.

System theme follows `prefers-color-scheme` inside Angular and Android's night configuration during
cold start.

Test:

1. Light, Dark and System theme choices.
2. Theme changes while Stillora is open.
3. Backgrounding and resuming the app.
4. Status icons and gesture/navigation bar icons on light and dark device themes.
5. Portrait, landscape, three-button navigation and gesture navigation.

## Notification icon

`ic_stat_stillora` is white vector artwork on transparency. This is intentional: Android masks and
tints notification small icons for the current system surface. Do not use the full-color launcher
image as a notification small icon; it can render as a solid square.

## Playback media session

An ordinary Angular button cannot add controls to Android's system media surfaces. Stillora uses
`@capgo/capacitor-media-session` to publish the selected atmosphere and to receive native play,
pause, and stop actions. `AudioService` keeps the main audio and mixer layers aligned with the
native playback state through `MediaControlsService`; the existing video signal follows the same
playback state.

The session becomes active only after audio starts successfully. Pause keeps a resumable session;
Stop, a completed fade-out, an audio error, or disabling the setting publishes the `none` state so
Android can remove the controls. Android controls the final notification and Quick Settings layout.

Run `npx cap sync android` after installing or updating the plugin. Browser-only testing cannot
verify the Android notification, lock-screen, headset, or background-process behavior.

The plugin service declares `android:foregroundServiceType="mediaPlayback"`. Stillora's native
patch adds the matching `android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK` permission required
when targeting Android 14 or newer. Keep that permission in the merged manifest; otherwise Android
throws a process-level `SecurityException` as playback starts.

## Settings backup files

Stillora backups are small, human-readable JSON files. In the Android build,
`StilloraNative.exportBackupJson(...)` opens `ACTION_CREATE_DOCUMENT`, allowing the user to choose
the destination. The app writes only to that selected document and does not request broad storage
permission. Import uses the WebView file chooser; the NgRx Signal Store validates and maps the
versioned schema before restoring theme, playback preferences, last atmosphere and mixer layers.
