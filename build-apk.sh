#!/bin/zsh
# Script para generar el APK de depuración de MealsApp

set -e

# Instalar dependencias JS
npm install

# Limpiar build de Android solo si se pasa --clean
if [[ "$1" == "--clean" ]]; then
	cd android
	./gradlew clean
	cd ..
fi

# Crear carpetas necesarias
mkdir -p android/app/src/main/assets
mkdir -p android/app/src/main/res

# Generar el bundle JS y copiar assets
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# Compilar el APK
cd android
chmod +x gradlew
./gradlew assembleDebug

# Mostrar ubicación del APK
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
echo "APK generado en: $APK_PATH"
