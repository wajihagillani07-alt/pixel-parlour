# ▧ Pixel Parlour

**Make your desktop a little more you.** A tiny, free icon studio: pick a palette, recolour a whole pack of pixel-art icons, and download them for Windows (ICO), macOS (ICNS), Linux (PNG) or anywhere (SVG).

**▶ Try it:** https://wajihagillani07-alt.github.io/pixel-parlour/

- 🎨 3 ready-made moods (Strawberry, Matcha, Moonlight) or pick any colour
- ➕ Upload your own SVG — its colours snap to your palette
- 📦 One-click ZIP with every icon plus install instructions
- 🔒 Runs fully in your browser. No sign-up, no tracking, no build step

## Add your own icons

**Just for you:** click the **+ Add your own** tile in the app and choose an SVG. It's saved in your browser only.

**For everyone:** contribute it to the library! See [CONTRIBUTING.md](CONTRIBUTING.md) — it's one SVG file and one line of JSON.

## Run locally

The icon library loads from `icons/`, so use a small local server (opening `index.html` directly won't load the icons):

```bash
git clone https://github.com/wajihagillani07-alt/pixel-parlour.git
cd pixel-parlour
python3 -m http.server 8000     # then open http://localhost:8000
```

## Project layout

```
index.html              page markup
assets/style.css        styles
assets/app.js           palette, recolouring, uploads, ICO/ICNS/PNG/ZIP export
icons/*.svg             the icon library (one file per icon)
icons/manifest.json     list of icons shown in the app
docs/icon-template.svg  starter file for new icons
scripts/check-icons.mjs validates icons (runs automatically on pull requests)
```

## Publish with GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Every push to `main` now redeploys the site automatically.

## License

[MIT](LICENSE). Icons are original decorative artwork, not official app logos.
