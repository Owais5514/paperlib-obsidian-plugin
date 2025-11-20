const esbuild = require('esbuild');
const fs = require('fs');

const production = process.argv.includes('--production');

async function build() {
  try {
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
        '@lezer/lr',
        'fs',
        'path'
      ],
      format: 'cjs',
      target: 'es2018',
      logLevel: 'info',
      sourcemap: production ? false : 'inline',
      treeShaking: true,
      outfile: '../obsidian_paperlib/main.js',
      minify: production,
      platform: 'node',
    });

    console.log('✅ Build complete!');
    console.log('📦 Output: obsidian_paperlib/main.js');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
