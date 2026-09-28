# Contributing an icon ♡

Thanks for making Pixel Parlour bigger! Adding an icon takes two steps.

## 1. Draw it

Start from [`docs/icon-template.svg`](docs/icon-template.svg). You can edit it in any text editor, [Figma](https://figma.com), [Inkscape](https://inkscape.org), or [Boxy SVG](https://boxy-svg.com).

**Rules** (the automated check enforces these):

| Rule | Why |
| --- | --- |
| `viewBox="0 0 64 64"` | All icons share one pixel grid |
| Use **only** the six key colours below, as hex | The app swaps them for each visitor's palette |
| No scripts, embedded images, or external links | Keeps the site safe |
| Under 20 KB | Keeps the page fast |
| Your **original** work — no app logos, brands or known characters | Keeps the project legal to share |

**Key colours** — each one becomes a palette slot:

| Slot | Hex | Typical use |
| --- | --- | --- |
| Main colour | `#EAA4BE` | Body / main shape |
| Highlight | `#F6EAB1` | Screens, shine |
| Accent green | `#B8CEAD` | Details |
| Accent purple | `#B3A0CF` | Shadows, details |
| Soft white | `#FAE6D8` | Light highlights |
| Outline | `#57435E` | Outlines (`stroke`), dark details |

Tip: add `shape-rendering="crispEdges"` on the `<svg>` and snap shapes to whole numbers for the pixel look. Use `stroke="#57435E" stroke-width="2"` for outlines, like the existing icons.

## 2. Add it

1. **Fork** this repo.
2. Save your file as `icons/your-icon-name.svg` (lowercase, dashes).
3. Add a line to `icons/manifest.json`:
   ```json
   { "file": "your-icon-name.svg", "name": "Your Icon Name", "author": "your-github-name" }
   ```
   Watch the commas — every entry except the last needs one after it.
4. Check it locally (optional): `node scripts/check-icons.mjs`, then preview with `python3 -m http.server`.
5. Open a **pull request**. The icon check runs automatically; a maintainer will review and merge.

Not comfortable with Git? Open an **Issue**, attach your SVG, and we'll add it for you.

## Other changes

Bug fixes and ideas are welcome too — open an issue first for anything big.
