#!/bin/bash

# PaperLib Extension Package Script
# This script creates a proper extension package for PaperLib

echo "📦 Creating PaperLib extension package..."

# Create output directory
OUTPUT_DIR="paperlib-extension-package"

# Remove old package if it exists
if [ -d "$OUTPUT_DIR" ]; then
    echo "🗑️  Removing old package..."
    rm -rf "$OUTPUT_DIR"
fi

mkdir -p "$OUTPUT_DIR/dist"

# Copy required files
echo "📋 Copying files..."
cp package.json "$OUTPUT_DIR/"
cp dist/main.js "$OUTPUT_DIR/dist/"

# Create a README in the package
cat > "$OUTPUT_DIR/README.txt" << 'EOF'
PaperLib Obsidian Integration Extension
========================================

INSTALLATION INSTRUCTIONS:
--------------------------

1. Open PaperLib
2. Go to Settings → Extensions
3. Click "Install from Local" or "Load Extension"
4. SELECT THIS ENTIRE FOLDER (paperlib-extension-package)
   - Do NOT select just the main.js file
   - Do NOT select the dist folder
   - Select the folder that contains both package.json and dist/

5. After installation:
   - Toggle the extension ON
   - Click on it to configure settings
   - Set your Obsidian Vault Path (full path!)
   - Set Literature Notes Folder: Literature Notes
   - Set Assets Folder: assets
   - Enable Protocol Handler: ON

6. Test it:
   - Right-click any paper in PaperLib
   - Select "Open in Obsidian"
   - Your paper should open in Obsidian with metadata and PDF!

REQUIRED FILES IN THIS PACKAGE:
--------------------------------
✓ package.json - Extension metadata (REQUIRED)
✓ dist/main.js - Extension code (REQUIRED)

If any file is missing, the extension won't work!

TROUBLESHOOTING:
----------------
- Make sure you point PaperLib to THIS folder
- Both package.json and dist/main.js must be present
- Extension must be toggled ON after installation
- Restart PaperLib if changes don't appear

For detailed help, see PAPERLIB_INSTALLATION.md
EOF

# Show result
echo ""
echo "✅ Package created successfully!"
echo ""
echo "📁 Location: ./$OUTPUT_DIR/"
echo ""
echo "📝 Files included:"
ls -lh "$OUTPUT_DIR"
ls -lh "$OUTPUT_DIR/dist"
echo ""
echo "🚀 Next steps:"
echo "   1. Open PaperLib"
echo "   2. Go to Settings → Extensions"
echo "   3. Click 'Install from Local'"
echo "   4. Select the '$OUTPUT_DIR' folder"
echo "   5. Enable the extension and configure settings"
echo ""
echo "📖 See $OUTPUT_DIR/README.txt for detailed instructions"
