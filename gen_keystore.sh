#!/bin/bash
keytool -genkey -v \
  -keystore /Users/vikashraj/Desktop/dev/ludo-raza-release.keystore \
  -alias ludo-raza \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass 'LudoRaza@2024' \
  -keypass 'LudoRaza@2024' \
  -dname "CN=Vikash Raj, OU=LudoRaza, O=Vikash, L=India, S=India, C=IN"
echo "Keystore generated at /Users/vikashraj/Desktop/dev/ludo-raza-release.keystore"
