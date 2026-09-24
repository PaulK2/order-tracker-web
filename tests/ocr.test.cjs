const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseOrderText, normalizeDate } = require("../ocr.js");
test("extracts all seven required fields from English labels", () => {
  const result = parseOrderText(
    "Customer name: Example Networks GmbH\nOrder name: Berlin Office Connectivity\nProduct: LAN Service\n310x: 3101234567\nBS-ID: BS-204812\nStatus: In progress\nDate: 23.09.2026",
  );
  assert.deepEqual(result.fields, {
    customer: "Example Networks GmbH",
    name: "Berlin Office Connectivity",
    product: "lan",
    val310: "3101234567",
    bsId: "BS-204812",
    status: "In progress",
    date: "2026-09-23",
  });
  assert.deepEqual(result.missing, []);
});
test("extracts German labels and normalizes product and date", () => {
  const result = parseOrderText(
    "Kundenname: Beispiel GmbH\nAuftragsname: Telefonanlage\nProdukttyp: PABX\nAuftragsnummer: 3109876543\nBS-ID: 204812\nAuftragsstatus: In Bearbeitung\nAuftragsdatum: 9.2.2026",
  );
  assert.equal(result.fields.customer, "Beispiel GmbH");
  assert.equal(result.fields.name, "Telefonanlage");
  assert.equal(result.fields.product, "pabx");
  assert.equal(result.fields.status, "In Bearbeitung");
  assert.equal(result.fields.date, "2026-02-09");
  assert.equal(result.fields.bsId, "204812");
});
test("handles labels followed by values on separate lines", () => {
  const result = parseOrderText(
    "Customer name\nExample Ltd\nOrder name\nNew Office\nProduct type\nStandard\nBS-ID\nBS-20\nDate\n2026-09-23",
  );
  assert.equal(result.fields.customer, "Example Ltd");
  assert.equal(result.fields.name, "New Office");
  assert.equal(result.fields.product, "standard");
  assert.equal(result.fields.bsId, "BS-20");
  assert.equal(result.fields.date, "2026-09-23");
});
test("does not hallucinate customer, status or date for an unrelated screenshot", () => {
  const result = parseOrderText("An ordinary unrelated photo with a few words");
  assert.ok(Object.values(result.fields).every((v) => v === ""));
  assert.equal(result.missing.length, 7);
});
test("parses table headers and aligned values", () => {
  const result = parseOrderText(
    "Customer name | Order name | Product | 310x | BS-ID | Status | Date\nACME GmbH | New Office | Standard | 3101234567 | BS-42 | Waiting | 23.09.2026",
  );
  assert.equal(result.fields.customer, "ACME GmbH");
  assert.equal(result.fields.name, "New Office");
  assert.equal(result.fields.product, "standard");
  assert.equal(result.fields.date, "2026-09-23");
});
test("parses multiple explicit fields on one line", () => {
  const result = parseOrderText(
    "Customer: ACME  Order name: Upgrade  Product: PABX  BS-ID: BS-50  Status: Waiting",
  );
  assert.equal(result.fields.customer, "ACME");
  assert.equal(result.fields.name, "Upgrade");
  assert.equal(result.fields.status, "Waiting");
  assert.equal(result.fields.bsId, "BS-50");
});
test("dates are validated rather than silently rolled into the next month", () => {
  assert.equal(normalizeDate("31.02.2026"), "");
  assert.equal(normalizeDate("2026-13-01"), "");
  assert.equal(normalizeDate("29.02.2024"), "2024-02-29");
  assert.equal(normalizeDate("2026-09-23 10:30:00"), "2026-09-23");
});
