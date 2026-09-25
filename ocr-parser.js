/* Row extraction stays independent of the OCR engine for deterministic layout tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CDCRowParser = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const shared = {
    customer: [
      "customer name",
      "client name",
      "kundenname",
      "auftraggeber",
      "customer",
      "client",
      "kunde",
      "клиент",
    ],
    bsId: ["business service id", "bs-id", "bs id", "bsid", "bs-ld"],
  };
  const schemas = {
    order: {
      ...shared,
      name: [
        "order name",
        "order title",
        "auftragsbezeichnung",
        "auftragsname",
        "bestellname",
        "bezeichnung",
        "поръчка",
      ],
      product: [
        "type of product",
        "product type",
        "produkttyp",
        "product",
        "produkt",
        "продукт",
      ],
      val310: [
        "310x number",
        "310 nummer",
        "310 number",
        "auftragsnummer",
        "310x",
        "310",
      ],
      status: ["order status", "auftragsstatus", "status", "статус"],
      date: [
        "order date",
        "creation date",
        "created on",
        "created at",
        "auftragsdatum",
        "erstelldatum",
        "erstellt am",
        "datum",
        "date",
        "дата",
      ],
      val42: [
        "42x number",
        "42x nummer",
        "42 number",
        "42 nummer",
        "sap auftrag",
        "42x",
        "42",
      ],
      val23: ["23x number", "23 nummer", "23x"],
    },
    eflow: {
      val42: [
        "42x number",
        "42x nummer",
        "42 number",
        "42 nummer",
        "sap auftrag",
        "auftragsnummer",
        "bestellnummer",
        "belegnummer",
        "42x",
        "42",
      ],
      dateFrom: [
        "date from",
        "datum von",
        "belegdatum",
        "erstelldatum",
        "eingangsdatum",
        "datum",
        "date",
        "von",
      ],
      grossAmount: [
        "bruttobetrag",
        "brutto betrag",
        "gross amount",
        "gross total",
        "betrag brutto",
        "brutto",
        "betrag",
      ],
      ...shared,
    },
  };
  const labelId = (s) =>
    String(s)
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
  const escape = (s) => s.replace(/[.*+?^{}()|[\]\\$]/g, "\\$&");
  const clean = (s) => {
    const value = String(s ?? "")
      .trim()
      .replace(/^[=:：]\s*/, "");
    return /^(?:[-–—]+|n\/a|null|unknown)$/i.test(value) ? "" : value;
  };
  function normalizeDate(raw) {
    const s = String(raw);
    let year,
      month,
      day,
      match = s.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (match) [, year, month, day] = match;
    else {
      match = s.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
      if (match) [, day, month, year] = match;
    }
    if (!year) return "";
    const d = new Date(Date.UTC(+year, +month - 1, +day));
    if (
      d.getUTCFullYear() !== +year ||
      d.getUTCMonth() !== +month - 1 ||
      d.getUTCDate() !== +day
    )
      return "";
    return year + "-" + month.padStart(2, "0") + "-" + day.padStart(2, "0");
  }
  function normalizeAmount(raw) {
    let s = clean(raw)
      .replace(/(?:EUR|EURO|€)/gi, "")
      .replace(/[\s']/g, "");
    if (!/^-?\d[\d.,]*$/.test(s)) return "";
    if (s.includes(",") && s.includes(".")) {
      s =
        s.lastIndexOf(",") > s.lastIndexOf(".")
          ? s.replace(/\./g, "").replace(",", ".")
          : s.replace(/,/g, "");
    } else if (s.includes(",")) {
      s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
    } else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    return /^-?\d+(?:\.\d{1,2})?$/.test(s) && Number.isFinite(Number(s))
      ? Number(s).toFixed(2)
      : "";
  }
  function reference(raw, prefix, spaced = false) {
    const text = String(raw || "")
      .replace(/[oO]/g, "0")
      .replace(/[Il]/g, "1");
    const pattern = new RegExp(
      "\\b" + prefix + (spaced ? "[\\d -]{3,}" : "\\d{3,}") + "\\b",
    );
    return (text.match(pattern)?.[0] || "").replace(/[ -]/g, "");
  }
  function normalize(fields, kind, rawText = "") {
    const out = Object.fromEntries(
      Object.keys(schemas[kind]).map((k) => [k, clean(fields[k])]),
    );
    for (const [key, prefix] of [
      ["val310", "310"],
      ["val42", "42"],
      ["val23", "23"],
    ])
      if (key in out) out[key] = reference(out[key], prefix, true);
    if (kind === "order") {
      const p = out.product;
      out.product = /\b(?:pabx|pbx)\b/i.test(p)
        ? "pabx"
        : /\blan(?:[ -]*service)?\b/i.test(p)
          ? "lan"
          : /\bstandard\b/i.test(p)
            ? "standard"
            : "";
      out.date = normalizeDate(out.date);
    } else {
      out.dateFrom = normalizeDate(out.dateFrom);
      out.grossAmount = normalizeAmount(out.grossAmount);
    }
    out.bsId = out.bsId.replace(/^[#:\s]+/, "");
    return {
      fields: out,
      missing: Object.keys(out).filter((k) => !out[k]),
      rawText,
    };
  }
  const hasFields = (r) => Object.values(r.fields).some((v) => v !== "");
  function vocabulary(kind) {
    const names = Object.entries(schemas[kind])
      .flatMap(([key, aliases]) => aliases.map((alias) => ({ key, alias })))
      .sort((a, b) => b.alias.length - a.alias.length);
    const keyFor = (label) =>
      names.find((n) => labelId(n.alias) === labelId(label))?.key;
    const labels = names
      .map((n) => escape(n.alias).replace(/[ -]/g, "[ \\-]?"))
      .join("|");
    return { names, keyFor, labels };
  }
  function cells(line, delimiter) {
    if (delimiter === "single") return [{ text: line.trim() }];
    if (delimiter === "pipe") {
      const parts = line.split("|");
      return parts.map((text) => ({ text: text.trim() }));
    }
    if (delimiter === "tab")
      return line.split("\t").map((text) => ({ text: text.trim() }));
    return [...line.matchAll(/\S(?:.*?\S)?(?= {2,}|$)/g)].map((m) => ({
      text: m[0],
      start: m.index,
    }));
  }
  function header(line, vocab) {
    const delimiter = line.includes("|")
      ? "pipe"
      : line.includes("\t")
        ? "tab"
        : "space";
    const columns = cells(line, delimiter).map((c) => ({
      ...c,
      key: vocab.keyFor(c.text),
    }));
    return columns.filter((c) => c.key).length >= 2
      ? { delimiter, columns }
      : null;
  }
  const footer = (s) =>
    /^(?:total|summe|gesamt(?:summe)?|page \d|seite \d|showing \d)\b/i.test(
      s.trim(),
    );
  function textTables(lines, vocab, kind) {
    const rows = [],
      used = new Set();
    for (let i = 0; i < lines.length; i++) {
      let h = header(lines[i], vocab);
      const single = vocab.keyFor(lines[i].trim());
      const remaining = lines.slice(i + 1).filter((l) => l.trim());
      if (
        !h &&
        single &&
        !lines.slice(0, i).some((l) => l.trim()) &&
        remaining.length &&
        !remaining.some(
          (l) => vocab.keyFor(l.trim()) || header(l, vocab) || /[:=：]/.test(l),
        )
      )
        h = { delimiter: "single", columns: [{ key: single }] };
      if (!h) continue;
      used.add(i);
      for (let j = i + 1; j < lines.length; j++) {
        if (header(lines[j], vocab)) break;
        if (!lines[j].trim()) continue;
        if (footer(lines[j])) {
          used.add(j);
          break;
        }
        if (/^[\s|+\-–_=]+$/.test(lines[j])) {
          used.add(j);
          continue;
        }
        if (
          new RegExp("^(?:" + vocab.labels + ")\\s*[:=：]", "i").test(
            lines[j].trim(),
          )
        )
          break;
        const values = cells(lines[j], h.delimiter);
        if (!values.length) continue;
        const fields = {};
        if (h.delimiter === "space" && values.length !== h.columns.length) {
          for (const value of values) {
            let index = 0;
            for (let c = 1; c < h.columns.length; c++)
              if (value.start >= h.columns[c].start - 3) index = c;
            if (h.columns[index].key) fields[h.columns[index].key] = value.text;
          }
        } else {
          h.columns.forEach((c, index) => {
            if (c.key) fields[c.key] = values[index]?.text || "";
          });
        }
        rows.push(normalize(fields, kind, lines[j]));
        used.add(j);
      }
    }
    return { rows: rows.filter(hasFields), used };
  }
  function wordLines(blocks) {
    const words = (blocks || [])
      .flatMap((b) =>
        (b.paragraphs || []).flatMap((p) =>
          (p.lines || []).flatMap((l) => l.words || []),
        ),
      )
      .filter(
        (w) =>
          w.text?.trim() &&
          w.bbox &&
          Number.isFinite(w.bbox.x0) &&
          Number.isFinite(w.bbox.y0),
      )
      .sort((a, b) => a.bbox.y0 + a.bbox.y1 - (b.bbox.y0 + b.bbox.y1));
    const lines = [];
    for (const w of words) {
      const cy = (w.bbox.y0 + w.bbox.y1) / 2,
        height = w.bbox.y1 - w.bbox.y0;
      let line = lines.at(-1);
      if (
        !line ||
        Math.abs(line.cy - cy) >
          Math.max(3, Math.min(line.height, height) * 0.65)
      ) {
        line = { cy, height, words: [] };
        lines.push(line);
      }
      line.words.push(w);
    }
    return lines.map((l) => ({
      ...l,
      words: l.words.sort((a, b) => a.bbox.x0 - b.bbox.x0),
    }));
  }
  function geometryHeader(words, vocab) {
    const columns = [];
    let matched = 0;
    for (let i = 0; i < words.length; i++) {
      for (let size = Math.min(4, words.length - i); size >= 1; size--) {
        const key = vocab.keyFor(
          words
            .slice(i, i + size)
            .map((w) => w.text)
            .join(" "),
        );
        if (key) {
          columns.push({
            key,
            left: words[i].bbox.x0,
            right: words[i + size - 1].bbox.x1,
          });
          matched += size;
          i += size - 1;
          break;
        }
      }
    }
    return columns.length >= 2 &&
      matched / words.length >= 0.75 &&
      new Set(columns.map((c) => c.key)).size === columns.length
      ? columns
      : null;
  }
  function geometryTables(blocks, vocab, kind) {
    const lines = wordLines(blocks),
      rows = [];
    let columns = null;
    for (const line of lines) {
      const h = geometryHeader(line.words, vocab);
      if (h) {
        columns = h;
        continue;
      }
      if (!columns) continue;
      const text = line.words.map((w) => w.text).join(" ");
      if (footer(text)) {
        columns = null;
        continue;
      }
      const values = columns.map(() => []);
      for (const word of line.words) {
        const x = (word.bbox.x0 + word.bbox.x1) / 2;
        let i = 0;
        while (
          i + 1 < columns.length &&
          x > (columns[i].right + columns[i + 1].left) / 2
        )
          i++;
        values[i].push(word.text);
      }
      const fields = Object.fromEntries(
        columns.map((c, i) => [c.key, values[i].join(" ")]),
      );
      const row = normalize(fields, kind, text);
      if (hasFields(row)) rows.push(row);
    }
    return rows;
  }
  function infer(text, kind) {
    const fields = {};
    if (kind === "order") {
      fields.val310 = reference(text, "310");
      fields.val23 = reference(text, "23");
      fields.product =
        text.match(/\b(?:LAN[ -]*Service|LAN|Standard|PABX|PBX)\b/i)?.[0] || "";
      fields.date = normalizeDate(text);
      const status = text.match(
        /\b(?:In progress|In Bearbeitung|Waiting|On hold|Completed|Erledigt|Abgeschlossen|Open|Offen)\b/i,
      );
      if (status) fields.status = status[0];
    } else fields.dateFrom = normalizeDate(text);
    fields.val42 = reference(text, "42");
    fields.bsId = text.match(/\bBS[- ]\d[\w-]*/i)?.[0] || "";
    return fields;
  }
  function detailRows(lines, vocab, kind) {
    const rows = [];
    let fields = {},
      raw = [];
    const flush = () => {
      if (!Object.keys(fields).length) {
        for (const line of raw) {
          const row = normalize(infer(line, kind), kind, line);
          if (hasFields(row)) rows.push(row);
        }
      } else {
        const inferred = infer(raw.join("\n"), kind);
        for (const [key, value] of Object.entries(inferred))
          if (!fields[key]) fields[key] = value;
        const row = normalize(fields, kind, raw.join("\n"));
        if (hasFields(row)) rows.push(row);
      }
      fields = {};
      raw = [];
    };
    const startsLabel = new RegExp(
      "^(?:" + vocab.labels + ")(?:\\s*[:=：]|$)",
      "i",
    );
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        // OCR inserts blank lines inside a single detail card. A new block only
        // starts here when its labels repeat fields already present.
        let next = i + 1;
        while (next < lines.length && !lines[next].trim()) next++;
        const following = [];
        while (next < lines.length && lines[next].trim())
          following.push(lines[next++].trim());
        const repeats = following.some((l) => {
          const m = l.match(
            new RegExp("^(" + vocab.labels + ")(?:\\s*[:=：]|\\s|$)", "i"),
          );
          return m && fields[vocab.keyFor(m[1])] !== undefined;
        });
        if (repeats) flush();
        continue;
      }
      if (footer(line)) {
        flush();
        continue;
      }
      const matches = [
        ...line.matchAll(
          new RegExp("(?:^|[\\s|;])(" + vocab.labels + ")\\s*[:=：]\\s*", "gi"),
        ),
      ];
      const pairs = [];
      if (matches.length) {
        matches.forEach((m, j) => {
          const value = line
            .slice(m.index + m[0].length, matches[j + 1]?.index ?? line.length)
            .replace(/[|;]\s*$/, "")
            .trim();
          pairs.push([vocab.keyFor(m[1]), value]);
        });
      } else {
        const m = line.match(
          new RegExp("^(" + vocab.labels + ")(?:\\s+(.+)|\\s*$)", "i"),
        );
        if (m) pairs.push([vocab.keyFor(m[1]), m[2] || ""]);
      }
      if (pairs.some(([key]) => fields[key] !== undefined)) flush();
      raw.push(line);
      for (let [key, value] of pairs) {
        if (
          !value &&
          lines[i + 1]?.trim() &&
          !startsLabel.test(lines[i + 1].trim())
        ) {
          value = lines[++i].trim();
          raw.push(value);
        }
        if (key) fields[key] = value;
      }
    }
    flush();
    return rows;
  }
  function parseRows(text, kind = "order", blocks = null) {
    if (!schemas[kind]) throw new Error("Unknown screenshot type.");
    const vocab = vocabulary(kind);
    const geometric = geometryTables(blocks, vocab, kind);
    if (geometric.length) return geometric;
    const lines = String(text || "")
      .replace(/\r/g, "")
      .replace(/\u00a0/g, " ")
      .split("\n");
    const table = textTables(lines, vocab, kind);
    const remainder = lines.map((line, i) => (table.used.has(i) ? "" : line));
    return [...table.rows, ...detailRows(remainder, vocab, kind)];
  }
  const parseOrderRows = (text, blocks) => parseRows(text, "order", blocks);
  const parseEflowRows = (text, blocks) => parseRows(text, "eflow", blocks);
  function parseOrderText(text) {
    const row =
      parseOrderRows(text)[0] || normalize({}, "order", String(text || ""));
    const keys = [
      "customer",
      "name",
      "product",
      "val310",
      "bsId",
      "status",
      "date",
    ];
    const fields = Object.fromEntries(
      keys.map((key) => [key, row.fields[key]]),
    );
    return {
      fields,
      missing: keys.filter((key) => !fields[key]),
      rawText: String(text || ""),
    };
  }
  return {
    parseRows,
    parseOrderRows,
    parseEflowRows,
    parseOrderText,
    normalizeDate,
    normalizeAmount,
  };
});
