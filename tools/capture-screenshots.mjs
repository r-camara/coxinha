#!/usr/bin/env node
/**
 * Captures the Coxinha frontend at three viewports across the main
 * routes for visual review. Connects to an already-running Vite dev
 * server — start it with `pnpm dev` in another terminal before
 * running `pnpm screenshots`.
 *
 * Runs in browser mode (no Tauri wrapper), so `invoke()` calls fail
 * and data-bound views render their error/empty states. That is
 * expected — this script surfaces layout, tokens, typography, and
 * chrome, not data correctness. The Vitest suite covers behaviour.
 *
 * Output: PNGs and a summary README under
 *   docs/research/ui-audit/screenshots/
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const OUT_DIR = path.join(repoRoot, 'docs/research/ui-audit/screenshots');
const BASE_URL = process.env.COXINHA_URL ?? 'http://localhost:1420';

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/notes', name: 'notes' },
  { path: '/agenda', name: 'agenda' },
  { path: '/meetings', name: 'meetings' },
  { path: '/settings', name: 'settings' },
];

const VIEWPORTS = [
  { width: 1440, height: 900, label: '1440x900' },
  { width: 1024, height: 768, label: '1024x768' },
  { width: 1920, height: 1080, label: '1920x1080' },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const captured = [];
  const errorsByViewport = new Map();

  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      const errors = [];
      page.on('pageerror', (err) => errors.push(String(err)));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      for (const route of ROUTES) {
        const file = path.join(OUT_DIR, `${route.name}-${viewport.label}.png`);
        try {
          await page.goto(`${BASE_URL}${route.path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 15_000,
          });
          await page.waitForTimeout(800);
          await page.screenshot({ path: file, fullPage: true });
          captured.push({
            file: path.relative(OUT_DIR, file),
            route: route.path,
            viewport: viewport.label,
          });
          process.stdout.write(`saved ${path.relative(repoRoot, file)}\n`);
        } catch (err) {
          captured.push({
            file: path.relative(OUT_DIR, file),
            route: route.path,
            viewport: viewport.label,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      errorsByViewport.set(viewport.label, errors);
      await context.close();
    }
  } finally {
    await browser.close();
  }

  await writeSummary(captured, errorsByViewport);
}

async function writeSummary(captured, errorsByViewport) {
  const lines = [
    '# UI Audit Screenshots',
    '',
    `Captured by \`pnpm screenshots\` on ${new Date().toISOString()}.`,
    `Base URL: ${BASE_URL}`,
    `Viewports: ${VIEWPORTS.map((v) => v.label).join(', ')}`,
    `Routes: ${ROUTES.map((r) => r.path).join(', ')}`,
    '',
    '## Shots',
    '',
    '| File | Route | Viewport | Notes |',
    '|---|---|---|---|',
    ...captured.map(
      (c) =>
        `| ${c.file} | ${c.route} | ${c.viewport} | ${c.error ? `failed: ${c.error}` : ''} |`,
    ),
    '',
    '## Console errors per viewport',
    '',
  ];
  for (const [viewport, errors] of errorsByViewport) {
    lines.push(`### ${viewport}`);
    if (errors.length === 0) {
      lines.push('- None.');
    } else {
      const unique = Array.from(new Set(errors));
      lines.push(`- Total error-level messages: ${errors.length}`);
      lines.push(`- Distinct: ${unique.length}`);
      unique.slice(0, 5).forEach((e) => lines.push(`- \`${e}\``));
      if (unique.length > 5) lines.push(`- …and ${unique.length - 5} more`);
    }
    lines.push('');
  }
  lines.push(
    '> Running in plain-browser mode means `window.__TAURI__` is missing,',
    '> so data-bound views render error/empty states. Chrome/tokens/',
    '> typography remain accurate for review.',
  );
  await writeFile(path.join(OUT_DIR, 'README.md'), lines.join('\n'));
  process.stdout.write(`wrote ${path.relative(repoRoot, path.join(OUT_DIR, 'README.md'))}\n`);
}

main().catch((err) => {
  process.stderr.write(`screenshots failed: ${err?.stack ?? err}\n`);
  process.exit(1);
});
