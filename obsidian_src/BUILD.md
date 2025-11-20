# Build Instructions for Obsidian Plugin

The Obsidian plugin source code is in `obsidian_src/main.ts`. To build it properly for Obsidian, you need to set up a build process.

## Prerequisites

You need to install Obsidian-specific dependencies:

```bash
cd obsidian_src
npm init -y
npm install --save-dev @types/node esbuild obsidian
```

## Build Configuration

Create a `build.js` file in the `obsidian_src` directory:

```javascript
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const production = process.argv.includes('--production');

async function build() {
  await esbuild.build({
    entryPoints: ['main.ts'],
    bundle: true,
    external: [
      'obsidian',
      'electron',
      '@codemirror/autocomplete',
      '@codemirror/collab',
      '@codemirror/commands',
      '@codemirror/language',
      '@codemirror/lint',
      '@codemirror/search',
      '@codemirror/state',
      '@codemirror/view',
      '@lezer/common',
      '@lezer/highlight',
      '@lezer/lr'
    ],
    format: 'cjs',
    target: 'es2018',
    logLevel: 'info',
    sourcemap: production ? false : 'inline',
    treeShaking: true,
    outfile: '../obsidian_paperlib/main.js',
    minify: production,
  });

  // Copy manifest
  fs.copyFileSync(
    path.join(__dirname, '../obsidian_paperlib/manifest.json'),
    path.join(__dirname, '../obsidian_paperlib/manifest.json')
  );

  console.log('Build complete!');
}

build().catch(() => process.exit(1));
```

## Build the Plugin

```bash
cd obsidian_src
node build.js
```

Or for production build:

```bash
node build.js --production
```

## Alternative: Manual Installation

If you don't want to rebuild the plugin, the pre-built version is already in `obsidian_paperlib/main.js`. However, it doesn't include the PDF copying functionality.

To use the new features, you MUST rebuild from the TypeScript source in `obsidian_src/main.ts`.

## Install to Obsidian

After building:

1. Create the plugin directory in your vault:
   ```bash
   mkdir -p /path/to/your/vault/.obsidian/plugins/paperlib-integration
   ```

2. Copy the files:
   ```bash
   cp obsidian_paperlib/main.js /path/to/your/vault/.obsidian/plugins/paperlib-integration/
   cp obsidian_paperlib/manifest.json /path/to/your/vault/.obsidian/plugins/paperlib-integration/
   cp obsidian_paperlib/styles.css /path/to/your/vault/.obsidian/plugins/paperlib-integration/
   ```

3. Restart Obsidian and enable the plugin in Settings → Community plugins

## Development Mode

For development, you can use watch mode:

Add to your `build.js`:

```javascript
// Add at the end of the file
if (process.argv.includes('--watch')) {
  esbuild.build({
    // ... same config as above
    watch: {
      onRebuild(error) {
        if (error) console.error('Watch build failed:', error);
        else console.log('Watch build succeeded');
      },
    },
  });
}
```

Then run:
```bash
node build.js --watch
```
