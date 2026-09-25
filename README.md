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

| Purpose                                         | Location                                                  |
| ----------------------------------------------- | --------------------------------------------------------- |
| User list                                       | `localStorage['ot:users']`                                |
| Selected profile                                | `localStorage['ot:currentUser']`                          |
| User records                                    | `localStorage['ot:<username>']`                           |
| Exact original record backup                    | `localStorage['ot:backup:v1:<username>']`                 |
| Backups before an import                        | `localStorage['ot:backup:import-<timestamp>:<username>']` |
| Resource edits shared by profiles on one device | `localStorage['ot:workspace:<product>']`                  |
| Screenshot attachments                          | IndexedDB `ot-attachments`, store `images`                |
| Read-only shared preview                        | `sessionStorage['ot:previewPayload']`                     |

On the original browser, Pavel's links, common texts, chart tabs and templates
are exposed in LAN Service. His personal orders, finished work, notes,
42x/23x references, tasks, task completion state and attachment links remain in
his profile. Migration retains unknown fields and never overwrites malformed
JSON with defaults. The exact original record is backed up before migration saves. Version 2 profiles get a separate v2 snapshot; existing v1 backups stay intact.
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

The importer reads **every detected row** in a table or repeated labeled detail
blocks. Tesseract word positions retain column alignment when cells are blank.
Order fields include customer, order name, product, 310x, BS-ID, status and date,
plus 42x/23x references when present. English and German labels are supported.

Selecting, dropping or pasting screenshots starts reading and saves each detected
row immediately. There is no mandatory review form or missing-field prompt.
Even a single recognized field creates an entry; a screenshot with no recognized
fields creates nothing and asks for a clearer image. Missing values remain empty.
An unrecognized product uses the profile's assigned category, and an unspecified
status starts as Open. Explicit Completed/Erledigt rows go to Finished.

Each image is stored once in IndexedDB and referenced by its rows. A per-image
**Undo import** moves imported entries to the recoverable Archive. Closing the
importer cancels any unfinished image; rows from images already saved remain.
Reimporting the same screenshot creates new rows. OCR can misread small or
unlabelled screenshots; entries stay editable and keep the source image and text.

## Profile categories and LAN Service eFlow

Profiles select an assigned category during registration and can change it in
**Settings → Profile → Assigned order category**. Existing profiles infer a
uniform recorded product, or default to LAN Service. Changing category retains
all personal orders, notes and eFlows.

LAN Service profiles have **User → eFlow** in addition to normal order tracking.
The eFlow importer recognizes 42x number, Date from / Datum von, Bruttobetrag,
BS-ID and client name. German and English amount separators are supported.
The tracker sorts oldest to newest with undated entries last, and offers active,
completed and all views.

Links use matching 42x first, then BS-ID, then an exact, unique client name among
active LAN orders. Conflicting references or ambiguous matches stay unlinked;
the entry still saves without a prompt. Edit an entry to optionally choose a
manual link or keep it unlinked. Client-only completed historical eFlows do not
automatically match future orders.

**Complete** finishes the eFlow and its linked active order in one profile save,
preserving all notes, tasks, attachments and references. **Reopen** restores an
order that was completed by that eFlow, unless another completed eFlow still
requires it to remain finished. Restoring an order also reopens its linked
eFlows. Archiving an eFlow retains it in Settings without reopening the order.

Profile JSON backups include category, eFlows, order links and all active or
archived screenshot attachments. Imported image IDs are remapped consistently
without overwriting another profile's images.

## Deployment and rollback

GitHub Pages publishes the root of `main`; keep `CNAME` set to `www.wotracker.net`.
The existing Pages deployment runs after a push. The added test workflow checks
source syntax and regression tests on pushes and pull requests.

Before publishing: `npm ci && npm run check && npm test && npm run test:ocr`.
After publishing: verify the Pages workflow and the live dashboard, resources,
registration and screenshot import. No database migration or destructive data
reset is part of deployment. Git can revert the application; the v1 backup can
also be exported from Settings if a record needs recovery.
