# Mobile Android Release And Play Store Guide

Last updated: April 9, 2026

## Purpose

This document keeps the Android release and Google Play rollout steps in one place so MedhaTile can move from a local React Native app to a signed Play Store release without re-discovering the setup later.

## Current Repo State

What is already in place:
- React Native CLI Android and iOS native projects exist under `mobile/android` and `mobile/ios`
- Android SDK targets are already Play-friendly:
  - `compileSdkVersion = 35`
  - `targetSdkVersion = 35`
- Mobile app supports:
  - auth
  - choose-game
  - 2048
  - leaderboard
- Root validation is already standardized through:
  - `npm run build`
  - `npm run precommit`

What is not release-ready yet:
- Android `release` still needs a real signing config instead of debug signing
- Play Console listing/content setup is not done
- privacy policy and Data safety submission still need to be prepared
- production release testing on real devices still needs to be completed

## Files To Touch For Android Release

Primary repo files:
- `mobile/android/app/build.gradle`
- `mobile/android/gradle.properties`
- `mobile/android/app/src/main/AndroidManifest.xml`
- `mobile/android/app/src/main/res/values/strings.xml`
- `mobile/app.json`
- `.gitignore`

Operational docs:
- `README.md`
- `mobile/README.md`
- this document

## Release Decisions To Finalize First

Before first Play upload, confirm these decisions:

1. App identity
- Final package name: currently `com.medhatilemobile`
- Final display name: currently `MedhaTileMobile`

2. Release scope
- Android first
- Internal testing first
- Public production only after internal validation

3. Backend readiness
- Production backend URL must be stable
- Login, session restore, leaderboard, and score save must work against production

## Release Signing Setup

Google Play uploads must use a real upload key. Do not use the debug keystore for release.

### Step 1: Generate an upload keystore

Run from a safe local folder, not from a committed repo path unless that file is ignored:

```bat
keytool -genkeypair -v ^
  -storetype PKCS12 ^
  -keystore medhatile-upload-key.keystore ^
  -alias medhatileupload ^
  -keyalg RSA ^
  -keysize 2048 ^
  -validity 10000
```

Keep this file backed up securely. Losing it complicates future release updates.

### Step 2: Store signing values locally

Recommended local-only values:
- `MYAPP_UPLOAD_STORE_FILE`
- `MYAPP_UPLOAD_KEY_ALIAS`
- `MYAPP_UPLOAD_STORE_PASSWORD`
- `MYAPP_UPLOAD_KEY_PASSWORD`

Preferred locations:
- user-level Gradle properties
- untracked local Gradle properties
- CI/CD secret store later

Do not commit passwords or private keystore files.

### Step 3: Update Android release signing

Change `mobile/android/app/build.gradle` so:
- `release` uses a real `signingConfigs.release`
- `debug` continues using debug signing
- `release` no longer points at `signingConfigs.debug`

Expected end state:
- release signing values are read from properties or environment variables
- build fails clearly if release signing values are missing

### Step 4: Keep secrets out of Git

Ensure `.gitignore` covers:
- local release keystore path
- generated build outputs
- any local signing property file if created inside the repo

## Android Release Build Commands

From the repo root, validate first:

```bat
cd /d D:\code\medhatile
npm run build
```

Then build Android release artifacts:

### Build the Play upload artifact

```bat
cd /d D:\code\medhatile\mobile\android
gradlew.bat bundleRelease
```

Expected output:

```txt
mobile\android\app\build\outputs\bundle\release\app-release.aab
```

### Optional device-installable release APK

```bat
cd /d D:\code\medhatile\mobile\android
gradlew.bat assembleRelease
```

Expected output:

```txt
mobile\android\app\build\outputs\apk\release\app-release.apk
```

## Real Device Validation Before Play Upload

Test on at least one physical Android device.

Required checks:
- app installs successfully
- app opens without Metro
- login works
- register works
- session restore works after relaunch
- choose-game screen renders
- 2048 works
- swipe controls work on mobile
- leaderboard loads
- save score works
- logout clears session

Nice-to-have checks:
- test on at least one lower-end device
- test on slow or unstable network
- test on a tablet-sized device if available

## Play Console Checklist

### App setup
- Create app in Play Console
- Set default language
- Set app name
- Choose app or game category correctly
- Confirm whether the app is free or paid

### Signing
- Enroll in Play App Signing
- Upload the signed `.aab`

### Store listing assets
- app name
- short description
- full description
- app icon
- feature graphic
- phone screenshots
- tablet screenshots if supported

### Policy and compliance
- privacy policy URL
- app content declarations
- Data safety form
- contact email
- ads declaration if relevant
- age/content rating questionnaire

## Recommended Rollout Path

### Phase 1: Internal testing
- Upload first `.aab` to Internal testing
- Add tester accounts
- Verify install and app behavior

### Phase 2: Closed testing
- Expand to a small trusted group
- Gather feedback on device compatibility and auth issues

### Phase 3: Production
- Promote only after internal/closed test confidence is high

## Release Readiness Checklist

Use this before every Play upload:

- `npm run build` passes
- release signing is configured
- `bundleRelease` succeeds
- `versionCode` is incremented
- `versionName` is updated if needed
- release build tested on a real Android device
- backend production URL is correct
- privacy policy is still valid
- Data safety answers still match actual app behavior
- release notes are prepared

## Versioning Rules

For every new Play upload:
- increase `versionCode`
- update `versionName` when appropriate

Suggested pattern:
- `versionCode`: integer increasing every upload
- `versionName`: semantic version such as `1.0.0`, `1.0.1`, `1.1.0`

## Post-Release Checks

After rollout:
- monitor crash reports
- check Play pre-launch report
- verify login and API health in production
- verify leaderboard and save-score flows
- confirm no release-only Metro/bundling regressions

## Handy Commands

Root validation:

```bat
cd /d D:\code\medhatile
npm run build
```

Android release bundle:

```bat
cd /d D:\code\medhatile\mobile\android
gradlew.bat bundleRelease
```

Android release APK:

```bat
cd /d D:\code\medhatile\mobile\android
gradlew.bat assembleRelease
```

Stop Gradle daemons if needed:

```bat
cd /d D:\code\medhatile\mobile\android
gradlew.bat --stop
```

## Notes For Later

- The mobile `Identifying Tiles` flow is still pending and does not block the current Android release plan if the first release scope is intentionally limited.
- If branding changes before first store upload, update both Android package/display values before publishing.
- If CI/CD is added later, migrate signing values from local machine setup to secure pipeline secrets.
