#!/bin/bash

# Obsidian Plugin Package Script
# This script creates a ready-to-install package for Obsidian

echo "📦 Creating Obsidian plugin package..."

# Create output directory
OUTPUT_DIR="obsidian-plugin-install"

# Remove old package if it exists
if [ -d "$OUTPUT_DIR" ]; then
    echo "🗑️  Removing old package..."
    rm -rf "$OUTPUT_DIR"
fi

mkdir -p "$OUTPUT_DIR"

# Copy required files
echo "📋 Copying files..."
cp obsidian_paperlib/main.js "$OUTPUT_DIR/"
cp obsidian_paperlib/manifest.json "$OUTPUT_DIR/"
cp obsidian_paperlib/styles.css "$OUTPUT_DIR/"
cp obsidian_paperlib/data.json "$OUTPUT_DIR/"

# Create a README in the package
cat > "$OUTPUT_DIR/README.txt" << 'EOF'
PaperLib Integration - Obsidian Plugin
=======================================

📦 THIS PLUGIN HAS FULL PDF IMPORT SUPPORT! 📦

INSTALLATION INSTRUCTIONS:
--------------------------

1. LOCATE YOUR OBSIDIAN VAULT'S PLUGIN FOLDER:
   
   Your vault path + .obsidian/plugins/paperlib-integration/
   
   Examples:
   Mac:     ~/Documents/MyVault/.obsidian/plugins/paperlib-integration/
   Windows: C:\Users\YourName\Documents\MyVault\.obsidian\plugins\paperlib-integration\
   Linux:   ~/Documents/MyVault/.obsidian/plugins/paperlib-integration/

2. CREATE THE FOLDER IF IT DOESN'T EXIST:
   
   Create: .obsidian/plugins/paperlib-integration/
   
   Note: .obsidian is a hidden folder!
   - Mac/Linux: Use "Show Hidden Files" or terminal
   - Windows: Enable "Show hidden files" in File Explorer

3. COPY ALL FILES FROM THIS FOLDER INTO IT:
   
   Copy these 4 files:
   ✓ main.js         (59 KB - with PDF import!)
   ✓ manifest.json   (required)
   ✓ styles.css      (optional styles)
   ✓ data.json       (default settings)
   
   Final structure should be:
   YOUR_VAULT/
   └── .obsidian/
       └── plugins/
           └── paperlib-integration/
               ├── main.js
               ├── manifest.json
               ├── styles.css
               └── data.json

4. RESTART OBSIDIAN
   - Close Obsidian completely
   - Reopen it

5. ENABLE THE PLUGIN:
   - Open Obsidian Settings (gear icon)
   - Go to: Community plugins
   - Find "Paperlib Integration"
   - Toggle it ON

6. CONFIGURE THE PLUGIN:
   - In Settings, click "Paperlib Integration"
   - Set "Literature Notes Folder": Literature Notes
   - Click "Create" button to create the folder
   - Set "Assets Folder": assets
   - Click "Create" button to create the folder
   - Keep "Enable Protocol Handler": ON
   - Optionally customize the Note Template

7. TEST IT:
   - In PaperLib, right-click a paper
   - Select "Open in Obsidian"
   - Check that:
     ✓ Note appears in Literature Notes/
     ✓ PDF copied to assets/
     ✓ Note has all metadata
     ✓ PDF link works

REQUIRED FILES IN THIS PACKAGE:
--------------------------------
✓ main.js - Plugin code (59 KB with PDF import support!)
✓ manifest.json - Plugin metadata (REQUIRED)
✓ styles.css - Plugin styles
✓ data.json - Default settings and template

FEATURES:
---------
✅ Creates notes in "Literature Notes" folder
✅ Copies PDF files to "assets" folder  
✅ Imports ALL metadata from PaperLib
✅ Creates clickable PDF links: [[assets/paper.pdf]]
✅ Customizable note template
✅ All properties: title, authors, date, abstract, tags, url, etc.

TROUBLESHOOTING:
----------------

❌ Plugin not showing in list?
   → Check that all 4 files are in the correct folder
   → Restart Obsidian completely
   → Check folder name is exactly: paperlib-integration

❌ Can't find .obsidian folder?
   → It's hidden! Enable "Show hidden files"
   → Mac: Cmd+Shift+. in Finder
   → Windows: View → Show → Hidden items
   → Linux: Ctrl+H in file manager

❌ PDF not copying?
   → Check PaperLib extension settings
   → Make sure "Obsidian Vault Path" is set correctly
   → Must be FULL path: /Users/name/Documents/MyVault
   → Both apps need protocol handler enabled

❌ "Open in Obsidian" not working?
   → Restart both PaperLib AND Obsidian
   → Check protocol handler is ON in both apps
   → Check vault path in PaperLib extension

QUICK TERMINAL INSTALLATION (Mac/Linux):
-----------------------------------------

If you're comfortable with terminal:

# Replace /path/to/your/vault with your actual vault path
VAULT="/path/to/your/vault"

# Create plugin directory
mkdir -p "$VAULT/.obsidian/plugins/paperlib-integration"

# Copy all files
cp main.js manifest.json styles.css data.json "$VAULT/.obsidian/plugins/paperlib-integration/"

# Restart Obsidian and enable the plugin!

NEED MORE HELP?
---------------
See the full documentation:
- SETUP_GUIDE.md - Complete setup guide
- QUICK_START.md - Quick start guide
- PAPERLIB_INSTALLATION.md - PaperLib extension setup

Or check the repository:
https://github.com/Owais5514/paperlib-obsidian-plugin
EOF

# Show result
echo ""
echo "✅ Package created successfully!"
echo ""
echo "📁 Location: ./$OUTPUT_DIR/"
echo ""
echo "📝 Files included:"
ls -lh "$OUTPUT_DIR"
echo ""
echo "📏 File sizes:"
du -h "$OUTPUT_DIR"/*
echo ""
echo "🚀 Next steps:"
echo ""
echo "   1. Copy the '$OUTPUT_DIR' folder contents to:"
echo "      YOUR_VAULT/.obsidian/plugins/paperlib-integration/"
echo ""
echo "   2. Or use this command (replace path):"
echo "      cp $OUTPUT_DIR/* /path/to/your/vault/.obsidian/plugins/paperlib-integration/"
echo ""
echo "   3. Restart Obsidian"
echo ""
echo "   4. Enable the plugin in Settings → Community plugins"
echo ""
echo "   5. Configure folders and protocol handler"
echo ""
echo "📖 See $OUTPUT_DIR/README.txt for detailed instructions"
