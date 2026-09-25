(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CDCOCR = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const P =
    typeof module === "object" && module.exports
      ? require("./ocr-parser.js")
      : window.CDCRowParser;
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
    const factor = Math.min(
      2,
      Math.max(1, 3600 / Math.max(bitmap.width, bitmap.height)),
    );
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
  async function recognize(
    file,
    onProgress = () => {},
    signal,
    kind = "order",
  ) {
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
              ? "Reading screenshot rows…"
              : "Preparing image reader…",
            m.progress || 0,
          ),
      });
      // The pinned engine uses its default per-language CDN package layout.
      if (signal?.aborted) throw new Error("Image reading cancelled.");
      await worker.setParameters({ preserve_interword_spaces: "1" });
      const { data } = await worker.recognize(
        canvas,
        {},
        { text: true, blocks: true },
      );
      if (signal?.aborted) throw new Error("Image reading cancelled.");
      return {
        rows: P.parseRows(data.text, kind, data.blocks),
        rawText: data.text,
        confidence: data.confidence,
        kind,
      };
    } finally {
      signal?.removeEventListener("abort", cancel);
      await worker?.terminate();
    }
  }
  return { ...P, recognize, imageCanvas };
});
