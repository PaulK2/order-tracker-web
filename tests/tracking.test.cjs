const { test } = require("node:test");
const assert = require("node:assert/strict");
const D = require("../data.js");
const T = require("../tracking.js");
const O = require("../ocr.js");
const sample = () =>
  D.normalizeData({
    open: [
      {
        id: "a",
        name: "LAN Upgrade",
        product: "lan",
        val42: "420010001",
        bsId: "BS-10",
        customer: "Alpha GmbH",
        status: "Waiting",
        tasks: [{ name: "Original", done: true }],
        notes: [{ text: "History" }],
        files: [{ name: "Portal", url: "https://example.com" }],
        custom: "retained",
      },
    ],
    finished: [],
    eflows: [
      {
        id: "flow",
        val42: "420010001",
        dateFrom: "2026-09-23",
        customer: "Alpha GmbH",
      },
    ],
  });
test("category assignment preserves legacy records and infers a uniform existing product", () => {
  assert.equal(sample().assignedProduct, "lan");
  assert.equal(
    D.normalizeData({ open: [{ product: "pabx" }] }).assignedProduct,
    "pabx",
  );
  assert.equal(
    D.normalizeData({ assignedProduct: "standard", open: [{ product: "lan" }] })
      .assignedProduct,
    "standard",
  );
  const data = sample();
  assert.deepEqual(D.normalizeData(data), data);
});
test("batch import retains partial rows, applies profile defaults and links a shared image", () => {
  const data = D.emptyData();
  data.assignedProduct = "standard";
  const rows = O.parseOrderRows(
    "Customer: Alpha\n310x: 3101111111\n\n310x: 3102222222\n\nOrder name: Phone\nProduct: PABX\n310x: 3103333333",
  );
  const result = T.importRows(data, "order", rows, {
    attachment: { attachmentId: "img" },
    workspace: () => ({ categories: [{ name: "Checklist", tasks: ["Step"] }] }),
  });
  assert.equal(result.count, 3);
  assert.equal(data.open[0].product, "standard");
  assert.equal(data.open[1].customer, "");
  assert.equal(data.open[1].name, "");
  assert.equal(data.open[2].product, "pabx");
  assert.equal(new Set(data.open.map((o) => o.files[0].attachmentId)).size, 1);
  assert.equal(new Set(data.open.map((o) => o.id)).size, 3);
  assert.throws(() => T.importRows(data, "order", []), /No order information/);
});
test("42x linking and completion preserve all original order detail and are reversible", () => {
  const data = sample(),
    original = D.copy(data.open[0]);
  T.synchronize(data);
  assert.equal(data.eflows[0].linkedOrderId, "a");
  T.completeEflow(data, "flow");
  assert.equal(data.open.length, 0);
  assert.equal(data.finished[0].status, "Completed");
  for (const key of ["tasks", "notes", "files", "custom", "val42", "bsId"])
    assert.deepEqual(data.finished[0][key], original[key]);
  T.completeEflow(data, "flow");
  assert.equal(data.finished.length, 1);
  T.reopenEflow(data, "flow");
  assert.equal(data.open[0].status, "Waiting");
  assert.equal(data.finished.length, 0);
});
test("BS-ID links when a 42x reference is missing, and later orders can match imported eFlows", () => {
  const data = sample();
  delete data.open[0].val42;
  data.eflows[0].bsId = "bs 10";
  T.synchronize(data);
  assert.equal(data.eflows[0].linkedOrderId, "a");
  const next = D.emptyData();
  T.importRows(next, "eflow", O.parseEflowRows("BS-ID: BS-10"));
  T.importRows(next, "order", O.parseOrderRows("BS-ID: BS-10"));
  assert.equal(next.eflows[0].linkedOrderId, next.open[0].id);
});
test("ambiguous customer names, conflicting references and non-LAN orders never auto-complete", () => {
  const data = sample();
  data.eflows[0].val42 = "";
  data.open.push({ ...D.copy(data.open[0]), id: "b" });
  T.completeEflow(data, "flow");
  assert.equal(data.open.length, 2);
  assert.equal(data.eflows[0].linkedOrderId, null);
  const other = sample();
  other.eflows[0].bsId = "BS-CONFLICT";
  T.completeEflow(other, "flow");
  assert.equal(other.open.length, 1);
  const standard = sample();
  standard.open[0].product = "standard";
  T.completeEflow(standard, "flow");
  assert.equal(standard.open.length, 1);
});
test("an unambiguous client match can link, while explicit unlinked entries stay unlinked", () => {
  const data = sample();
  data.eflows[0].val42 = "";
  T.linkEflows(data);
  assert.equal(data.eflows[0].linkedOrderId, "a");
  data.eflows[0].linkMode = "none";
  T.completeEflow(data, "flow");
  assert.equal(data.open.length, 1);
});
test("manual links resolve ambiguity and reopening an eFlow never reopens unrelated finished orders", () => {
  const data = sample();
  data.eflows[0].val42 = "";
  data.eflows[0].customer = "";
  data.eflows[0].linkedOrderId = "a";
  data.eflows[0].linkMode = "manual";
  T.completeEflow(data, "flow");
  assert.equal(data.finished.length, 1);
  delete data.finished[0].completedByEflowId;
  T.reopenEflow(data, "flow");
  assert.equal(data.finished.length, 1);
});
test("eFlows sort by date oldest first and place unknown dates last", () => {
  assert.deepEqual(
    T.sortEflows([
      { id: "unknown", dateFrom: "" },
      { id: "later", dateFrom: "2026-09-20" },
      { id: "earlier", dateFrom: "2026-01-02" },
    ]).map((e) => e.id),
    ["earlier", "later", "unknown"],
  );
});
test("a completed historical client-only eFlow cannot complete a future order", () => {
  const data = sample();
  data.eflows[0].val42 = "";
  data.eflows[0].completed = true;
  T.synchronize(data);
  assert.equal(data.open.length, 1);
});
test("v2 upgrades preserve a byte-exact backup without replacing the original v1 backup", () => {
  const raw = JSON.stringify({
    schemaVersion: 2,
    open: [{ name: "Keep me" }],
    custom: "Keep too",
  });
  const map = new Map([
    ["ot:Pavel", raw],
    ["ot:backup:v1:Pavel", "original"],
  ]);
  const store = D.createStore({
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  });
  store.load("Pavel");
  assert.equal(map.get("ot:backup:v2:Pavel"), raw);
  assert.equal(map.get("ot:backup:v1:Pavel"), "original");
  assert.equal(map.get("ot:Pavel"), raw);
});
