# PaperLib-Obsidian Integration Plugin

A powerful integration between [PaperLib](https://paperlib.app/) and [Obsidian](https://obsidian.md/) that enables seamless import of academic papers with full metadata and PDF files into your Obsidian vault.

## 🎯 Features

### Core Functionality
- **One-Click Import**: Right-click any paper in PaperLib and open it directly in Obsidian
- **Automatic PDF Transfer**: PDF files are automatically copied to your Obsidian Assets folder
- **Complete Metadata Import**: All paper information is preserved including:
  - Paper ID, Title, Authors
  - Publication Date
  - Abstract, Comments, Tags
  - DOI/ArXiv URLs
  - PDF links
- **Smart File Naming**: PDF files are renamed to match paper titles for better organization
- **Customizable Templates**: Fully configurable note templates with property placeholders
- **Folder Configuration**: Specify custom locations for Literature Notes and Assets

### Technical Highlights
- Bidirectional communication between PaperLib and Obsidian
- Protocol handler integration (`obsidian://` URLs)
- Automatic folder creation
- Path resolution for PDF files
- Cross-platform support (Windows, macOS, Linux)

## 📦 Installation

### Prerequisites
- [PaperLib](https://paperlib.app/) installed
- [Obsidian](https://obsidian.md/) installed
- Node.js and Yarn (for building from source)

### Quick Installation

1. **Download the latest release** from the [Releases](https://github.com/Owais5514/paperlib-obsidian-plugin/releases) page

2. **Install PaperLib Extension:**
   - Extract `paperlib-extension-package.zip`
   - In PaperLib: Settings → Extensions → Install from Local
   - Select the extracted `paperlib-extension-package` folder
   - Enable the extension and configure:
     - Obsidian Vault Path (full path to your vault)
     - Literature Notes Folder: `Literature Notes`
     - Assets Folder: `Assets`

3. **Install Obsidian Plugin:**
   - Extract `obsidian-plugin-install.zip`
   - Copy all files to: `YOUR_VAULT/.obsidian/plugins/paperlib-integration/`
   - Restart Obsidian
   - Enable the plugin in Settings → Community Plugins
   - Configure folders in plugin settings

## 🚀 Usage

1. Select a paper in PaperLib
2. Right-click → "Open in Obsidian"
3. The plugin will:
   - Create a note in `Literature Notes/`
   - Copy the PDF to `Assets/`
   - Fill in all metadata automatically
   - Open the note in Obsidian

## 🛠️ Building from Source

```bash
# Clone the repository
git clone https://github.com/Owais5514/paperlib-obsidian-plugin.git
cd paperlib-obsidian-plugin

# Build PaperLib extension
yarn install
yarn build

# Build Obsidian plugin
cd obsidian_src
npm install
npm run build

# Create installation packages
cd ..
./package-extension.sh
./package-obsidian.sh
```

## 📄 License

MIT License

## 🙏 Credits

- **Original Plugin**: [Yalyenea/paperlib-obsidian-plugin](https://github.com/Yalyenea/paperlib-obsidian-plugin)
- **Enhanced Version**: Extended with PDF import and complete metadata support by [Owais5514](https://github.com/Owais5514)
- **PaperLib**: [Future Gadget Lab](https://paperlib.app/)
- **Obsidian**: [Obsidian.md](https://obsidian.md/)

## 🐛 Issues & Contributions

Found a bug or want to contribute? Please open an issue or submit a pull request on [GitHub](https://github.com/Owais5514/paperlib-obsidian-plugin).

## 📝 Changelog

### Version 2.0.0 (Enhanced)
- ✅ PDF file import and automatic copying to Assets folder
- ✅ Complete metadata extraction (abstract, comments, tags, URLs)
- ✅ Smart PDF renaming based on paper titles
- ✅ Configurable folder locations
- ✅ Path resolution for accurate file transfers
- ✅ Enhanced error handling and logging
- ✅ YAML frontmatter optimization (no type mismatches)

### Version 1.0.0 (Original)
- Basic note creation from PaperLib
- Title, authors, year, DOI import
- Protocol handler integration
