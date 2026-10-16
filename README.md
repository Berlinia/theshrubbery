# Wildsea Shrubbery

A local, buildless Markdown workshop for Wildsea documents. Open `http://localhost:4173` after running:

```sh
npm start
```

Node 20+ is sufficient. Dependencies are vendored; no npm installation is required. Run `npm test` for the renderer, file-format and mocked Drive tests. `PORT` can change the local port. The server binds to loopback only and serves only `dist/`.

On this Windows machine you can also double-click `start.bat`; it falls back to the bundled Node runtime if Node is not on PATH. Browser verification uses Playwright with installed Edge: `node tests/browser.mjs` (set `PLAYWRIGHT_MODULE` to an installed Playwright module path if it is not available as a local package).

## Features

- CodeMirror editor and live 10 × 8.5 inch pages, single-page / spread preview and zoom.
- Familiar `{{...}}`, `\page` and `\column` syntax with a small, documented vocabulary.
- Four toolbar tabs with dropdowns: Tables, Columns, Blocks, and Page templates.
- Tables: striped, plain, ruled, compact, roll, enclosed, and headerless fields.
- Page presets: Reach, Character introduction, Character aspects, Hazard, Scenario, Quickplay, and blank. Presets add after the current page (or fill an empty one), preserving existing content.
- Accents inherit from document to page to nested blocks. Black is the default (monochrome); new snippets inherit automatically. For example, `{{page accent=mustard}}` colours the page's boxes, subtitles, tracks and table/field accents. Use explicit block colours only for overrides.
- Tracks: `{{track 3|2|5}}` draws ten circles with breaks after circles 3 and 5. Positive group sizes, maximum 60 circles.
- Leaf bullets, standard Markdown tables, alternating field rows, coloured outlined boxes, independently coloured subtitles, two/three columns and nested wide/sidebar layouts.
- Canopy and Reach template backgrounds, plain paper, sampled IDML accent palette.
- Automatic browser drafts, multiple documents, Markdown download/import, print-to-PDF.
- Dedicated Google OAuth configuration, explicit Drive save/update/save-as, paginated listing, open, account isolation and conflict checks.

Use the **?** button for syntax and the four insertion tabs for examples. The included three-page guide demonstrates formatting, layouts, saving and printing in the editable source. Page breaks are explicit: overflowing pages show a warning, and content does not flow automatically to a new page. Arbitrary HTML/CSS, dark pages, custom background composition and full InDesign layout are intentionally outside this prototype.

## New Google OAuth application

No Deltagreenery OAuth identity is reused. `dist/config.js` starts empty.

1. Create a dedicated Google Cloud project / OAuth web client for Wildsea Shrubbery.
2. Enable Google Drive API and configure the OAuth consent screen. Add your account to test users when the app is in testing.
3. Add `http://localhost:4173` to **Authorized JavaScript origins** (use the exact origin and port you open).
4. Enter its public client ID in the app's Google Drive dialog, or set `googleClientId` in `dist/config.js`. Do not supply a client secret.
5. Click **Connect Google Drive**, authorize your account, then **Save to Drive**.

The app uses Google Identity Services and the `drive.file` scope. Tokens remain in memory, never in localStorage. Each file is Markdown plus a fenced YAML metadata block. App-created files carry the `wildsea-shrubbery` namespace; unrelated Drive files are not listed. Browser drafts retain only the file ID/account identifier/version needed to update the right document. Save is explicit, with modification and ETag checks. Google sign-in requires a normal browser that permits popups and online access.

Documentation: [Google token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Drive uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads).

## Project layout

- `dist/`: self-contained static application and assets.
- `tests/`: Node tests for renderer, Markdown files and Drive requests; browser verification script.
- `docs/idml-palette.json`: full extracted source swatches, including original CMYK values.
- `docs/reference-notes.md`: palette and asset provenance.
- `tmp/`: ignored local screenshots and verification outputs.

No remote repository has been configured or pushed. The source is ready to move into the repository you choose. Vendored JavaScript licence notices are in `dist/vendor/`.

## Printing

Print / PDF uses 10 × 8.5 inch Wildsea pages and 11 × 8.5 inch Quickplay pages with zero CSS page margins. The page directive `{{page size=letter}}` selects Quickplay size; subsequent pages revert to Wildsea size unless explicitly set. Enable background graphics, disable browser headers/footers and use 100% scale. Preview scaling does not affect output. Export is individual pages even when viewing spreads. Resolve overflow warnings before printing.

## Verification limits

Automated tests use mocked Google responses. Live Google sign-in and Drive round-tripping require the new OAuth client and account consent. Browser tests do not authorize or write to a real Google account.

## Editor views

The editor follows Deltagreenery’s Text / Style / Snippets / Properties structure. Text retains the existing insertion menus. Style accepts CSS rules scoped to the document preview (plus `@media` and `@supports`); use `.sheet`, `.page-content`, and `.box` selectors. Snippets uses `\snippet Name` followed by reusable Markdown. Clicking a custom snippet inserts it at the preserved text cursor. Properties includes title, author, description, tags, language, background, accent, and page numbering.

Styles, custom snippets, and properties are saved in each browser draft and serialized into Markdown metadata for download/import and Google Drive. Old documents without these fields continue to work. OAuth configuration remains independent of Deltagreenery. The Style tab uses the bundled CodeMirror CSS mode under the existing MIT license.

Browser coverage: `tests/workspace.mjs` verifies tabs, CSS scoping, snippet insertion, property editing, persistence, metadata roundtrip, print styling, and document isolation.
