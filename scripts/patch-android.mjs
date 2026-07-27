import { access, copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const capacitorConfigPath = resolve('android/app/src/main/assets/capacitor.config.json');
const capacitorConfig = JSON.parse(await readFile(capacitorConfigPath, 'utf8'));
const appId = capacitorConfig.appId;

if (typeof appId !== 'string' || !appId.trim()) {
  throw new Error(`Android appId is missing from ${capacitorConfigPath}.`);
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const javaPath = resolve('android/app/src/main/java', ...appId.split('.'), 'MainActivity.java');
const manifestPath = resolve('android/app/src/main/AndroidManifest.xml');
const resPath = resolve('android/app/src/main/res');
const stylesPath = resolve(resPath, 'values/styles.xml');
const nightStylesPath = resolve(resPath, 'values-night/styles.xml');
const notificationIconPath = resolve(resPath, 'drawable/ic_stat_stillora.xml');
const splashSourcePath = resolve('public/stillora.png');
const splashLogoPath = resolve(resPath, 'drawable-nodpi/stillora_splash_logo.png');
const splashIconPath = resolve(resPath, 'drawable/stillora_splash_icon.xml');
const splashPath = resolve(resPath, 'drawable/splash.xml');

await access(javaPath).catch(() => {
  throw new Error(`Android project file not found: ${javaPath}. Run "npm run android:add" first.`);
});

let manifest = await readFile(manifestPath, 'utf8');
const foregroundServicePermissions = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
];
for (const permission of foregroundServicePermissions) {
  if (manifest.includes(`android:name="${permission}"`)) continue;
  manifest = manifest.replace(
    /(<manifest\b[^>]*>)/,
    `$1\n\n    <uses-permission android:name="${permission}" />`,
  );
}
manifest = manifest.replace(
  /<activity\b(?=[^>]*android:name="\.MainActivity")[^>]*>/,
  (activity) =>
    activity.includes('android:theme=')
      ? activity.replace(
          /android:theme="[^"]*"/,
          'android:theme="@style/AppTheme.NoActionBarLaunch"',
        )
      : activity.replace(/>$/, '\n            android:theme="@style/AppTheme.NoActionBarLaunch">'),
);
await writeFile(manifestPath, manifest, 'utf8');

await mkdir(dirname(notificationIconPath), { recursive: true });
await writeFile(
  notificationIconPath,
  `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M12,21c-4.4,-2.4 -7,-6.2 -7,-10.2C5,7.1 7.2,4 10.6,3c0.7,2.4 0.6,4.6 -0.3,6.6C12,7.8 14.2,6.5 17,6.2c1.1,4.8 -0.7,9.8 -5,14.8zM12,21c2.4,-3.5 3.4,-7 3,-10.6 -2.6,1.2 -4.2,3.5 -4.8,6.8 0.4,1.3 1,2.5 1.8,3.8z" />
</vector>`,
  'utf8',
);

for (const directory of await readdir(resPath)) {
  if (!directory.startsWith('drawable')) continue;
  const generatedSplashPng = resolve(resPath, directory, 'splash.png');
  const generatedSplashXml = resolve(resPath, directory, 'splash.xml');
  if (await fileExists(generatedSplashPng)) await rm(generatedSplashPng);
  if (directory !== 'drawable' && (await fileExists(generatedSplashXml))) {
    await rm(generatedSplashXml);
  }
}

await mkdir(dirname(splashLogoPath), { recursive: true });
await copyFile(splashSourcePath, splashLogoPath);
await writeFile(
  splashIconPath,
  `<?xml version="1.0" encoding="utf-8"?>
<inset xmlns:android="http://schemas.android.com/apk/res/android"
    android:drawable="@drawable/stillora_splash_logo"
    android:inset="22%" />`,
  'utf8',
);
await writeFile(
  splashPath,
  `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <shape android:shape="rectangle">
            <solid android:color="#07140E" />
        </shape>
    </item>
    <item android:gravity="center">
        <inset
            android:drawable="@drawable/stillora_splash_icon"
            android:inset="34%" />
    </item>
</layer-list>`,
  'utf8',
);

const ensureThemes = async (path, dark) => {
  await mkdir(dirname(path), { recursive: true });
  let styles;
  try {
    styles = await readFile(path, 'utf8');
  } catch {
    styles = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>\n';
  }

  const barColor = dark ? '#07140E' : '#F2F7F3';
  const lightIcons = dark ? 'false' : 'true';
  const body = `    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="android:windowActionModeOverlay">true</item>
        <item name="android:colorAccent">#176B43</item>
        <item name="android:windowBackground">${barColor}</item>
        <item name="android:statusBarColor">${barColor}</item>
        <item name="android:navigationBarColor">${barColor}</item>
        <item name="android:windowLightStatusBar">${lightIcons}</item>
        <item name="android:windowLightNavigationBar">${lightIcons}</item>
    </style>
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">#07140E</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/stillora_splash_icon</item>
        <item name="windowSplashScreenIconBackgroundColor">@android:color/transparent</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="android:statusBarColor">#07140E</item>
        <item name="android:navigationBarColor">#07140E</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowLightNavigationBar">false</item>
    </style>`;

  styles = styles.replace(/\s*<style name="AppTheme\.NoActionBar"[\s\S]*?<\/style>/g, '');
  styles = styles.replace(/\s*<style name="AppTheme\.NoActionBarLaunch"[\s\S]*?<\/style>/g, '');
  styles = styles.replace('</resources>', `${body}\n</resources>`);
  await writeFile(path, styles, 'utf8');
};

await ensureThemes(stylesPath, false);
await ensureThemes(nightStylesPath, true);

