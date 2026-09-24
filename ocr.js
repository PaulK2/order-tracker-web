(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CDCOCR = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const ALIASES = {
    customer: [
      "customer name",
      "customer",
      "kundenname",
      "kunde",
      "auftraggeber",
      "клиент",
    ],
    name: [
      "order name",
      "order title",
      "auftragsname",
      "auftragsbezeichnung",
      "bestellname",
      "bezeichnung",
      "поръчка",
    ],
    product: [
      "type of product",
      "product type",
      "product",
      "produkttyp",
      "produkt",
      "продукт",
    ],
    val310: [
      "310x number",
      "310x",
      "310 number",
      "310 nummer",
      "310",
      "auftragsnummer",
    ],
    bsId: ["bs-id", "bs id", "bsid", "business service id"],
    status: ["order status", "auftragsstatus", "status", "статус"],
    date: [
      "order date",
      "creation date",
      "created on",
      "created at",
      "date",
      "auftragsdatum",
      "erstelldatum",
      "erstellt am",
      "datum",
      "дата",
    ],
  };
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const names = Object.entries(ALIASES)
    .flatMap(([key, aliases]) => aliases.map((alias) => ({ key, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);
  const labels = names
    .map((x) => escape(x.alias).replace(/[ -]/g, "[ \\-]?"))
    .join("|");
  const keyFor = (label) =>
    names.find(
      (x) =>
        x.alias.toLowerCase().replace(/[ -]/g, "") ===
        label.toLowerCase().replace(/[ -]/g, ""),
    )?.key;
  function normalizeDate(raw) {
    let year, month, day;
    let m = String(raw).match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (m) [, year, month, day] = m;
    else {
      m = String(raw).match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
      if (m) [, day, month, year] = m;
    }
    if (!year) return "";
    const date = new Date(Date.UTC(+year, +month - 1, +day));
    if (
      date.getUTCFullYear() !== +year ||
      date.getUTCMonth() !== +month - 1 ||
      date.getUTCDate() !== +day
    )
      return "";
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  function parseOrderText(text) {
    const raw = String(text || "")
      .replace(/\r/g, "")
      .replace(/\u00a0/g, " ");
    const result = {
      customer: "",
      name: "",
      product: "",
      val310: "",
      bsId: "",
      status: "",
      date: "",
    };
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    // Column headings followed by a data row (tabs, pipe separators or OCR-preserved spacing).
    for (let i = 0; i < lines.length - 1; i++) {
      const cells = lines[i].split(/\t+|\s*\|\s*| {2,}/).filter(Boolean);
      const keys = cells.map(keyFor);
      const values = lines[i + 1].split(/\t+|\s*\|\s*| {2,}/).filter(Boolean);
      if (keys.filter(Boolean).length >= 3 && values.length === cells.length)
        keys.forEach((key, j) => {
          if (key) result[key] = values[j];
        });
    }
    for (let i = 0; i < lines.length; i++) {
      // Multiple explicit label:value pairs can appear on one OCR line.
      const pattern = new RegExp(
        `(?:^|[\\s|;])(${labels})\\s*[:=：]\\s*`,
        "gi",
      );
      const matches = [...lines[i].matchAll(pattern)];
      if (matches.length)
        matches.forEach((match, j) => {
          const key = keyFor(match[1]);
          const value = lines[i]
            .slice(
              match.index + match[0].length,
              matches[j + 1]?.index ?? lines[i].length,
            )
            .replace(/[|;]\s*$/, "")
            .trim();
          const next = lines[i + 1] || "";
          if (key && !result[key])
            result[key] =
              value ||
              (!new RegExp(`^(?:${labels})(?:\\s*[:=：]|$)`, "i").test(next)
                ? next
                : "");
        });
      else {
        const m = lines[i].match(
          new RegExp(`^(${labels})(?:\\s+(.+)|\\s*$)`, "i"),
        );
        if (m) {
          const key = keyFor(m[1]);
          const value = m[2] || lines[i + 1] || "";
          // Do not mistake a whole column-header row for a value.
          if (
            key &&
            !result[key] &&
            !new RegExp(`^(?:${labels})(?:\\s*[:=：]|$)`, "i").test(value)
          )
            result[key] = value.trim();
        }
      }
    }
    const productText = result.product || raw;
    result.product = /\b(?:pabx|pbx)\b/i.test(productText)
      ? "pabx"
      : /\b(?:lan[\s-]*service|lan)\b/i.test(productText)
        ? "lan"
        : /\bstandard\b/i.test(productText)
          ? "standard"
          : "";
    const number =
      (result.val310 || "")
        .replace(/[oO]/g, "0")
        .replace(/[Il]/g, "1")
        .match(/310[\d\s-]{3,}/) || raw.match(/\b310\d{3,}\b/);
    result.val310 = number ? number[0].replace(/[\s-]/g, "") : "";
    result.bsId = result.bsId.replace(/^[#:\s]+/, "").trim();
    result.date = normalizeDate(result.date);
    const missing = Object.keys(result).filter((k) => !result[k]);
    return { fields: result, missing, rawText: raw };
  }
  let enginePromise;
  function loadEngine() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (!enginePromise)
      enginePromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "vendor/tesseract.min.js";
        script.onload = () =>
          window.Tesseract
            ? resolve(window.Tesseract)
            : reject(new Error("Could not load the image reader."));
        script.onerror = () => {
          enginePromise = null;
          script.remove();
          reject(
            new Error(
              "Could not load the image reader. Check your connection and try again.",
            ),
          );
        };
        document.head.append(script);
      });
    return enginePromise;
  }
  async function imageCanvas(file) {
    if (!/^image\/(png|jpe?g|webp|bmp)$/i.test(file.type))
      throw new Error("Choose a PNG, JPEG, WebP or BMP screenshot.");
    if (file.size > 12 * 1024 * 1024)
      throw new Error("Choose an image smaller than 12 MB.");
    const bitmap = await createImageBitmap(file);
    if (bitmap.width * bitmap.height > 32_000_000) {
      bitmap.close();
      throw new Error(
        "This image is too large. Crop it to the order details first.",
      );
    }
    const factor = Math.min(2, 3000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * factor);
    canvas.height = Math.round(bitmap.height * factor);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas;
  }
  async function recognize(file, onProgress = () => {}, signal) {
    const canvas = await imageCanvas(file);
    if (signal?.aborted) throw new Error("Image reading cancelled.");
    onProgress("Loading image reader…", 0);
    const Tesseract = await loadEngine();
    let worker;
    const cancel = () => worker?.terminate();
    signal?.addEventListener("abort", cancel, { once: true });
    try {
      worker = await Tesseract.createWorker(["eng", "deu"], 1, {
        workerPath: new URL("vendor/worker.min.js", document.baseURI).href,
        corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0",
        logger: (m) =>
          onProgress(
            m.status === "recognizing text"
              ? "Reading order details…"
              : "Preparing image reader…",
            m.progress || 0,
          ),
      });
      // The pinned engine uses its default per-language CDN package layout.
      if (signal?.aborted) throw new Error("Image reading cancelled.");
      await worker.setParameters({ preserve_interword_spaces: "1" });
      const { data } = await worker.recognize(canvas);
      if (signal?.aborted) throw new Error("Image reading cancelled.");
      return { ...parseOrderText(data.text), confidence: data.confidence };
    } finally {
      signal?.removeEventListener("abort", cancel);
      await worker?.terminate();
    }
  }
  return { parseOrderText, normalizeDate, recognize, imageCanvas };
});
