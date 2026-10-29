/// <reference types="vitest/config" />
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const BUILD = new Date().toISOString().slice(0, 16).replace('T', ' ');

const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });

/**
 * Fills in the offline worker (public/sw.js) after the build: the list of every file of the app,
 * so the tablet can keep a full copy, and a version that changes with every build so an old copy is
 * replaced.
 */
function offlineWorker(): Plugin {
  let outDir = '';
  return {
    name: 'mq-offline-worker',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle: {
      order: 'post',
      handler() {
        const files = listFiles(outDir)
          .map((f) => relative(outDir, f).split(sep).join('/'))
          .filter((f) => f !== 'sw.js' && !f.endsWith('.woff')) // phones use the woff2 fonts
          .sort();
        const worker = join(outDir, 'sw.js');
        const source = readFileSync(worker, 'utf8')
          .replaceAll('__BUILD__', BUILD)
          .replaceAll('__PRECACHE__', JSON.stringify(['./', ...files.map((f) => `./${f}`)]));
        writeFileSync(worker, source);
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), offlineWorker()],
  base: './',
  define: { __BUILD__: JSON.stringify(BUILD) },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
