const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const fs = require("node:fs");
const path = require("node:path");
const { indexedDB } = require("fake-indexeddb");
const D = require("../data.js");
const root = path.resolve(__dirname, "..");
const tick = () => new Promise((r) => setTimeout(r, 15));
const legacy = {
  open: [
    {
      id: 100,
      name: "Legacy delivery",
      val310: "3100012345",
      val42: "4200100",
      val23: "2300100",
      category: "Custom",
      tasks: [{ name: "Original checklist", done: true }],
      notes: [{ text: "Preserved update", ts: "2026-09-01" }],
      files: [{ name: "Portal", url: "https://example.com" }],
    },
  ],
  finished: [
    {
      id: 200,
      name: "Old finished order",
      notes: [{ text: "Completed history" }],
      tasks: [],
    },
  ],
  links: [{ name: "Pavel portal", link: "https://example.com" }],
  kb_texts: ["Pavel original common text"],
  kb_tabs: [
    {
      name: "Technical knowledge",
      color: "#112233",
      rows: [{ name: "Network row", value: "Pavel reference value" }],
    },
  ],
  categories: [
    {
      name: "Custom",
      color: "#234567",
      tasks: ["Original checklist", "Second task"],
    },
  ],
  theme: "dark",
  customUnknown: "Keep this",
};
async function setup(seed = {}, hash = "") {
  const dom = new JSDOM(
    fs.readFileSync(path.join(root, "index.html"), "utf8"),
    {
      url: "https://www.wotracker.net/" + hash,
      runScripts: "outside-only",
      pretendToBeVisual: true,
    },
  );
  const w = dom.window;
  w.TextEncoder = TextEncoder;
  w.TextDecoder = TextDecoder;
  w.structuredClone = structuredClone;
  w.indexedDB = indexedDB;
  w.scrollTo = () => {};
  w.fetch = async (url) => ({
    ok: true,
    json: async () =>
      JSON.parse(
        fs.readFileSync(path.join(root, String(url).split("?")[0]), "utf8"),
      ),
  });
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new w.Event("close"));
  };
  Object.defineProperty(w.navigator, "clipboard", {
    value: {
      writeText: async (text) => {
        w.copied = text;
      },
    },
  });
  for (const [key, value] of Object.entries(seed))
    w.localStorage.setItem(
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    );
  for (const file of [
    "data.js",
    "tracking.js",
    "ocr-parser.js",
    "ocr.js",
    "app.js",
  ])
    w.eval(fs.readFileSync(path.join(root, file), "utf8"));
  await tick();
  return {
    dom,
    w,
    doc: w.document,
    click: async (selector) => {
      const el = w.document.querySelector(selector);
      assert.ok(el, "Missing control: " + selector);
      el.click();
      await tick();
    },
    route: async (hash) => {
      w.location.hash = hash;
      await tick();
    },
    submit: async (selector) => {
      const form = w.document.querySelector(selector);
      assert.ok(form, "Missing form " + selector);
      form.dispatchEvent(
        new w.Event("submit", { bubbles: true, cancelable: true }),
      );
      await tick();
    },
    saved: (name) => JSON.parse(w.localStorage.getItem("ot:" + name)),
  };
}
const pavelSeed = () => ({
  "ot:users": ["Pavel"],
  "ot:currentUser": "Pavel",
  "ot:Pavel": legacy,
});
test("first launch is a dashboard with products, User, Settings and public announcements", async (t) => {
  const a = await setup();
  t.after(() => a.w.close());
  assert.match(
    a.doc.querySelector("h1").textContent,
    /Your work, in one place/,
  );
  for (const id of ["lan", "standard", "pabx"])
    assert.ok(a.doc.querySelector(`a[href="#products/${id}"]`));
  assert.ok(a.doc.querySelector('a[href="#user/open"]'));
  assert.ok(a.doc.querySelector('a[href="#settings"]'));
  assert.match(a.doc.body.textContent, /Welcome to the CDC Workspace/);
});
test("registration passport is required, new users start empty and can reopen saved profiles", async (t) => {
  const a = await setup({}, "#users");
  t.after(() => a.w.close());
  let f = a.doc.querySelector("#createUserForm");
  f.elements.username.value = "Test User";
  f.elements.passport.value = "wrong";
  await a.submit("#createUserForm");
  assert.match(a.doc.querySelector("#signupError").textContent, /incorrect/);
  assert.equal(a.w.localStorage.getItem("ot:Test User"), null);
  f.elements.passport.value = "CDC2026001";
  await a.submit("#createUserForm");
  assert.equal(a.w.localStorage.getItem("ot:currentUser"), "Test User");
  assert.equal(a.saved("Test User").open.length, 0);
  assert.match(
    a.doc.querySelector("h1").textContent,
    /Welcome back, Test User/,
  );
});
test("Pavel migrations preserve content and move resources out of personal tracking", async (t) => {
  const a = await setup(pavelSeed());
  t.after(() => a.w.close());
  assert.equal(a.w.localStorage.getItem("ot:Pavel"), JSON.stringify(legacy));
  assert.equal(
    a.w.localStorage.getItem("ot:backup:v1:Pavel"),
    JSON.stringify(legacy),
  );
  await a.route("products/lan/knowledge");
  assert.match(a.doc.body.textContent, /Pavel original common text/);
  assert.match(a.doc.body.textContent, /Pavel reference value/);
  assert.doesNotMatch(
    a.doc.querySelector("#main").textContent,
    /Legacy delivery/,
  );
  await a.route("user/notes");
  assert.match(a.doc.body.textContent, /Preserved update/);
  assert.match(a.doc.body.textContent, /Completed history/);
});
test("published LAN resources load on a fresh device, retain SAP clipboard columns and named colors", async (t) => {
  const a = await setup(
    {
      "ot:users": ["New User"],
      "ot:currentUser": "New User",
      "ot:New User": D.emptyData(),
    },
    "#products/lan/links",
  );
  t.after(() => a.w.close());
  assert.equal(
    a.doc.querySelectorAll('#main [data-action="copy-link"]').length,
    10,
  );
  await a.route("products/lan/knowledge");
  assert.equal(
    a.doc.querySelectorAll('#main [data-action="copy-text"]').length,
    5,
  );
  assert.equal(a.doc.querySelector("#resourceTab").options.length, 5);
  await a.click('[data-action="copy-row"][data-index="9"]');
  assert.deepEqual(a.w.copied.split("\t"), [
    "F",
    "",
    "",
    "xxx_xxx",
    "1",
    "st",
    "",
    "",
    "",
    "",
    "",
    "D040204 ",
    "A1 Tele",
  ]);
  a.doc.querySelector("#resourceTab").value = "2";
  a.doc
    .querySelector("#resourceTab")
    .dispatchEvent(new a.w.Event("change", { bubbles: true }));
  await tick();
  await a.click('[data-action="edit-tab"]');
  assert.equal(
    a.doc.querySelector('#modalForm input[type="color"]').value,
    "#008000",
  );
  a.doc.querySelector("#modal").close();
  await a.route("products/lan/templates");
  assert.equal(a.doc.querySelectorAll("#main .task-row").length, 23);
  await a.click('[data-action="edit-template"][data-index="1"]');
  assert.equal(
    a.doc.querySelector('#modalForm input[type="color"]').value,
    "#ffa500",
  );
});
test("a newly registered Pavel uses published resources without losing personal profile data", async (t) => {
  const a = await setup({}, "#users");
  t.after(() => a.w.close());
  const form = a.doc.querySelector("#createUserForm");
  form.elements.username.value = "Pavel";
  form.elements.passport.value = "CDC2026001";
  await a.submit("#createUserForm");
  await a.route("products/lan/links");
  assert.match(a.doc.querySelector("#main").textContent, /SAP Logon/);
  assert.equal(a.saved("Pavel").open.length, 0);
  assert.equal(a.saved("Pavel").links.length, 0);
});
test("order creation, checklist changes, notes, finish and restore preserve all references", async (t) => {
  const a = await setup(pavelSeed());
  t.after(() => a.w.close());
  await a.click('[data-action="new-order"]');
  const form = a.doc.querySelector("#modalForm");
  Object.assign(form.elements.customer, { value: "Example Customer" });
  form.elements.name.value = "New Test Order";
  form.elements.product.value = "lan";
  form.elements.val310.value = "3109999999";
  form.elements.bsId.value = "BS-777";
  form.elements.val42.value = "4200777";
  form.elements.val23.value = "2300777";
  await a.submit("#modalForm");
  let order = a.saved("Pavel").open.find((o) => o.name === "New Test Order");
  assert.ok(order);
  assert.equal(order.bsId, "BS-777");
  assert.equal(order.tasks.length, 2);
  await a.click(`[data-action="order-detail"][data-id="${order.id}"]`);
  const checkbox = a.doc.querySelector('[data-check="0"]');
  checkbox.checked = true;
  checkbox.dispatchEvent(new a.w.Event("change", { bubbles: true }));
  await tick();
  a.doc.querySelector("#orderNoteForm textarea").value = "Delivery in progress";
  await a.submit("#orderNoteForm");
  assert.equal(
    a.saved("Pavel").open.find((o) => o.id === order.id).notes.length,
    1,
  );
  await a.click(`#modal [data-action="finish-order"]`);
  order = a.saved("Pavel").finished.find((o) => o.id === order.id);
  assert.equal(order.tasks[0].done, true);
  assert.equal(order.val42, "4200777");
  assert.equal(order.val23, "2300777");
  assert.equal(order.status, "Completed");
  await a.route("user/finished");
  await a.click(`[data-action="restore-order"][data-id="${order.id}"]`);
  const restored = a.saved("Pavel").open.find((o) => o.id === order.id);
  assert.equal(restored.notes[0].text, "Delivery in progress");
  assert.equal(restored.status, "Open");
  assert.equal(a.saved("Pavel").customUnknown, "Keep this");
});
test("new profile shares Pavel LAN resources but never sees Pavel orders or notes", async (t) => {
  const seed = pavelSeed();
  seed["ot:users"] = ["Pavel", "Second User"];
  seed["ot:Second User"] = D.emptyData();
  seed["ot:currentUser"] = "Second User";
  const a = await setup(seed);
  t.after(() => a.w.close());
  await a.route("user/open");
  assert.doesNotMatch(
    a.doc.querySelector("#main").textContent,
    /Legacy delivery/,
  );
  await a.route("products/lan/knowledge");
  assert.match(
    a.doc.querySelector("#main").textContent,
    /Pavel reference value/,
  );
  await a.route("user/notes");
  assert.doesNotMatch(
    a.doc.querySelector("#main").textContent,
    /Preserved update/,
  );
});
test("resource edits persist separately and do not touch original Pavel records", async (t) => {
  const a = await setup(pavelSeed(), "#products/lan/links");
  t.after(() => a.w.close());
  const before = a.w.localStorage.getItem("ot:Pavel");
  await a.click('[data-action="add-link"]');
  const f = a.doc.querySelector("#modalForm");
  f.elements.name.value = "New portal";
  f.elements.link.value = "https://example.org";
  await a.submit("#modalForm");
  assert.match(a.doc.querySelector("#main").textContent, /New portal/);
  assert.equal(a.w.localStorage.getItem("ot:Pavel"), before);
  assert.equal(
    JSON.parse(a.w.localStorage.getItem("ot:workspace:lan")).data.links.length,
    2,
  );
});
test("preview mode blocks changes and exits back to the original saved profile", async (t) => {
  const a = await setup(pavelSeed(), "#settings");
  t.after(() => a.w.close());
  const before = a.w.localStorage.getItem("ot:Pavel");
  await a.click('[data-action="load-preview"]');
  const shared = D.normalizeData({
    open: [{ id: "shared-1", name: "Someone else order" }],
    theme: "light",
  });
  a.doc.querySelector("#modalForm textarea").value = D.encodeKey(shared);
  await a.submit("#modalForm");
  assert.match(a.doc.querySelector("#main").textContent, /Someone else order/);
  await a.click('[data-action="finish-order"]');
  assert.equal(a.w.localStorage.getItem("ot:Pavel"), before);
  assert.equal(a.saved("Pavel").finished.length, 1);
  await a.click('[data-action="preview-exit"]');
  assert.match(a.doc.querySelector("#main").textContent, /Legacy delivery/);
  assert.doesNotMatch(
    a.doc.querySelector("#main").textContent,
    /Someone else order/,
  );
});
test("archive and restore are reversible, retaining checklist and note history", async (t) => {
  const a = await setup(pavelSeed(), "#user/open");
  t.after(() => a.w.close());
  await a.click('[data-action="order-detail"][data-id="100"]');
  await a.click('[data-action="archive-order"]');
  await a.submit("#modalForm");
  assert.equal(a.saved("Pavel").open.length, 0);
  assert.equal(a.saved("Pavel").trash.length, 1);
  await a.route("settings");
  await a.click('[data-action="unarchive"]');
  assert.equal(a.saved("Pavel").open[0].notes[0].text, "Preserved update");
  assert.equal(a.saved("Pavel").open[0].tasks[0].done, true);
});
test("untrusted imported fields are text, not executable markup", async (t) => {
  const seed = pavelSeed();
  seed["ot:Pavel"] = {
    ...legacy,
    open: [
      {
        id: 1,
        name: '<img src=x onerror="alert(1)">',
        customer: "<script>bad</script>",
        tasks: [{ name: "<img onerror=bad>", done: false }],
        files: [{ name: "bad", url: "javascript:alert(1)" }],
      },
    ],
  };
  const a = await setup(seed, "#user/open");
  t.after(() => a.w.close());
  assert.equal(a.doc.querySelectorAll("#main img,#main script").length, 0);
  await a.click('[data-action="order-detail"]');
  assert.equal(
    a.doc.querySelectorAll(
      '#modal img,#modal script,#modal a[href^="javascript:"]',
    ).length,
    0,
  );
});
test("board reads the same published source across independent profiles and labels unpublished drafts", async (t) => {
  const a = await setup(pavelSeed(), "#board"),
    b = await setup({}, "#board");
  t.after(() => {
    a.w.close();
    b.w.close();
  });
  assert.equal(
    a.doc.querySelector(".board-post h2").textContent,
    b.doc.querySelector(".board-post h2").textContent,
  );
  await a.click('[data-action="new-post"]');
  const f = a.doc.querySelector("#modalForm");
  f.elements.title.value = "Local draft";
  f.elements.body.value = "Review this before publishing.";
  await a.submit("#modalForm");
  assert.match(
    a.doc.querySelector("#main").textContent,
    /Drafts on this device/,
  );
  assert.doesNotMatch(b.doc.querySelector("#main").textContent, /Local draft/);
});
test("corrupt saved records are left untouched and recovery is offered", async (t) => {
  const a = await setup({
    "ot:users": ["Pavel"],
    "ot:currentUser": "Pavel",
    "ot:Pavel": "{broken",
  });
  t.after(() => a.w.close());
  assert.match(a.doc.body.textContent, /has not been reset or deleted/);
  assert.ok(a.doc.querySelector('[data-action="recover-data"]'));
  assert.equal(a.w.localStorage.getItem("ot:Pavel"), "{broken");
});
test("applying a template is explicit and retains notes, attachments and order references", async (t) => {
  const a = await setup(pavelSeed(), "#user/open");
  t.after(() => a.w.close());
  await a.click('[data-action="order-detail"][data-id="100"]');
  await a.click('[data-action="apply-template"]');
  await a.submit("#modalForm");
  const order = a.saved("Pavel").open[0];
  assert.equal(order.tasks.length, 2);
  assert.equal(order.tasks[0].done, false);
  assert.equal(order.notes[0].text, "Preserved update");
  assert.equal(order.files[0].url, "https://example.com");
  assert.equal(order.val23, "2300100");
});
test("JSON imports retain an accessible exact backup and do not replace shared resources", async (t) => {
  const a = await setup(pavelSeed(), "#settings");
  t.after(() => a.w.close());
  const before = a.w.localStorage.getItem("ot:Pavel");
  await a.click('[data-action="import-data"]');
  const form = a.doc.querySelector("#modalForm");
  const file = {
    size: 500,
    text: async () =>
      JSON.stringify({
        open: [{ name: "Imported order", val310: "3105555555" }],
        finished: [],
        theme: "light",
        kb_texts: ["Imported personal knowledge"],
      }),
  };
  Object.defineProperty(form.elements.files, "files", { value: [file] });
  form.elements.confirmed.checked = true;
  await a.submit("#modalForm");
  assert.equal(a.saved("Pavel").open[0].name, "Imported order");
  const keys = Object.keys(a.w.localStorage).filter((k) =>
    k.startsWith("ot:backup:import-"),
  );
  assert.equal(keys.length, 1);
  assert.equal(a.w.localStorage.getItem(keys[0]), before);
  await a.click('[data-action="saved-backups"]');
  assert.ok(a.doc.querySelector('[data-action="download-backup"]'));
});

