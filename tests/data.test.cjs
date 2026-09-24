const { test } = require("node:test");
const assert = require("node:assert/strict");
const D = require("../data.js");
class MemoryStorage {
  constructor(seed = {}) {
    this.map = new Map(Object.entries(seed));
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    this.map.set(k, String(v));
  }
  removeItem(k) {
    this.map.delete(k);
  }
}
const legacy = () => ({
  open: [
    {
      id: 17,
      name: "Pavel customer order",
      val310: "3100012345",
      val42: "42007890",
      val23: "23006789",
      category: "Custom",
      tasks: [{ name: "Original task", done: true, custom: "keep" }],
      notes: [{ ts: "2026-09-01", text: "Original note", extra: true }],
      files: [{ name: "File", url: "https://example.com", metadata: "keep" }],
      extraOrder: { keep: true },
    },
  ],
  finished: [
    {
      id: 18,
      name: "Completed",
      tasks: [],
      notes: [{ text: "Finished note" }],
    },
  ],
  links: [{ name: "Portal", link: "https://example.com", extra: "retain" }],
  kb_texts: ["Grüße от Павел"],
  kb_tabs: [
    {
      name: "My tab",
      color: "#112233",
      rows: [{ name: "Network", value: "Knowledge", extra: "retain" }],
      extra: "retain",
    },
  ],
  categories: [{ name: "Custom", color: "#abcdef", tasks: ["Original task"] }],
  theme: "dark",
  customRoot: { preserve: "yes" },
});
test("migration preserves every existing collection and unknown metadata without mutating input", () => {
  const source = legacy(),
    before = JSON.stringify(source),
    result = D.normalizeData(source);
  assert.equal(JSON.stringify(source), before);
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.open[0].product, "lan");
  assert.equal(result.open[0].val42, "42007890");
  assert.equal(result.open[0].val23, "23006789");
  assert.deepEqual(result.open[0].notes, source.open[0].notes);
  assert.deepEqual(result.open[0].tasks, source.open[0].tasks);
  assert.deepEqual(result.open[0].files, source.open[0].files);
  assert.deepEqual(result.customRoot, source.customRoot);
  assert.deepEqual(result.links, source.links);
  assert.deepEqual(result.kb_tabs, source.kb_tabs);
  assert.deepEqual(result.finished[0].tasks, []);
  assert.equal(result.theme, "dark");
});
test("migration is idempotent and legacy missing IDs are stable", () => {
  const source = legacy();
  delete source.open[0].id;
  const once = D.normalizeData(source);
  assert.deepEqual(D.normalizeData(once), once);
});
test("exact legacy backup is created before a v2 record is saved, never overwritten", () => {
  const raw = JSON.stringify(legacy(), null, 2),
    storage = new MemoryStorage({ "ot:Pavel": raw, "ot:users": '["Pavel"]' }),
    store = D.createStore(storage);
  const record = store.load("Pavel");
  assert.equal(storage.getItem("ot:Pavel"), raw);
  assert.equal(storage.getItem("ot:backup:v1:Pavel"), raw);
  record.open[0].name = "Edited";
  store.save("Pavel", record);
  store.load("Pavel");
  assert.equal(storage.getItem("ot:backup:v1:Pavel"), raw);
});
test("Pavel resources are shared locally without bringing his orders into another profile", () => {
  const storage = new MemoryStorage({
      "ot:Pavel": JSON.stringify(legacy()),
      "ot:users": '["Pavel"]',
    }),
    store = D.createStore(storage);
  store.create("Another User", "CDC2026001");
  const user = store.load("Another User"),
    workspace = store.workspace("lan", {});
  assert.equal(user.open.length, 0);
  assert.equal(user.finished.length, 0);
  assert.equal(user.personalNotes.length, 0);
  assert.deepEqual(workspace.data.kb_texts, legacy().kb_texts);
  assert.equal(workspace.data.open, undefined);
  assert.equal(workspace.data.finished, undefined);
  assert.equal(workspace.data.personalNotes, undefined);
});
test("workspace edits never overwrite Pavel personal records", () => {
  const raw = JSON.stringify(legacy()),
    storage = new MemoryStorage({ "ot:Pavel": raw, "ot:users": '["Pavel"]' }),
    store = D.createStore(storage);
  const workspace = store.workspace("lan", {});
  workspace.data.links.push({ name: "New link", link: "https://example.org" });
  store.saveWorkspace("lan", workspace.data, "Pavel");
  assert.equal(storage.getItem("ot:Pavel"), raw);
  assert.equal(store.workspace("lan", {}).data.links.length, 2);
});
test("signup rejects incorrect passports, reserved usernames, and case-insensitive duplicates", () => {
  const store = D.createStore(new MemoryStorage());
  assert.throws(() => store.create("Test", "wrong"), /passport/);
  for (const name of [
    "users",
    "settings",
    "previewPayload",
    "currentUser",
    "a",
    "<script>",
  ])
    assert.throws(() => store.create(name, "CDC2026001"));
  assert.equal(store.create("Pavel", "CDC2026001"), "Pavel");
  assert.throws(() => store.create("pavel", "CDC2026001"), /already exists/);
  assert.equal(store.create("Павел 2", "CDC2026001"), "Павел 2");
});
test("malformed stored JSON is never replaced with defaults", () => {
  const storage = new MemoryStorage({ "ot:Pavel": "{bad json" }),
    store = D.createStore(storage);
  assert.throws(() => store.load("Pavel"), /left untouched/);
  assert.equal(storage.getItem("ot:Pavel"), "{bad json");
});
test("failed writes keep the previous record intact", () => {
  const raw = JSON.stringify(D.emptyData()),
    storage = new MemoryStorage({ "ot:Pavel": raw }),
    store = D.createStore(storage);
  storage.setItem = () => {
    throw Error("QuotaExceeded");
  };
  assert.throws(() => store.save("Pavel", { open: [{}] }), /could not save/);
  assert.equal(storage.getItem("ot:Pavel"), raw);
});
test("Python exports retain legacy paths, charts, strings and empty checklists", () => {
  const result = D.normalizeData({
    open: [
      { name: "Imported", tasks: ["Task"], files: ["C:\\Exports\\file.pdf"] },
    ],
    kb_chart: [{ name: "N", value: "V" }],
    default_tasks: ["One", "Two"],
  });
  assert.deepEqual(result.open[0].files, [
    { name: "file.pdf", url: "C:\\Exports\\file.pdf" },
  ]);
  assert.deepEqual(result.kb_tabs[0].rows, [{ name: "N", value: "V" }]);
  assert.deepEqual(result.categories[0].tasks, ["One", "Two"]);
});
test("share keys round-trip Unicode and added order metadata", () => {
  const data = D.normalizeData(legacy());
  data.open[0].bsId = "BS-1200";
  data.open[0].customer = "Übersicht";
  assert.deepEqual(D.decodeKey(D.encodeKey(data)), data);
});
test("links reject executable and unexpected URL schemes", () => {
  assert.equal(D.safeUrl("javascript:alert(1)"), "");
  assert.equal(D.safeUrl("data:text/html,<script>"), "");
  assert.equal(D.safeUrl("file:///tmp/file"), "");
  assert.equal(D.safeUrl("https://example.com"), "https://example.com/");
});
