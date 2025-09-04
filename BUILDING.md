# MealsApp Build Instructions

## Building APKs for Android

### Debug APK


To generate a debug APK that includes all dependencies and el bundle JS (independent APK), run:

```bash
npm install
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
cd android
chmod +x gradlew
./gradlew assembleDebug
```

The debug APK will be located at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK

To generate a release APK, run:

```bash
cd android
./gradlew assembleRelease
```

The release APK will be located at:

```
android/app/build/outputs/apk/release/app-release.apk
```

jobs:

## GitHub Actions Pipeline

Create a `.github/workflows/android-build.yml` file with the following content:

```yaml
name: Android Build
on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]


  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        run: git clone ${{ github.repository }} .
      - name: Set up Node.js
        run: |
          curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
          apt-get install -y nodejs
      - name: Install dependencies
        run: npm install
      - name: Set up JDK
        run: |
          sudo apt-get update
          sudo apt-get install -y openjdk-17-jdk
      - name: Build Debug APK
        run: npx react-native run-android --variant=debug
      - name: Build Release APK
        run: |
          cd android
          ./gradlew assembleRelease
```

This pipeline will build both debug and release APKs for each push or pull request to the `master` branch. The APKs will be available in the build output directory.
      - name: Upload Release APK
