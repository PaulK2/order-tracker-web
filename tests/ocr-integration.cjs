const { createWorker } = require("tesseract.js");
const { parseOrderText, parseRows } = require("../ocr.js");
const assert = require("node:assert/strict");
(async () => {
  const worker = await createWorker(["eng", "deu"], 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && m.progress === 1)
        console.log("Screenshot recognized.");
    },
  });
  try {
    await worker.setParameters({ preserve_interword_spaces: "1" });
    const { data } = await worker.recognize(
      require("node:path").join(__dirname, "fixtures/order-screenshot.png"),
    );
    const result = parseOrderText(data.text);
    assert.deepEqual(result.fields, {
      customer: "Example Networks GmbH",
      name: "Berlin Office Connectivity",
      product: "lan",
      val310: "3101234567",
      bsId: "BS-204812",
      status: "In progress",
      date: "2026-09-23",
    });
    console.log(
      "PASS: actual English/German OCR engine extracted all 7 fields from the screenshot. Confidence:",
      data.confidence,
    );
    for (const [filename, kind] of [
      ["orders-table.png", "order"],
      ["eflow-table.png", "eflow"],
    ]) {
      const { data: page } = await worker.recognize(
        require("node:path").join(__dirname, "fixtures", filename),
        {},
        { text: true, blocks: true },
      );
      const rows = parseRows(page.text, kind, page.blocks);
      console.log(filename, JSON.stringify(rows.map((r) => r.fields)));
      assert.equal(rows.length, 3, filename + " should produce all three rows");
      if (kind === "order") {
        assert.deepEqual(
          rows.map((r) => r.fields.val310),
          ["3101111111", "3102222222", "3103333333"],
        );
        assert.deepEqual(
          rows.map((r) => r.fields.product),
          ["lan", "pabx", "standard"],
        );
        assert.deepEqual(
          rows.map((r) => r.fields.customer),
          ["Alpha GmbH", "Beta GmbH", "Gamma GmbH"],
        );
      } else {
        assert.deepEqual(
          rows.map((r) => r.fields.val42),
          ["420010001", "420010002", "420010003"],
        );
        assert.deepEqual(
          rows.map((r) => r.fields.dateFrom),
          ["2026-09-23", "2026-09-01", ""],
        );
        assert.deepEqual(
          rows.map((r) => r.fields.grossAmount),
          ["1234.56", "98.70", "0.00"],
        );
        assert.deepEqual(
          rows.map((r) => r.fields.bsId),
          ["BS-101", "BS-202", "BS-303"],
        );
        assert.deepEqual(
          rows.map((r) => r.fields.customer),
          ["Alpha GmbH", "Beta GmbH", "Gamma GmbH"],
        );
      }
      console.log("PASS: real OCR extracted all rows from " + filename);
    }
  } finally {
    await worker.terminate();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
