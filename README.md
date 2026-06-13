# Bootstrap 3.4.1 — vanilla JS

Bootstrap 3 styles with a small **jQuery-free** JavaScript layer for the interactive components most apps still use. Same CSS classes and `data-*` attributes as upstream Bootstrap 3 — no jQuery, no stock `bootstrap.js`.

**Stock Bootstrap 3 JavaScript was removed on purpose.** The upstream jQuery plugins include patterns that are hard to use safely in modern apps (remote modal content, HTML tooltips, large dependency surface). This project keeps Bootstrap 3 **CSS and markup** but replaces behavior with a minimal script that only toggles **DOM you already rendered** — no fetching HTML, no injecting strings, no `eval`.

## Quick start

```html
<link href="css/bootstrap.min.css" rel="stylesheet">
<!-- optional themed look -->
<link href="css/bootstrap-theme.min.css" rel="stylesheet">

<script src="js/bootstrap-vanilla.min.js" defer></script>
```

For local development you can use the readable source file instead:

```html
<script src="js/bootstrap-vanilla.js" defer></script>
```

Open **`demo.html`** in a browser (or serve this folder with any static server) to see alerts, dropdowns, collapse, modals, tabs, tooltips, and carousel working together.

## What you need

| Include | Required? | Notes |
|---------|-----------|--------|
| `css/bootstrap.min.css` | Yes | Core Bootstrap 3 styles |
| `css/bootstrap-theme.min.css` | Optional | Gradient / themed controls |
| `fonts/` | If you use Glyphicons | Referenced from the CSS |
| `js/bootstrap-vanilla.js` or `.min.js` | Yes | Behavior for supported components |

## Supported components

These work with standard Bootstrap 3 markup and attributes:

- **Alerts** — dismiss via `.close` / `data-dismiss="alert"`
- **Dropdowns** — `data-toggle="dropdown"`, keyboard navigation
- **Collapse** — toggles and accordions (`data-toggle="collapse"`, `data-parent`)
- **Modals** — open/close, backdrop, Esc, `data-backdrop="static"`, `data-keyboard="false"`
- **Tabs** — `data-toggle="tab"` / `data-toggle="pill"`, `href` or `data-target` pane selectors
- **Tooltips** — `data-toggle="tooltip"`, plain-text `title` only (no HTML, no remote content)
- **Carousel** — indicators, prev/next, `data-ride="carousel"`, auto-cycle

### Not included

Stock Bootstrap 3 plugins that still depend on jQuery are **not** ported:

popover, scrollspy, affix, button state toggles.

## Programmatic API

Initialization runs automatically on `DOMContentLoaded`. You can also call:

```js
BootstrapVanilla.init();
```

Per-component helpers (same idea as Bootstrap’s jQuery API):

```js
BootstrapVanilla.modal('#myModal', 'show');
BootstrapVanilla.modal('#myModal', 'hide');

BootstrapVanilla.collapse('#myPanel', 'toggle');

BootstrapVanilla.tab('#myTab', 'show');

BootstrapVanilla.tooltip('[data-toggle="tooltip"]', { animation: false });
BootstrapVanilla.tooltip('#myEl', 'destroy');

BootstrapVanilla.carousel('#myCarousel', 'next');
BootstrapVanilla.carousel('#myCarousel', 2); // go to slide index
```

Class constructors are exposed as `BootstrapVanilla.Modal`, `.Collapse`, `.Carousel`, `.Tab`, `.Tooltip`, and `.Alert`.

## Events

Custom events match Bootstrap 3 names so existing listeners keep working:

| Component | Events |
|-----------|--------|
| Modal | `show.bs.modal`, `shown.bs.modal`, `hide.bs.modal`, `hidden.bs.modal` |
| Dropdown | `show.bs.dropdown`, `shown.bs.dropdown`, `hide.bs.dropdown`, `hidden.bs.dropdown` |
| Collapse | `show.bs.collapse`, `shown.bs.collapse`, `hide.bs.collapse`, `hidden.bs.collapse` |
| Tab | `show.bs.tab`, `shown.bs.tab`, `hide.bs.tab`, `hidden.bs.tab` |
| Tooltip | `show.bs.tooltip`, `shown.bs.tooltip`, `hide.bs.tooltip`, `hidden.bs.tooltip`, `inserted.bs.tooltip` |
| Carousel | `slide.bs.carousel`, `slid.bs.carousel` |
| Alert | `close.bs.alert`, `closed.bs.alert` |

Cancel show/hide by calling `preventDefault()` on the `show.*` / `hide.*` / `close.*` event.

Example:

```js
document.getElementById('myModal').addEventListener('show.bs.modal', function (e) {
  if (!confirm('Open modal?')) e.preventDefault();
});
```

## Animations

JavaScript toggles classes immediately (no transition emulation). Bootstrap’s CSS may still animate elements with `.fade` or `.carousel.slide`.

## Minifying

After editing `js/bootstrap-vanilla.js`, regenerate the minified build:

```sh
./scripts/minify.sh
```

This uses [Terser](https://github.com/terser/terser) via `npx` — nothing to install in the project. Output: `js/bootstrap-vanilla.min.js` (~18 KB vs ~33 KB source).

One-liner equivalent:

```sh
npx --yes terser js/bootstrap-vanilla.js -o js/bootstrap-vanilla.min.js -c -m --comments '/^!/'
```

## Security

Stock Bootstrap 3 JS was dropped mainly to remove XSS-prone patterns: **remote modals** (AJAX + inject response), **HTML tooltips/popovers** (`html: true`), and jQuery helpers like `.html()` that are easy to misuse. This repo ships neither jQuery nor `bootstrap.js`.

**`bootstrap-vanilla.js` only toggles DOM already on the page.** No `innerHTML`, `eval`, network loading, or `loaded.bs.modal`. Tooltip titles use **`textContent` only** — the `html` option from stock Bootstrap is not supported. It resolves `#` targets via `querySelector` (invalid selectors fail safely; ids use `CSS.escape`). Backdrops use `createElement`, not parsed strings. Programmatic APIs take CSS selectors; the script does not validate or sanitize page content.

**Not implemented:** remote modal URLs, `loaded.bs.modal`, HTML tooltips/popovers, tooltip `html` option.

## License

MIT — see [LICENSE](LICENSE).

This repo bundles **Bootstrap v3.4.1** CSS and fonts ([Twitter, Inc.](https://github.com/twbs/bootstrap/blob/v3.4.1/LICENSE)) with **`bootstrap-vanilla.js`** (Andreas Kollaros). The root `LICENSE` file lists both copyright holders and the full MIT text required when you redistribute the package.
