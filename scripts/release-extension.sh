#!/usr/bin/env bash
# Build and publish a new Life Checker browser extension release.
# Usage: ./scripts/release-extension.sh 1.0.0
set -e

VERSION=${1:?Usage: $0 <version>}

echo "→ Syncing latest life-checker.js into extension..."
cp src/life-checker.js extension/life-checker.js

echo "→ Updating extension version to $VERSION..."
node -e "
  const fs = require('fs');
  const m = JSON.parse(fs.readFileSync('extension/manifest.json', 'utf8'));
  m.version = '$VERSION';
  fs.writeFileSync('extension/manifest.json', JSON.stringify(m, null, 2) + '\n');
"

echo "→ Building zip..."
rm -f "life-checker-extension-v${VERSION}.zip"
zip -r "life-checker-extension-v${VERSION}.zip" extension/ -x "*.DS_Store"

echo "→ Committing..."
git add extension/ "life-checker-extension-v${VERSION}.zip"
git commit -m "Release extension v${VERSION}"
git push

echo "→ Creating GitHub release v${VERSION}..."
gh release create "v${VERSION}" \
  "life-checker-extension-v${VERSION}.zip" \
  --title "Life Checker Extension v${VERSION}" \
  --notes "## Install

1. Download \`life-checker-extension-v${VERSION}.zip\` and unzip it
2. Open **chrome://extensions** in Chrome or Edge
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the unzipped folder

## Update from a previous version

Remove the old extension in chrome://extensions, then follow the install steps above with the new zip."

echo "✓ Done — release v${VERSION} published."