const source = `package ${appId};

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.widget.FrameLayout;
import android.widget.ImageView;

import com.getcapacitor.BridgeActivity;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
  private static final int BACKUP_EXPORT_REQUEST = 6401;
  private final Handler mainHandler = new Handler(Looper.getMainLooper());
  private boolean darkMode;
  private View launchOverlay;
  private long launchOverlayShownAt;
  private String pendingBackupJson = "";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    darkMode = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
      == Configuration.UI_MODE_NIGHT_YES;
    showLaunchOverlay();
    getBridge().getWebView().addJavascriptInterface(new StilloraNativeBridge(), "StilloraNative");
    getBridge().getWebView().addJavascriptInterface(new SystemBarsBridge(), "StilloraSystemBars");
    getWindow().setBackgroundDrawable(
      new android.graphics.drawable.ColorDrawable(Color.parseColor("#07140E"))
    );
    getBridge().getWebView().setBackgroundColor(Color.parseColor("#07140E"));
    applyLaunchBarStyle();
  }

  @Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (requestCode != BACKUP_EXPORT_REQUEST) return;
    String json = pendingBackupJson;
    pendingBackupJson = "";
    if (resultCode != Activity.RESULT_OK || data == null || data.getData() == null) return;
    Uri destination = data.getData();
    try (OutputStream output = getContentResolver().openOutputStream(destination)) {
      if (output == null) throw new IllegalStateException("The selected file could not be opened.");
      output.write(json.getBytes(StandardCharsets.UTF_8));
      output.flush();
    } catch (Exception ignored) { }
  }

  @Override
  public void onResume() {
    super.onResume();
    if (launchOverlay == null) applySystemBars(darkMode);
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus && launchOverlay == null) applySystemBars(darkMode);
  }

  public class SystemBarsBridge {
    @JavascriptInterface
    public void setDarkMode(boolean enabled) {
      darkMode = enabled;
      runOnUiThread(() -> applySystemBars(enabled));
    }
  }

  public class StilloraNativeBridge {
    @JavascriptInterface
    public void hideSplash() {
      runOnUiThread(() -> hideLaunchOverlay());
    }

    @JavascriptInterface
    public void exportBackupJson(String json, String fileName) {
      runOnUiThread(() -> {
        pendingBackupJson = json == null ? "" : json;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(
          Intent.EXTRA_TITLE,
          fileName == null || fileName.isEmpty() ? "stillora-backup.json" : fileName
        );
        startActivityForResult(intent, BACKUP_EXPORT_REQUEST);
      });
    }
  }

  private void showLaunchOverlay() {
    FrameLayout overlay = new FrameLayout(this);
    overlay.setBackgroundColor(Color.parseColor("#07140E"));
    overlay.setClickable(true);
    ImageView icon = new ImageView(this);
    icon.setImageResource(R.drawable.stillora_splash_logo);
    icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
    FrameLayout.LayoutParams iconLayout = new FrameLayout.LayoutParams(dp(156), dp(156));
    iconLayout.gravity = Gravity.CENTER;
    overlay.addView(icon, iconLayout);
    addContentView(
      overlay,
      new ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    );
    launchOverlay = overlay;
    launchOverlayShownAt = System.currentTimeMillis();
  }

  private void hideLaunchOverlay() {
    View overlay = launchOverlay;
    if (overlay == null) return;
    long remaining = Math.max(0L, 900L - (System.currentTimeMillis() - launchOverlayShownAt));
    if (remaining > 0L) {
      mainHandler.postDelayed(this::hideLaunchOverlay, remaining);
      return;
    }
    launchOverlay = null;
    overlay.animate().alpha(0f).setDuration(180).withEndAction(() -> {
      if (overlay.getParent() instanceof ViewGroup) {
        ((ViewGroup) overlay.getParent()).removeView(overlay);
      }
      applySystemBars(darkMode);
    }).start();
  }

  private int dp(int value) {
    return Math.round(value * getResources().getDisplayMetrics().density);
  }

  @SuppressWarnings("deprecation")
  private void applySystemBars(boolean dark) {
    Window window = getWindow();
    int background = Color.parseColor(dark ? "#07140E" : "#F2F7F3");
    window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(background));
    window.getDecorView().setBackgroundColor(background);
    getBridge().getWebView().setBackgroundColor(background);
    window.setStatusBarColor(background);
    window.setNavigationBarColor(background);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.setStatusBarContrastEnforced(false);
      window.setNavigationBarContrastEnforced(false);
    }
    View decor = window.getDecorView();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      WindowInsetsController controller = decor.getWindowInsetsController();
      if (controller != null) {
        int appearance = dark
          ? 0
          : WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
            | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
        controller.setSystemBarsAppearance(
          appearance,
          WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
            | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
        );
      }
      return;
    }
    int flags = decor.getSystemUiVisibility();
    flags = dark
      ? flags & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
      : flags | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      flags = dark
        ? flags & ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        : flags | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
    }
    decor.setSystemUiVisibility(flags);
  }

  @SuppressWarnings("deprecation")
  private void applyLaunchBarStyle() {
    Window window = getWindow();
    int background = Color.parseColor("#07140E");
    window.setStatusBarColor(background);
    window.setNavigationBarColor(background);
    View decor = window.getDecorView();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      WindowInsetsController controller = decor.getWindowInsetsController();
      if (controller != null) {
        controller.setSystemBarsAppearance(
          0,
          WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
            | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
        );
      }
    }
  }
}
`;

await writeFile(javaPath, source, 'utf8');
console.log(
  'Applied Stillora Android splash, system-bar, media-playback permission, and notification-icon patches.',
);