async function uploadScreenshot(a, text, kind = "order") {
  a.w.CDCOCR.recognize = async () => ({
    rows: a.w.CDCOCR.parseRows(text, kind),
    rawText: text,
    confidence: 95,
  });
  await a.click(
    kind === "eflow"
      ? '[data-action="import-eflow"]'
      : '[data-action="import-order"]',
  );
  const file = new a.w.File(["test image"], "rows.png", { type: "image/png" });
  const input = a.doc.querySelector("#screenshotFile");
  Object.defineProperty(input, "files", { value: [file] });
  input.dispatchEvent(new a.w.Event("change", { bubbles: true }));
  for (let i = 0; i < 100 && input.disabled; i++) await tick();
  assert.equal(input.disabled, false, "Import should finish");
}
test("OCR creates every partial row immediately, attaches one shared image and supports undo", async (t) => {
  const a = await setup(pavelSeed(), "#user/open");
  t.after(() => a.w.close());
  await uploadScreenshot(
    a,
    "Customer: Alpha\n310x: 3101111111\n\n310x: 3102222222",
  );
  const created = a.saved("Pavel").open.filter((o) => o.importBatchId);
  assert.equal(created.length, 2);
  assert.equal(created[1].name, "");
  assert.equal(created[1].customer, "");
  assert.equal(
    created[0].files[0].attachmentId,
    created[1].files[0].attachmentId,
  );
  assert.equal(a.doc.querySelector('[name="reviewed"]'), null);
  assert.match(
    a.doc.querySelector("#importResults").textContent,
    /2 orders created/,
  );
  await a.click('[data-action="undo-import"]');
  assert.equal(a.saved("Pavel").open.length, 1);
  assert.equal(a.saved("Pavel").trash.length, 2);
});
test("screenshots containing no recognizable information create nothing", async (t) => {
  const a = await setup(pavelSeed(), "#user/open");
  t.after(() => a.w.close());
  const before = a.w.localStorage.getItem("ot:Pavel");
  await uploadScreenshot(a, "An ordinary photo of a tree");
  assert.equal(a.w.localStorage.getItem("ot:Pavel"), before);
  assert.match(
    a.doc.querySelector("#importResults").textContent,
    /No recognizable fields/,
  );
});
test("eFlow screenshot import sorts rows, links existing orders and completes/restores them", async (t) => {
  const a = await setup(pavelSeed(), "#user/eflow");
  t.after(() => a.w.close());
  await uploadScreenshot(
    a,
    "42x | Date from | Bruttobetrag | BS-ID | Client name\n4200100 | 23.09.2026 | 1.234,56 | BS-1 | Alpha\n4200200 | 01.09.2026 | 100,00 | BS-2 | Beta",
    "eflow",
  );
  let flows = a.saved("Pavel").eflows;
  assert.equal(flows.length, 2);
  assert.equal(flows[0].linkedOrderId, "100");
  a.doc.querySelector("#modal").close();
  const displayed = [...a.doc.querySelectorAll("[data-eflow-id]")].map(
    (el) => el.dataset.eflowId,
  );
  assert.deepEqual(displayed, [flows[1].id, flows[0].id]);
  await a.click(
    '[data-action="complete-eflow"][data-id="' + flows[0].id + '"]',
  );
  assert.equal(a.saved("Pavel").open.length, 0);
  const finished = a.saved("Pavel").finished.find((o) => o.id === 100);
  assert.equal(finished.notes[0].text, "Preserved update");
  assert.equal(finished.tasks[0].done, true);
  const state = a.doc.querySelector("#eflowState");
  state.value = "completed";
  state.dispatchEvent(new a.w.Event("change", { bubbles: true }));
  await a.click('[data-action="reopen-eflow"][data-id="' + flows[0].id + '"]');
  assert.equal(a.saved("Pavel").open[0].id, 100);
  assert.equal(a.saved("Pavel").eflows[0].completed, false);
});
test("assigned categories drive defaults and tools without discarding eFlows on a change", async (t) => {
  const a = await setup(pavelSeed(), "#settings");
  t.after(() => a.w.close());
  a.doc.querySelector("#profileCategoryForm").elements.assignedProduct.value =
    "pabx";
  await a.submit("#profileCategoryForm");
  assert.equal(a.saved("Pavel").assignedProduct, "pabx");
  await a.route("user/open");
  assert.equal(a.doc.querySelector('a[href="#user/eflow"]'), null);
  await uploadScreenshot(a, "Customer: PABX Customer");
  assert.equal(a.saved("Pavel").open.at(-1).product, "pabx");
  a.doc.querySelector("#modal").close();
  await a.route("settings");
  a.doc.querySelector("#profileCategoryForm").elements.assignedProduct.value =
    "lan";
  await a.submit("#profileCategoryForm");
  await a.route("user/open");
  assert.ok(a.doc.querySelector('a[href="#user/eflow"]'));
});
test("closing the importer before OCR finishes never saves an entry", async (t) => {
  const a = await setup(pavelSeed(), "#user/open");
  t.after(() => a.w.close());
  let resolve;
  a.w.CDCOCR.recognize = () => new Promise((r) => (resolve = r));
  await a.click('[data-action="import-order"]');
  const input = a.doc.querySelector("#screenshotFile");
  Object.defineProperty(input, "files", {
    value: [new a.w.File(["x"], "test.png", { type: "image/png" })],
  });
  input.dispatchEvent(new a.w.Event("change", { bubbles: true }));
  a.doc.querySelector("#modal").close();
  resolve({ rows: a.w.CDCOCR.parseOrderRows("Customer: Cancelled") });
  await tick();
  assert.equal(a.saved("Pavel").open.length, 1);
});
test("a new profile keeps its selected product category", async (t) => {
  const a = await setup({}, "#users");
  t.after(() => a.w.close());
  const f = a.doc.querySelector("#createUserForm");
  f.elements.username.value = "Standard User";
  f.elements.passport.value = "CDC2026001";
  f.elements.assignedProduct.value = "standard";
  await a.submit("#createUserForm");
  assert.equal(a.saved("Standard User").assignedProduct, "standard");
  await a.click('[data-action="new-order"]');
  assert.equal(
    a.doc.querySelector("#modalForm").elements.product.value,
    "standard",
  );
});

