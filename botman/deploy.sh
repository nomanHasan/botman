#!/bin/bash
set -e 

TARGET_DIR="/mnt/Working_Directory/Details/aicr/src/pages/botman"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" || { echo "nvm not found"; exit 1; }

nvm use

echo "Building for production..."
npm run build

echo "Ensuring target directory exists: ${TARGET_DIR}"
mkdir -p "$TARGET_DIR"

echo "Cleaning target directory..."
rm -rf "${TARGET_DIR:?}"/*

echo "Copying build files to ${TARGET_DIR}..."
cp -R dist/* "$TARGET_DIR"

echo "Deployment complete."
