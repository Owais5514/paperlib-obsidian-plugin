#!/bin/bash

# Release Preparation Script
# This script builds and packages both extensions for release

echo "🚀 Preparing Release..."
echo ""

# Clean old builds
echo "🧹 Cleaning old builds..."
rm -rf dist obsidian_paperlib/main.js node_modules obsidian_src/node_modules
rm -rf paperlib-extension-package obsidian-plugin-install release

# Build PaperLib Extension
echo ""
echo "📦 Building PaperLib Extension..."
yarn install --silent
yarn build

if [ ! -f "dist/main.js" ]; then
    echo "❌ PaperLib extension build failed!"
    exit 1
fi
echo "✅ PaperLib extension built successfully"

# Build Obsidian Plugin
echo ""
echo "📦 Building Obsidian Plugin..."
cd obsidian_src
npm install --silent
npm run build
cd ..

if [ ! -f "obsidian_paperlib/main.js" ]; then
    echo "❌ Obsidian plugin build failed!"
    exit 1
fi
echo "✅ Obsidian plugin built successfully"

# Create packages
echo ""
echo "📦 Creating installation packages..."
./package-extension.sh > /dev/null 2>&1
./package-obsidian.sh > /dev/null 2>&1

# Create release directory
mkdir -p release

# Create ZIP files for release
echo ""
echo "📦 Creating release archives..."
cd paperlib-extension-package
zip -r ../release/paperlib-extension-package.zip . > /dev/null 2>&1
cd ..

cd obsidian-plugin-install
zip -r ../release/obsidian-plugin-install.zip . > /dev/null 2>&1
cd ..

echo "✅ Release archives created"

# Show release contents
echo ""
echo "📋 Release Contents:"
echo "-------------------"
ls -lh release/

echo ""
echo "✅ Release preparation complete!"
echo ""
echo "📦 Files ready for release in ./release/"
echo "   - paperlib-extension-package.zip"
echo "   - obsidian-plugin-install.zip"
echo ""
echo "🚀 Ready to push to GitHub and create a release!"