test("backup import retains eFlow links and remaps images shared with orders and archived entries", async (t) => {
  const a = await setup(pavelSeed(), "#settings");
  t.after(() => a.w.close());
  const normalFetch = a.w.fetch;
  a.w.fetch = async (url) =>
    String(url).startsWith("data:")
      ? { blob: async () => new Blob(["x"], { type: "image/png" }) }
      : normalFetch(url);
  await a.click('[data-action="import-data"]');
  const record = {
    schemaVersion: 3,
    assignedProduct: "lan",
    open: [
      {
        id: "imported-order",
        name: "Linked order",
        files: [{ name: "shared", attachmentId: "original-image" }],
      },
    ],
    eflows: [
      {
        id: "imported-flow",
        linkedOrderId: "imported-order",
        linkMode: "manual",
        val42: "420010001",
        files: [{ name: "shared", attachmentId: "original-image" }],
      },
    ],
    trash: [
      {
        kind: "eflows",
        record: {
          id: "archived-flow",
          files: [{ name: "shared", attachmentId: "original-image" }],
        },
      },
    ],
    attachments: [
      {
        id: "original-image",
        name: "shared",
        dataURL: "data:image/png;base64,eA==",
      },
    ],
  };
  const form = a.doc.querySelector("#modalForm");
  Object.defineProperty(form.elements.files, "files", {
    value: [{ size: 1000, text: async () => JSON.stringify(record) }],
  });
  form.elements.confirmed.checked = true;
  await a.submit("#modalForm");
  const saved = a.saved("Pavel");
  assert.equal(saved.eflows[0].linkedOrderId, "imported-order");
  const imageId = saved.open[0].files[0].attachmentId;
  assert.notEqual(imageId, "original-image");
  assert.equal(saved.eflows[0].files[0].attachmentId, imageId);
  assert.equal(saved.trash[0].record.files[0].attachmentId, imageId);
});
