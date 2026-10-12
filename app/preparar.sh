#!/bin/sh
# Gera a versão online do jogo e copia para a pasta www que o Capacitor empacota.
set -e
cd "$(dirname "$0")/.."
python3 build.py --online
rm -rf app/www && mkdir -p app/www
cp docs/index.html app/www/index.html
cp docs/privacidade.html docs/manifest.webmanifest docs/icon-192.png docs/icon-512.png app/www/
echo "app/www pronta ($(wc -c < app/www/index.html) bytes)"
