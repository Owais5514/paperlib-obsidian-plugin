# GitHub Actions Setup Summary

## ✅ What Was Created

### 1. Automatic Release Workflow (`.github/workflows/release.yml`)
- **Trigger**: Every push to `main` branch (except markdown-only and .gitignore changes)
- **Version Bumping**: Automatically increments patch version (e.g., 1.0.0 → 1.0.1 → 1.0.2)
- **What it does**:
  1. Reads current version from `manifest.json`
  2. Calculates next version (increments patch by 1)
  3. Updates version in both `manifest.json` and `package.json`
  4. Installs dependencies for both extensions
  5. Builds PaperLib extension (`yarn build`)
  6. Builds Obsidian plugin (`cd obsidian_src && yarn build`)
  7. Creates ZIP packages:
     - `paperlib-extension-package.zip`
     - `obsidian-plugin-install.zip`
  8. Generates changelog from git commits
  9. Creates GitHub release with tag (e.g., `v1.0.1`)
  10. Commits version bump back to repo with `[skip ci]` to prevent loops

### 2. Manual Release Workflow (`.github/workflows/manual-release.yml`)
- **Trigger**: Manual dispatch from GitHub Actions tab
- **Version Options**:
  - **Patch**: 1.0.0 → 1.0.1 (bug fixes)
  - **Minor**: 1.0.0 → 1.1.0 (new features)
  - **Major**: 1.0.0 → 2.0.0 (breaking changes)
- Performs the same build and release process as automatic workflow

### 3. Documentation
- **`.github/WORKFLOWS_README.md`**: Comprehensive guide for using the workflows
- **`readme.md`**: Updated with automated release information

## 🎯 How to Use

### Automatic Releases (Default)
```bash
git add .
git commit -m "fix: resolve PDF wikilink quote issue"
git push origin main
```
→ Automatically creates release `v1.0.1` (or next patch version)

### Skip Automatic Release
```bash
git commit -m "docs: update README [skip ci]"
git push origin main
```
→ No release triggered

### Manual Release
1. Go to **Actions** tab on GitHub
2. Click **Manual Release**
3. Click **Run workflow**
4. Select version bump type
5. Click **Run workflow**

## 📦 Release Artifacts

Each release automatically includes:

### PaperLib Extension (`paperlib-extension-package.zip`)
- `main.js` - Compiled extension
- `main.ts` - Source code
- `package.json` - Metadata
- `readme.md` - Documentation

### Obsidian Plugin (`obsidian-plugin-install.zip`)
- `main.js` - Compiled plugin (59.4KB)
- `manifest.json` - Plugin manifest
- `styles.css` - Plugin styles

## 🔧 Configuration

### Current Version: 1.0.0
Next automatic release will be: **v1.0.1**

### Version Files Updated:
- `/obsidian_paperlib/manifest.json`
- `/package.json`

### Workflow Behavior:
- ✅ Automatic patch bumps on every push
- ✅ Changelog from git commits
- ✅ Two ZIP packages per release
- ✅ Version committed back with `[skip ci]`
- ✅ Manual override with patch/minor/major options

## 🔐 Requirements

For workflows to work, ensure GitHub repository settings:
1. **Settings** → **Actions** → **General**
2. Under "Workflow permissions":
   - Select **"Read and write permissions"**
   - Check **"Allow GitHub Actions to create and approve pull requests"**
3. Click **Save**

## 📝 Commit Message Tips

For better changelogs, use conventional commits:

- `feat:` - New features → Shows up in "Changes" section
- `fix:` - Bug fixes → Shows up in "Changes" section
- `docs:` - Documentation → (can use `[skip ci]`)
- `chore:` - Maintenance → Shows up in "Changes" section
- `refactor:` - Code improvements → Shows up in "Changes" section

Example:
```bash
git commit -m "feat: add wikilink quote wrapping support"
git commit -m "fix: YAML parser quote escaping issue"
git commit -m "docs: improve installation guide [skip ci]"
```

## 🎉 Next Steps

Your next push to `main` will automatically:
1. Bump version to `v1.0.1`
2. Build both extensions
3. Create release with packages
4. Generate changelog

**Test it now:**
```bash
# Make a small change
echo "# Test" >> test.txt
git add test.txt
git commit -m "test: verify automated release workflow"
git push origin main
```

Then check the **Releases** page and **Actions** tab!

## 🐛 Troubleshooting

### Workflow Fails
- Check Actions tab for detailed logs
- Ensure permissions are set correctly
- Verify all dependencies in package.json

### Version Not Updating
```bash
git pull origin main  # Pull the version bump commit
```

### Want to Change Version Manually
Edit `obsidian_paperlib/manifest.json` and `package.json` before pushing.

---

**Status**: ✅ All workflows committed and pushed to GitHub  
**Commit**: a3f7fc7  
**Ready**: Yes! Next push will trigger first automated release.
