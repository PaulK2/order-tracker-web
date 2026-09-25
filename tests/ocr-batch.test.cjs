const { test } = require("node:test");
const assert = require("node:assert/strict");
const O = require("../ocr.js");

test("imports every order row and retains empty interior cells", () => {
  const rows = O.parseOrderRows(
    "Customer | Order name | Product | 310x | BS-ID | Status | Date\n" +
      "Alpha GmbH | Upgrade | LAN Service | 3101111111 | BS-101 | In progress | 23.09.2026\n" +
      "Beta GmbH | | PABX | 3102222222 | | Waiting | 21.09.2026\n" +
      "Gamma | Office | Standard | 3103333333 | BS-303 | Open | 24.09.2026",
  );
  assert.equal(rows.length, 3);
  assert.equal(rows[1].fields.name, "");
  assert.equal(rows[1].fields.bsId, "");
  assert.equal(rows[1].fields.product, "pabx");
  assert.equal(rows[2].fields.val310, "3103333333");
});
test("repeated detail blocks become independent entries", () => {
  const rows = O.parseOrderRows(
    "Customer: Alpha\n310x: 3101111111\nCustomer: Beta\n310x: 3102222222",
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].fields.customer, "Alpha");
  assert.equal(rows[1].fields.customer, "Beta");
});
test("a single captured field is enough, while unrelated text and headings alone produce no entry", () => {
  assert.equal(O.parseOrderRows("3101234567").length, 1);
  assert.equal(O.parseOrderRows("Customer: Alpha")[0].fields.customer, "Alpha");
  assert.equal(
    O.parseOrderRows("Date: 23.09.2026")[0].fields.date,
    "2026-09-23",
  );
  assert.equal(O.parseOrderRows("An ordinary photo of a tree").length, 0);
  assert.equal(
    O.parseOrderRows("Customer | Order name | Product | Date").length,
    0,
  );
  assert.equal(
    O.parseOrderRows("Customer\nOrder name\nProduct\nDate").length,
    0,
  );
});
test("all five eFlow fields are extracted from German tables with amounts and multiple rows", () => {
  const rows = O.parseEflowRows(
    "42x | Datum von | Bruttobetrag | BS-ID | Kundenname\n" +
      "420010001 | 23.09.2026 | 1.234,56 EUR | BS-10 | Alpha GmbH\n" +
      "420010002 | 01.09.2026 | 98,70 | BS-20 | Beta GmbH\n" +
      "420010003 | | 0,00 | | Gamma GmbH\nSumme: 1.333,26",
  );
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0].fields, {
    val42: "420010001",
    dateFrom: "2026-09-23",
    grossAmount: "1234.56",
    bsId: "BS-10",
    customer: "Alpha GmbH",
  });
  assert.equal(rows[2].fields.dateFrom, "");
  assert.equal(rows[2].fields.grossAmount, "0.00");
});
test("eFlow partial details and currency formats are accepted without inventing values", () => {
  assert.equal(
    O.parseEflowRows("Bruttobetrag: 123,45")[0].fields.grossAmount,
    "123.45",
  );
  assert.equal(O.parseEflowRows("42x: 420010001")[0].fields.customer, "");
  assert.equal(O.normalizeAmount("€ 1.234,56"), "1234.56");
  assert.equal(O.normalizeAmount("1,234.56"), "1234.56");
  assert.equal(O.normalizeAmount("—"), "");
  assert.equal(O.normalizeAmount("-20,50"), "-20.50");
});
test("positioned OCR words retain a blank cell instead of shifting subsequent columns", () => {
  const word = (text, x0, y0, width = text.length * 10) => ({
    text,
    bbox: { x0, y0, x1: x0 + width, y1: y0 + 18 },
  });
  const lines = [
    [
      word("42x", 10, 10),
      word("Date", 220, 10),
      word("from", 270, 10),
      word("Bruttobetrag", 420, 10),
      word("BS-ID", 640, 10),
      word("Client", 800, 10),
      word("name", 870, 10),
    ],
    [
      word("420010001", 10, 60),
      word("23.09.2026", 220, 60),
      word("1.234,56", 420, 60),
      word("BS-10", 640, 60),
      word("Alpha", 800, 60),
      word("GmbH", 860, 60),
    ],
    [
      word("420010002", 10, 110),
      word("99,00", 420, 110),
      word("BS-20", 640, 110),
      word("Beta", 800, 110),
    ],
  ];
  const blocks = [
    { paragraphs: [{ lines: lines.map((words) => ({ words })) }] },
  ];
  const rows = O.parseEflowRows("", blocks);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].fields.dateFrom, "");
  assert.equal(rows[1].fields.grossAmount, "99.00");
  assert.equal(rows[1].fields.bsId, "BS-20");
});
test("blank first cells and single-column screenshots do not lose rows", () => {
  const rows = O.parseOrderRows(
    "Customer | Order name | 310x\n | Upgrade | 3101234567\nBeta | | 3102345678",
  );
  assert.equal(rows[0].fields.customer, "");
  assert.equal(rows[0].fields.name, "Upgrade");
  assert.equal(rows[0].fields.val310, "3101234567");
  assert.equal(O.parseEflowRows("42x\n420010001\n420010002").length, 2);
});
