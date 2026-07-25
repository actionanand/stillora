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
