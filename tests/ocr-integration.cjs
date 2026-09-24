const { createWorker } = require("tesseract.js");
const { parseOrderText } = require("../ocr.js");
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
  } finally {
    await worker.terminate();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
