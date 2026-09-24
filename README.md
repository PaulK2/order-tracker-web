# CDC Workspace

A complete rework of Web Order Tracker, deployed on GitHub Pages at
https://www.wotracker.net. Vanilla JavaScript, no frontend build step.

## Run and verify

Requires Node.js 20 or later for development. The deployed app does not require Node.

```sh
npm ci
npm start
# http://localhost:8000
npm run check
npm test
npm run test:ocr
```

`npm test` covers legacy migrations, backup integrity, profile separation,
registration, orders, notes, checklists, previews, the shared board and OCR field
parsing. `test:ocr` runs the real English/German Tesseract engine against the
synthetic screenshot fixture; its first run downloads language models.

## Navigation

- **Dashboard** opens first, with order summaries, product categories and the board.
- **LAN Service / Standard / PABX** contain links, common texts, reference charts and
  checklist templates. They do not contain personal tracking tabs.
- **User** contains open orders, finished orders and notes across products.
- **Settings** contains themes, JSON backups, read-only sharing and publication tools.
- **Public Board** reads the same published announcements for all visitors.
- Existing `.html` page links redirect to their corresponding new sections.

## Preserve existing records

The application deliberately keeps the original website origin and storage keys:

| Purpose | Location |
| --- | --- |
| User list | `localStorage['ot:users']` |
| Selected profile | `localStorage['ot:currentUser']` |
| User records | `localStorage['ot:<username>']` |
| Exact original record backup | `localStorage['ot:backup:v1:<username>']` |
| Backups before an import | `localStorage['ot:backup:import-<timestamp>:<username>']` |
| Resource edits shared by profiles on one device | `localStorage['ot:workspace:<product>']` |
| Screenshot attachments | IndexedDB `ot-attachments`, store `images` |
| Read-only shared preview | `sessionStorage['ot:previewPayload']` |

On the original browser, Pavel's links, common texts, chart tabs and templates
are exposed in LAN Service. His personal orders, finished work, notes,
42x/23x references, tasks, task completion state and attachment links remain in
his profile. Migration retains unknown fields and never overwrites malformed
JSON with defaults. The exact original record is backed up before a v2 save.
Other existing profiles are preserved too; their original resources can be
accessed through **Settings → My original resources**.

**Pavel's personal orders and notes are not in this repository.** The developer
cannot retrieve another device's localStorage. The migration runs when Pavel
opens the updated site in the same browser and at the same origin he previously
used. A different browser, device, protocol or hostname has separate storage.
Use **Export my data** / **Import JSON** to transfer records, including screenshots.
Removed orders and personal notes go to the recoverable Archive.

## Registration passport

New local profiles require the requested hardcoded passport `CDC2026001`.
Existing profiles can be selected without it. Empty/invalid names, reserved
storage keys and case-insensitive duplicate profiles are rejected.

This is a **browser-side gate, not server authentication**. GitHub Pages serves
public static files; the code is visible and cannot provide genuine spam
prevention for a global account service. Profiles remain local to a browser,
so registration creates no shared server account. A backend would be required
for server-enforced registration, account login or synchronized personal records.

## Shared board and LAN resources

- `data/public-board.json` is fetched for all users and devices.
- `data/lan-service.json` provides the published LAN resource baseline.
- On Pavel's original browser, his customized LAN resources take precedence.
  A newly created, empty Pavel profile uses the published resources.
- Local workspace edits take precedence on their device and are labeled as local.
- **Write an update** creates an explicitly labeled local draft.
- **Prepare publication** and **Publish LAN Service** prepare reviewed JSON and
  open the normal GitHub file editor. A repository collaborator commits that file;
  GitHub Pages then publishes it to everyone.
- The app never stores a GitHub token and never calls an unauthorized write API.
- Publishing LAN resources excludes personal orders and notes. Shared resource
  snapshots are included in profile exports, but imports do not silently overwrite
  an existing shared workspace.

Pavel's supplied resource export is published in `data/lan-service.json`: 10 links,
5 common texts, 5 reference tabs containing 32 rows, and 3 checklist templates.
These resources are available across devices. Original labels, URLs, colors and
tab-separated SAP values are preserved. To publish later changes, use Settings
on the device with those edits and commit the prepared LAN JSON.

## Screenshot import

Choose, drop or paste a PNG, JPEG, WebP or BMP screenshot (up to 12 MB / 32 MP).
Tesseract.js 7 performs OCR on the device. The engine and English/German language
packs are downloaded from pinned/default jsDelivr URLs on first use. The image
itself is not uploaded to an OCR service.

The importer detects customer name, order name, product, 310x number, BS-ID,
status and date from labeled details or aligned tables. Missing fields are
highlighted and remain empty. A review checkbox is required before saving an
OCR-created order. Arbitrary unlabelled layouts may require manual correction.
The screenshot is saved in IndexedDB with the order and included in a full JSON
export. Share keys include image references, not image bytes; use JSON export to
move images to another device.

## Deployment and rollback

GitHub Pages publishes the root of `main`; keep `CNAME` set to `www.wotracker.net`.
The existing Pages deployment runs after a push. The added test workflow checks
source syntax and regression tests on pushes and pull requests.

Before publishing: `npm ci && npm run check && npm test && npm run test:ocr`.
After publishing: verify the Pages workflow and the live dashboard, resources,
registration and screenshot import. No database migration or destructive data
reset is part of deployment. Git can revert the application; the v1 backup can
also be exported from Settings if a record needs recovery.
