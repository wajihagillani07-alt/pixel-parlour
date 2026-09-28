/* Pixel Parlour — icon studio
 * Icons live in /icons as plain SVG files listed in icons/manifest.json.
 * Every icon is drawn with the six KEY colours below; the app swaps them
 * for the visitor's palette. See CONTRIBUTING.md to add your own.
 */
'use strict';

// The six key colours (Strawberry). Icon files must use exactly these.
const KEY = ['#EAA4BE', '#F6EAB1', '#B8CEAD', '#B3A0CF', '#FAE6D8', '#57435E'];
const labels = ['Main colour', 'Highlight', 'Accent green', 'Accent purple', 'Soft white', 'Outline'];
const moods = [
  { name: 'Strawberry', c: [...KEY] },
  { name: 'Matcha', c: ['#A9C6A0', '#F4E8B7', '#DBB99B', '#D3DDA7', '#FFF3DB', '#485C46'] },
  { name: 'Moonlight', c: ['#ABA7DF', '#C9E1F2', '#A5CFD3', '#E8B4CF', '#F0EDFF', '#454366'] },
];
const STORE = 'pixel-parlour:custom-icons';

let colours = [...moods[0].c], activeColour = 0, currentMood = 0, selected = 0;
let icons = []; // { name, svg, author, custom }
const $ = s => document.querySelector(s);

/* ---------- Colour helpers ---------- */
const HEX_RE = /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi;
const expand = h => (h.length === 4 ? '#' + [...h.slice(1)].map(x => x + x).join('') : h).toUpperCase();
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/** Swap key colours for the chosen palette in a single pass. */
function paint(svg, c = colours) {
  return svg.replace(HEX_RE, m => {
    const i = KEY.indexOf(expand(m));
    return i === -1 ? m : c[i];
  });
}

/** For uploaded art: snap every colour to a key colour so it recolours with the palette.
 *  Dark → outline, very light/greyish → soft white, otherwise nearest hue. */
function hsl(h) {
  const [r, g, b] = rgb(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const hue = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hue * 60, s, l];
}
function snapToKey(svg) {
  return svg.replace(HEX_RE, m => {
    const [h, s, l] = hsl(expand(m));
    if (l < 0.3) return KEY[5];
    if (l > 0.88 || s < 0.15) return KEY[4];
    const hueGap = k => { const d = Math.abs(hsl(k)[0] - h) % 360; return Math.min(d, 360 - d); };
    return KEY.slice(0, 4).reduce((best, k) => (hueGap(k) < hueGap(best) ? k : best));
  });
}

/* ---------- SVG cleaning (uploads + manifest files) ---------- */
function cleanSvg(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) throw new Error('Not a valid SVG file');
  svg.querySelectorAll('script,foreignObject,iframe,object,embed').forEach(n => n.remove());
  svg.querySelectorAll('*').forEach(el => {
    for (const a of [...el.attributes]) {
      if (/^on/i.test(a.name) || (/href$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) el.removeAttribute(a.name);
    }
  });
  if (!svg.getAttribute('viewBox')) {
    const w = parseFloat(svg.getAttribute('width')) || 64, h = parseFloat(svg.getAttribute('height')) || 64;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '512');
  svg.setAttribute('height', '512');
  svg.removeAttribute('aria-hidden');
  return new XMLSerializer().serializeToString(svg);
}

const icon = (i, c = colours) => paint(icons[i].svg, c).replace('<svg', '<svg aria-hidden="true"');

/* ---------- Loading ---------- */
async function loadIcons() {
  try {
    const list = await (await fetch('icons/manifest.json', { cache: 'no-cache' })).json();
    const loaded = await Promise.all(list.map(async e => {
      try {
        const txt = await (await fetch('icons/' + e.file)).text();
        return { name: e.name, author: e.author || '', svg: cleanSvg(txt), custom: false };
      } catch { console.warn('Skipped icon', e.file); return null; }
    }));
    icons = loaded.filter(Boolean);
  } catch (err) {
    console.error(err);
    $('#icons').innerHTML = `<p class="load-error">Couldn't load the icon library. If you opened this file directly, run a small local server instead — e.g. <code>python3 -m http.server</code> — then visit <code>http://localhost:8000</code>.</p>`;
  }
  icons.push(...readCustom());
  render();
}

function readCustom() {
  try { return (JSON.parse(localStorage.getItem(STORE)) || []).map(x => ({ ...x, custom: true })); }
  catch { return []; }
}
function saveCustom() {
  try { localStorage.setItem(STORE, JSON.stringify(icons.filter(i => i.custom).map(({ name, svg }) => ({ name, svg })))); }
  catch { toast('Saved for this visit only — your browser blocked storage.'); }
}

