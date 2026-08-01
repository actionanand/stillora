# Android R8 and deobfuscation files

## What the Play Console warning means

Google Play can show this warning after an Android App Bundle is uploaded:

> There is no deobfuscation file associated with this App Bundle.

The warning does not block a release. It means Google Play did not find the R8 or ProGuard mapping
for that application version. Without the matching mapping, obfuscated Java or Kotlin crash and
ANR stack traces can contain shortened names such as `a.b.c()` instead of useful source names.

## Stillora's release configuration

Stillora generates `android/` locally and in CI. `scripts/patch-android.mjs` therefore changes the
generated `android/app/build.gradle` release configuration after every Capacitor sync to the
equivalent of:

```groovy
release {
    minifyEnabled true
    shrinkResources true
    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
}
```

- `minifyEnabled true` runs R8 code shrinking, optimization, and obfuscation.
- `shrinkResources true` removes Android resources that are no longer reachable after code
  shrinking.
- `proguard-android-optimize.txt` supplies Android's optimized default rules.
- `proguard-rules.pro` contains Stillora-specific keep rules.

Stillora exposes native methods to Angular with Android WebView JavaScript interfaces. Those
methods are found by name at runtime, so the patch preserves every method annotated with
`@JavascriptInterface`:

```proguard
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
```

Capacitor and installed plugins supply their own consumer rules. Do not add broad rules such as
`-keep class ** { *; }`, because they effectively disable the size and obfuscation benefits of R8.

## Mapping generation and preservation

Every optimized release produces:

```text
android/app/build/outputs/mapping/release/mapping.txt
```

The mapping is unique to the exact `versionCode` and release binary. Stillora's Android workflow:

1. Enables R8 through the native patch.
2. Builds both `assembleRelease` and `bundleRelease`.
3. Requires the APK, AAB, and non-empty `mapping.txt` to exist.
4. Copies the mapping to `releases/stillora-<version>-mapping.txt`.
5. Includes it in the `main-android` release commit, GitHub Actions artifact, and tagged GitHub
   Release.

If R8 is not enabled or the mapping is missing, CI fails before publishing artifacts. The Android
App Bundle also normally contains the mapping metadata for Google Play to extract automatically.

## Uploading or attaching the mapping in Play Console

Upload the newly generated AAB normally. If Play Console still does not associate a ReTrace
mapping automatically:

1. Open **Test and release > App bundle explorer**.
2. Select the exact Stillora version and `versionCode`.
3. Open **Downloads** and locate the deobfuscation or ReTrace mapping section.
4. Upload the matching `releases/stillora-<version>-mapping.txt`.

Never upload a mapping produced by another build or version. A new mapping cannot correctly decode
an older published binary.

## Local verification

After generating and patching the Android project:

```bash
npm run android:sync
cd android
./gradlew assembleRelease bundleRelease
test -s app/build/outputs/mapping/release/mapping.txt
```

To inspect the generated release configuration:

```bash
grep -nE 'minifyEnabled|shrinkResources|proguardFiles' app/build.gradle
```

Test the optimized release build on a physical Android device. R8 can expose reflection or
runtime-name assumptions that are not exercised by a debug build. Specifically verify startup,
splash dismissal, light/dark system bars, playback, media notification controls, settings backup
export/import, and all mixer operations.

## Mapping-file handling

- Keep every mapping for as long as its corresponding release is supported.
- Do not edit, merge, or regenerate a mapping after publishing its APK or AAB.
- The mapping does not contain signing passwords, keys, audio files, or user data.
- It does reveal original native symbol names. For a public repository, consider retaining the
  standalone file in private CI storage rather than committing it publicly.

## Official references

- [Android: enable app optimization](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization)
- [Android: troubleshoot optimization and use ReTrace](https://developer.android.com/topic/performance/app-optimization/troubleshoot-the-optimization)
- [Google Play: deobfuscate or symbolicate crash stack traces](https://support.google.com/googleplay/android-developer/answer/9848633?hl=en)
