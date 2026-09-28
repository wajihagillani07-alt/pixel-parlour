// Validates icons/manifest.json and every icon file. Run: node scripts/check-icons.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const KEY = ['#EAA4BE', '#F6EAB1', '#B8CEAD', '#B3A0CF', '#FAE6D8', '#57435E'];
const errors = [];
const fail = (f, msg) => errors.push(`✗ ${f}: ${msg}`);

let manifest;
try { manifest = JSON.parse(readFileSync('icons/manifest.json', 'utf8')); }
catch (e) { console.error('✗ icons/manifest.json is not valid JSON:', e.message); process.exit(1); }

const seen = new Set();
for (const entry of manifest) {
  const f = entry.file || '(missing "file")';
  if (!entry.file || !entry.name) { fail(f, 'each entry needs "file" and "name"'); continue; }
  if (!/^[a-z0-9-]+\.svg$/.test(entry.file)) fail(f, 'file name must be lowercase-with-dashes.svg');
  if (seen.has(entry.file)) fail(f, 'listed twice in manifest.json');
  seen.add(entry.file);
  if (!existsSync('icons/' + entry.file)) { fail(f, 'file not found in /icons'); continue; }

  const svg = readFileSync('icons/' + entry.file, 'utf8');
  if (!/viewBox="0 0 64 64"/.test(svg)) fail(f, 'must use viewBox="0 0 64 64"');
  if (/<script|<foreignObject|\son\w+=|javascript:|<image|href="http/i.test(svg)) fail(f, 'no scripts, event handlers, embedded images or external links');
  if (svg.length > 20_000) fail(f, 'keep it under 20 KB');
  const colours = [...svg.matchAll(/#[0-9a-f]{3,8}\b/gi)].map(m => m[0].toUpperCase());
  const bad = [...new Set(colours.filter(c => !KEY.includes(c)))];
  if (bad.length) fail(f, `uses colours outside the key palette: ${bad.join(', ')}`);
  if (/\b(rgb|hsl)a?\(/i.test(svg)) fail(f, 'use hex colours only (no rgb()/hsl())');
}

for (const f of readdirSync('icons').filter(f => f.endsWith('.svg'))) {
  if (!seen.has(f)) fail(f, 'SVG exists but is not listed in manifest.json');
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`✓ ${manifest.length} icons look good.`);
