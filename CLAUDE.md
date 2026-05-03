# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-page restaurant website for **Gusto Bar à Couscous** — a North African restaurant in Berkeley, CA. Three files: `index.html`, `style.css`, `script.js`. No build step, no package manager — open `index.html` directly in a browser.

## Architecture

### Rendering
- **Hero section**: Three.js (`r128` via CDN) renders an animated particle field with floating wireframe geometry. `initHeroCanvas()` in `script.js` owns this.
- **Section backgrounds**: Native Canvas 2D (`about-canvas`, `menu-bg-canvas`, `order-bg-canvas`) render floating gold particles using `initSectionParticles(canvasId)`.

### Design tokens
All colors and shadows are CSS custom properties on `:root` in `style.css`. Gold palette: `--gold` `#C9A84C`, `--gold-light`, `--gold-dark`. Dark backgrounds: `--black`, `--deep`, `--surface`, `--surface2`. Glows: `--glow`, `--glow-strong`.

Typography stack: `Playfair Display` (headings/italic accents), `Cormorant Garamond` (body serif), `Montserrat` (UI/labels) — all loaded from Google Fonts.

### Interactive features (script.js)
- **Cart**: Plain object `{ [itemName]: { qty, price } }`, rendered to `#cart-items` on every change. `changeQty` is exposed on `window` because it's called from inline `onclick` in dynamically generated HTML.
- **Menu tabs**: Filter `.menu-card[data-cat]` by `data-cat` attribute. Switching tabs also unflips any flipped cards.
- **3D card flip**: `.menu-card` toggles class `flipped`; CSS `transform: rotateY(180deg)` on `.card-inner` handles the flip. Mousemove on unflipped cards applies a subtle tilt via inline style.
- **Scroll reveal**: `IntersectionObserver` adds `.visible` to `.reveal`, `.reveal-left`, `.reveal-right` elements.
- **Modals**: `openModal(id)` / `closeModal(id)` toggle class `.open` on `.modal-overlay`.
- **Toast**: `showToast(msg)` adds `.show` class; auto-removed after 3.2 s.

### Content data
Menu items live as static HTML in `index.html`. Each `.menu-card` carries `data-cat` (category) and `.add-btn` carries `data-name` / `data-price` attributes. The Order section duplicates a subset of items as `.order-card` elements — keep prices consistent between both sections when editing.

## Key conventions
- No framework, no modules — all JS runs in a single `DOMContentLoaded` listener (plus `initHeroCanvas` as a standalone function called before the listener closes).
- `window.changeQty` and `window.closeModal` must stay on `window` — they are called from HTML strings built via template literals.
- Responsive breakpoints: `1100px` (stacks 2-col layouts to 1-col) and `768px` (hides nav links, collapses hero buttons).