/* ---------- Rendering ---------- */
function render() {
  $('#presets').innerHTML = moods.map((m, i) => `<button class="preset ${i === currentMood ? 'active' : ''}" data-mood="${i}" aria-pressed="${i === currentMood}"><span class="mini-colours">${m.c.slice(0, 4).map(c => `<i style="background:${c}"></i>`).join('')}</span>${m.name}</button>`).join('');
  $('#palette').innerHTML = colours.map((c, i) => `<button class="swatch ${i === activeColour ? 'active' : ''}" style="background:${c}" data-colour="${i}" aria-label="Edit ${labels[i]}: ${c}" aria-pressed="${i === activeColour}"></button>`).join('');
  if (!$('#icons .load-error')) {
    $('#icons').innerHTML = icons.map((ic, i) => `<div class="icon-wrap"><button class="icon-card" data-icon="${i}" aria-label="Preview and download ${esc(ic.name)}">${icon(i)}<span>${esc(ic.name)}</span>${ic.custom ? '<span class="tag">YOURS</span>' : ''}</button>${ic.custom ? `<button class="remove" data-remove="${i}" aria-label="Remove ${esc(ic.name)}">×</button>` : ''}</div>`).join('')
      + `<button class="add-card" id="add" aria-label="Add your own SVG icon"><b>+</b>Add your own</button>`;
  }
  const n = icons.length;
  $('#badge').textContent = `${n} ICON${n === 1 ? '' : 'S'}`;
  $('#count').textContent = `${n} icon${n === 1 ? '' : 's'}`;
  $('#colour-name').textContent = labels[activeColour];
  $('#colour').value = colours[activeColour];
  $('#hex').value = colours[activeColour].toUpperCase();
  if ($('#icon-dialog').open && icons[selected]) $('#large-icon').innerHTML = icon(selected);
}
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/* ---------- Palette controls ---------- */
$('#presets').onclick = e => { const b = e.target.closest('[data-mood]'); if (!b) return; currentMood = +b.dataset.mood; colours = [...moods[currentMood].c]; $('#hex-error').textContent = ''; render(); };
$('#palette').onclick = e => { const b = e.target.closest('[data-colour]'); if (!b) return; activeColour = +b.dataset.colour; $('#hex-error').textContent = ''; render(); };
function setColour(c) { colours[activeColour] = c.toUpperCase(); currentMood = -1; $('#hex-error').textContent = ''; render(); }
$('#colour').oninput = e => setColour(e.target.value);
$('#hex').oninput = e => { let v = e.target.value; if (!v.startsWith('#')) v = '#' + v; if (/^#[a-f\d]{6}$/i.test(v)) setColour(v); else $('#hex-error').textContent = 'Enter a six-digit hex colour.'; };
$('#reset').onclick = () => { colours = [...moods[0].c]; currentMood = 0; activeColour = 0; $('#hex-error').textContent = ''; render(); toast('Palette reset to Strawberry.'); };

/* ---------- Icon grid: preview, add, remove ---------- */
$('#icons').onclick = e => {
  if (e.target.closest('#add')) return $('#upload').click();
  const rm = e.target.closest('[data-remove]');
  if (rm) { const ic = icons[+rm.dataset.remove]; icons.splice(+rm.dataset.remove, 1); saveCustom(); render(); return toast(`Removed ${ic.name}.`); }
  const b = e.target.closest('[data-icon]'); if (!b) return;
  selected = +b.dataset.icon;
  $('#large-icon').innerHTML = icon(selected);
  $('#icon-title').textContent = icons[selected].name;
  $('#single').textContent = '↓ Download ' + $('#format').value.toUpperCase();
  $('#icon-dialog').showModal();
};

$('#upload').onchange = async e => {
  let added = 0;
  for (const f of e.target.files) {
    try {
      if (f.size > 300_000) throw new Error('too large');
      const svg = snapToKey(cleanSvg(await f.text()));
      const name = f.name.replace(/\.svg$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 30) || 'My icon';
      icons.push({ name, svg, custom: true }); added++;
    } catch (err) { toast(`Couldn't add ${f.name} — use a simple SVG under 300 KB.`); }
  }
  e.target.value = '';
  if (added) { saveCustom(); render(); toast(`Added ${added} icon${added > 1 ? 's' : ''}. Colours now follow your palette.`); }
};

/* ---------- Dialogs, background, toast ---------- */
$('#help').onclick = () => $('#help-dialog').showModal();
document.querySelectorAll('dialog .close').forEach(b => b.onclick = () => b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d => d.onclick = e => { if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); } });
document.querySelectorAll('.bg').forEach(b => b.onclick = () => { $('.preview').dataset.bg = b.dataset.bg; document.querySelectorAll('.bg').forEach(x => x.classList.toggle('active', x === b)); });
let timer;
function toast(t) { $('#toast').textContent = t; $('#toast').classList.add('show'); clearTimeout(timer); timer = setTimeout(() => $('#toast').classList.remove('show'), 4000); }

/* ---------- Export: PNG / ICO / ICNS / SVG + ZIP ---------- */
const enc = new TextEncoder();
function concat(parts) { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let off = 0; for (const p of parts) { out.set(p, off); off += p.length; } return out; }
function header(n) { const a = new Uint8Array(n); return [a, new DataView(a.buffer)]; }

