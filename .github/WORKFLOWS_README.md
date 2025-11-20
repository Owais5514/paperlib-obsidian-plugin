# GitHub Actions Workflows

This repository includes automated GitHub Actions workflows for building and releasing the PaperLib-Obsidian integration.

## Workflows

### 1. Automatic Release (`release.yml`)

**Trigger:** Automatically runs on every push to the `main` branch (except for markdown files and .gitignore changes)

**What it does:**
- Automatically increments the patch version (e.g., 1.0.0 → 1.0.1)
- Updates version in `manifest.json` and `package.json`
- Builds both PaperLib extension and Obsidian plugin
- Creates release packages (ZIP files)
- Generates changelog from git commits
- Creates a GitHub release with the built packages
- Commits the version bump back to the repository

**Version Format:** `MAJOR.MINOR.PATCH`
- Each automatic release increments PATCH by 1
- Use `[skip ci]` in commit messages to prevent automatic releases

### 2. Manual Release (`manual-release.yml`)

**Trigger:** Manual workflow dispatch from the Actions tab

**What it does:**
- Allows you to choose version bump type:
  - **patch**: 1.0.0 → 1.0.1 (bug fixes)
  - **minor**: 1.0.0 → 1.1.0 (new features)
  - **major**: 1.0.0 → 2.0.0 (breaking changes)
- Performs the same build and release process as automatic release
- Useful for controlling version bumps manually

## How to Use

### Automatic Releases

Simply push your changes to the `main` branch:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

The workflow will automatically create a new release with version 1.0.1, 1.0.2, etc.

### Manual Releases

1. Go to your repository on GitHub
2. Click on the "Actions" tab
3. Select "Manual Release" from the workflows list
4. Click "Run workflow"
5. Choose the version bump type (patch/minor/major)
6. Click "Run workflow"

### Skipping CI

To push changes without triggering a release, include `[skip ci]` in your commit message:

```bash
git commit -m "docs: update README [skip ci]"
```

## Release Contents

Each release includes:

### PaperLib Extension Package (`paperlib-extension-package.zip`)
- `main.js` - Compiled extension code
- `main.ts` - Source TypeScript file
- `package.json` - Package metadata
- `readme.md` - Documentation

### Obsidian Plugin Package (`obsidian-plugin-install.zip`)
- `main.js` - Compiled plugin code
- `manifest.json` - Plugin manifest
- `styles.css` - Plugin styles

## Changelog Generation

The workflow automatically generates a changelog from git commit messages between releases. For better changelogs, use conventional commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `style:` - Code style changes
- `test:` - Test additions/changes

Example:
```bash
git commit -m "feat: add PDF wikilink support with quote wrapping"
git commit -m "fix: resolve YAML parser quote escaping issue"
git commit -m "docs: improve installation instructions"
```

## Troubleshooting

### Workflow Fails to Create Release

**Issue:** Permission denied when creating releases

**Solution:** Ensure GitHub Actions has write permissions:
1. Go to Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Click "Save"

### Version Not Updating

**Issue:** Version in files doesn't match release version

**Solution:** The workflow commits version changes with `[skip ci]` to prevent infinite loops. Pull the latest changes:
```bash
git pull origin main
```

### Build Fails

**Issue:** Dependencies not installing or build errors

**Solution:** 
- Check that `package.json` and `obsidian_src/package.json` are valid
- Ensure all dependencies are properly listed
- Review build logs in the Actions tab

## Credits

Original author: [Yalyenea](https://github.com/Yalyenea)  
Enhanced by: [Owais5514](https://github.com/Owais5514)