async function png(n, size, c) {
  const url = URL.createObjectURL(new Blob([paint(icons[n].svg, c)], { type: 'image/svg+xml' }));
  try {
    const im = new Image(); im.src = url; await im.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(im, 0, 0, size, size);
    const blob = await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Image export failed')), 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  } finally { URL.revokeObjectURL(url); }
}

async function file(n, format, c) {
  if (format === 'svg') return enc.encode(paint(icons[n].svg, c));
  if (format === 'png') return png(n, 512, c);
  if (format === 'ico') {
    const sizes = [32, 48, 128, 256], imgs = await Promise.all(sizes.map(s => png(n, s, c)));
    const [a, v] = header(6 + 16 * sizes.length); v.setUint16(2, 1, true); v.setUint16(4, sizes.length, true);
    let off = a.length;
    imgs.forEach((p, i) => { const b = 6 + i * 16; a[b] = a[b + 1] = sizes[i] === 256 ? 0 : sizes[i]; v.setUint16(b + 4, 1, true); v.setUint16(b + 6, 32, true); v.setUint32(b + 8, p.length, true); v.setUint32(b + 12, off, true); off += p.length; });
    return concat([a, ...imgs]);
  }
  if (format === 'icns') {
    const chunks = await Promise.all([[128, 'ic07'], [256, 'ic08'], [512, 'ic09']].map(async ([s, t]) => { const p = await png(n, s, c); const [a, v] = header(8); a.set(enc.encode(t)); v.setUint32(4, p.length + 8); return concat([a, p]); }));
    const [a, v] = header(8); a.set(enc.encode('icns')); v.setUint32(4, 8 + chunks.reduce((s, x) => s + x.length, 0));
    return concat([a, ...chunks]);
  }
  throw Error('Unknown format');
}

function crc32(bytes) { let c = 0xffffffff; for (const b of bytes) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; }
function zip(files) {
  const parts = [], central = []; let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = f.data, crc = crc32(data);
    const [l, v] = header(30); v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(12, 33, true); v.setUint32(14, crc, true); v.setUint32(18, data.length, true); v.setUint32(22, data.length, true); v.setUint16(26, name.length, true);
    parts.push(l, name, data);
    const [c, w] = header(46); w.setUint32(0, 0x02014b50, true); w.setUint16(4, 20, true); w.setUint16(6, 20, true); w.setUint16(14, 33, true); w.setUint32(16, crc, true); w.setUint32(20, data.length, true); w.setUint32(24, data.length, true); w.setUint16(28, name.length, true); w.setUint32(42, offset, true);
    central.push(c, name); offset += l.length + name.length + data.length;
  }
  const dir = concat(central); const [end, e] = header(22);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, dir.length, true); e.setUint32(16, offset, true);
  return concat([...parts, dir, end]);
}

function save(data, name, type = 'application/octet-stream') { const url = URL.createObjectURL(new Blob([data], { type })), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
const filename = n => icons[n].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'icon-' + (n + 1);

const guide = `PIXEL PARLOUR — YOUR CUSTOM ICON PACK\n\nThese icons have transparent backgrounds.\n\nWINDOWS: Unzip the pack. Right-click a desktop shortcut, open Properties > Shortcut > Change Icon > Browse, select its ICO file, and Apply. Folder icons are under Properties > Customize > Change Icon. System icons and some app shortcuts have separate settings.\n\nMACOS: Unzip the pack. Select the app, file, or folder in Finder and open Get Info. Drag an ICNS file onto the small icon at the top of the Get Info window. Protected system apps may not allow changes. To restore, select that small icon and press Delete.\n\nLINUX: Unzip the pack. Select the PNG or SVG in your desktop environment's launcher or folder properties, where custom icons are supported. Steps vary between GNOME, KDE and other desktops.\n\nOTHER SYSTEMS: Use PNG or SVG wherever custom images are accepted. Some operating systems restrict icon replacement.\n\nIcons do not install themselves or change the app. Updates can restore an app's default icon. These are original decorative icons, not official app logos.\n\nMade with Pixel Parlour.\n`;

$('#download').onclick = async () => {
  if (!icons.length) return toast('No icons to download yet.');
  const b = $('#download'), old = b.innerHTML, fmt = $('#format').value, c = [...colours];
  b.disabled = true; b.textContent = 'Making your pack…';
  try {
    const files = [], used = new Set();
    for (let i = 0; i < icons.length; i++) {
      let base = filename(i), n = 2; while (used.has(base)) base = filename(i) + '-' + n++; used.add(base);
      files.push({ name: base + '.' + fmt, data: await file(i, fmt, c) });
    }
    files.push({ name: 'START-HERE.txt', data: enc.encode(guide) });
    save(zip(files), 'pixel-parlour-' + fmt + '.zip', 'application/zip');
    toast('Your icon pack is ready. Happy customizing!');
  } catch (e) { toast('Export failed. Please try again.'); console.error(e); }
  finally { b.disabled = false; b.innerHTML = old; }
};
$('#single').onclick = async () => {
  const b = $('#single'); b.disabled = true;
  try { const fmt = $('#format').value; save(await file(selected, fmt, [...colours]), filename(selected) + '.' + fmt); toast('Your icon is ready.'); }
  catch (e) { toast('Export failed. Please try again.'); }
  finally { b.disabled = false; }
};

loadIcons();
