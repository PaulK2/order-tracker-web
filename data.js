/* Pure, backwards-compatible data layer. Existing ot:<username> records stay in place. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CDCData = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const VERSION = 2;
  const PASSPORT = "CDC2026001"; // Requested lightweight signup gate; not server authentication.
  const DEFAULT_TASKS = [
    "MATERIAL LIST",
    "BUSINESS WEB ORDER",
    "SAP AUFTRAG",
    "SAP VERKNÜPFUNG",
    "CISCO ORDER FINISHED",
    "WARENEINGANG GEBUCHT",
    "SAP EFLOW",
  ];
  const PRODUCTS = [
    {
      id: "lan",
      name: "LAN Service",
      icon: "network",
      color: "blue",
      description:
        "Your delivery knowledge, useful links and proven workflows.",
      label: "Network & connectivity",
    },
    {
      id: "standard",
      name: "Standard",
      icon: "layers",
      color: "green",
      description:
        "A dedicated home for standard products and delivery resources.",
      label: "Standard products",
    },
    {
      id: "pabx",
      name: "PABX",
      icon: "phone",
      color: "violet",
      description:
        "Keep telephony knowledge and communication workflows together.",
      label: "Voice & communication",
    },
  ];
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const uid = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const list = (x) => (Array.isArray(x) ? x : []);
  const str = (x) => (x == null ? "" : String(x));
  function productId(value) {
    const v = str(value)
      .toLowerCase()
      .replace(/[\s_-]/g, "");
    return (
      {
        lan: "lan",
        lanservice: "lan",
        standard: "standard",
        pabx: "pabx",
        pbx: "pabx",
      }[v] || ""
    );
  }
  function emptyWorkspace(id = "lan") {
    return {
      links: [],
      kb_texts: [],
      kb_tabs: [{ name: "General", color: "#3974ee", rows: [] }],
      categories: [
        {
          name: "Default",
          color: "#3974ee",
          tasks: id === "lan" ? [...DEFAULT_TASKS] : [],
        },
      ],
    };
  }
  function normalizeWorkspace(source, id = "lan") {
    const s =
      source && typeof source === "object" && !Array.isArray(source)
        ? copy(source)
        : {};
    const empty = emptyWorkspace(id);
    return {
      ...s,
      links: list(s.links)
        .filter(Boolean)
        .map((l) =>
          typeof l === "string"
            ? { name: "Link", link: l }
            : { ...l, name: l.name || "Link", link: l.link || l.url || "" },
        ),
      kb_texts: list(s.kb_texts),
      kb_tabs: (Array.isArray(s.kb_tabs) && s.kb_tabs.length
        ? s.kb_tabs
        : Array.isArray(s.kb_chart)
          ? [{ name: "General", color: "#3974ee", rows: s.kb_chart }]
          : empty.kb_tabs
      )
        .filter(Boolean)
        .map((t) => ({
          ...t,
          name: t.name || "General",
          color: t.color || "#3974ee",
          rows: list(t.rows)
            .filter(Boolean)
            .map((r) =>
              typeof r === "string"
                ? { name: "", value: r }
                : { ...r, name: str(r.name), value: str(r.value) },
            ),
        })),
      categories: (Array.isArray(s.categories) && s.categories.length
        ? s.categories
        : Array.isArray(s.default_tasks)
          ? [{ name: "Default", color: "#3974ee", tasks: s.default_tasks }]
          : empty.categories
      )
        .filter(Boolean)
        .map((c) => ({
          ...c,
          name: c.name || "Default",
          color: c.color || "#3974ee",
          tasks: Array.isArray(c.tasks)
            ? c.tasks
            : [...empty.categories[0].tasks],
        })),
    };
  }
  function extractWorkspace(source) {
    const keys = [
      "links",
      "kb_texts",
      "kb_tabs",
      "kb_chart",
      "categories",
      "default_tasks",
    ];
    return normalizeWorkspace(
      Object.fromEntries(
        keys.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]),
      ),
    );
  }
  function normalizeData(source) {
    if (!source || typeof source !== "object" || Array.isArray(source))
      throw new Error("This file does not contain a user record.");
    const out = {
      ...copy(source),
      ...extractWorkspace(source),
      schemaVersion: VERSION,
    };
    const orders = (arr, finished) =>
      list(arr)
        .filter((o) => o && typeof o === "object")
        .map((old, i) => {
          const o = copy(old);
          const cat =
            out.categories.find((c) => c.name === o.category) ||
            out.categories[0];
          return {
            ...o,
            id: o.id ?? `legacy-${finished ? "finished" : "open"}-${i}`,
            name: str(o.name),
            customer: str(o.customer ?? o.customerName),
            product: productId(o.product ?? o.productType) || "lan",
            val310: str(o.val310),
            val42: str(o.val42),
            val23: str(o.val23),
            bsId: str(o.bsId ?? o.bsID ?? o.bs_id),
            date: str(o.date),
            status: str(o.status || (finished ? "Completed" : "Open")),
            category: o.category || cat?.name || "Default",
            notes: list(o.notes).map((n) =>
              typeof n === "string" ? { text: n, ts: "" } : n,
            ),
            files: list(o.files)
              .filter(Boolean)
              .map((f) =>
                typeof f === "string"
                  ? { name: f.split(/[\\/]/).pop(), url: f }
                  : {
                      ...f,
                      name: f.name || "Attachment",
                      url: f.url || f.path || f.link || "",
                    },
              ),
            tasks: Array.isArray(o.tasks)
              ? o.tasks.map((t) =>
                  typeof t === "string"
                    ? { name: t, done: false }
                    : { ...t, name: str(t.name), done: !!t.done },
                )
              : list(cat?.tasks).map((name) => ({ name, done: false })),
          };
        });
    out.open = orders(source.open, false);
    out.finished = orders(source.finished, true);
    out.personalNotes = list(source.personalNotes);
    out.trash = list(source.trash);
    out.theme = source.theme === "dark" ? "dark" : "light";
    return out;
  }
  function emptyData() {
    return normalizeData({
      ...emptyWorkspace(),
      open: [],
      finished: [],
      theme: "light",
    });
  }
  function validateUsername(name) {
    const value = str(name).trim();
    if (!/^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,39}$/u.test(value))
      throw new Error(
        "Use 2–40 letters, numbers, spaces, dots, dashes or underscores.",
      );
    if (
      ["users", "currentuser", "settings", "previewpayload"].includes(
        value.toLowerCase(),
      )
    )
      throw new Error("Please choose a different username.");
    return value;
  }
  function createStore(storage) {
    const parse = (key, fallback) => {
      const raw = storage.getItem(key);
      if (raw === null) return copy(fallback);
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error(
          `Saved data (${key}) could not be read. It has been left untouched. Export it before making changes.`,
        );
      }
    };
    const write = (key, value) => {
      try {
        storage.setItem(
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        );
      } catch {
        throw new Error(
          "Your browser could not save this change. Free some storage or export a backup; your previous saved record is unchanged.",
        );
      }
    };
    const users = () => {
      const saved = parse("ot:users", []);
      if (!Array.isArray(saved))
        throw new Error(
          "The saved users list is invalid. No data was changed.",
        );
      return saved.filter((x) => typeof x === "string");
    };
    function backup(name, kind = "v1") {
      const raw = storage.getItem(`ot:${name}`);
      const key = `ot:backup:${kind}:${name}`;
      if (raw !== null && storage.getItem(key) === null) write(key, raw);
    }
    function load(name) {
      const raw = storage.getItem(`ot:${name}`);
      if (raw === null)
        throw new Error("This user has no saved record in this browser.");
      const data = parse(`ot:${name}`, {});
      // Back up the exact original bytes before any eventual v2 write.
      if (data.schemaVersion !== VERSION) backup(name);
      return normalizeData(data);
    }
    function save(name, data) {
      write(`ot:${name}`, data);
    }
    function create(name, passport) {
      if (passport !== PASSPORT)
        throw new Error("The registration passport is incorrect.");
      const value = validateUsername(name);
      const all = users();
      if (
        all.some((x) => x.toLowerCase() === value.toLowerCase()) ||
        storage.getItem(`ot:${value}`) !== null
      )
        throw new Error("That user already exists. Select the existing user.");
      const record = emptyData();
      save(value, record);
      try {
        write("ot:users", [...all, value]);
      } catch (e) {
        storage.removeItem(`ot:${value}`);
        throw e;
      }
      return value;
    }
    function current() {
      return storage.getItem("ot:currentUser");
    }
    function select(name) {
      if (storage.getItem(`ot:${name}`) === null)
        throw new Error("User not found.");
      write("ot:currentUser", name);
    }
    function importData(name, source) {
      const normalized = normalizeData(source);
      backup(name, `import-${Date.now()}`);
      save(name, normalized);
      return normalized;
    }
    function workspace(id, published) {
      const local = parse(`ot:workspace:${id}`, null);
      if (local)
        return {
          data: normalizeWorkspace(local.data, id),
          source: local.source || "Local edits",
          local: true,
        };
      if (id === "lan") {
        const pavel = [...users(), current()].find(
          (n) => n && n.toLowerCase() === "pavel",
        );
        if (pavel && storage.getItem(`ot:${pavel}`) !== null) {
          const resources = extractWorkspace(load(pavel));
          // A newly registered Pavel has no legacy resources to override the publication.
          if (JSON.stringify(resources) !== JSON.stringify(emptyWorkspace(id)))
            return { data: resources, source: pavel, local: true };
        }
      }
      return {
        data: normalizeWorkspace(published || {}, id),
        source: "Published resources",
        local: false,
      };
    }
    function saveWorkspace(id, data, source) {
      // One shared browser record, completely separate from personal order records.
      write(`ot:workspace:${id}`, {
        data: normalizeWorkspace(data, id),
        source,
        updatedAt: new Date().toISOString(),
      });
    }
    return {
      users,
      create,
      current,
      select,
      load,
      save,
      backup,
      importData,
      workspace,
      saveWorkspace,
      parse,
      write,
      logout: () => storage.removeItem("ot:currentUser"),
    };
  }
  function hasResources(w) {
    return !!(
      w.links.length ||
      w.kb_texts.length ||
      w.kb_tabs.some((t) => t.rows.length)
    );
  }
  function encodeKey(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let raw = "";
    for (const b of bytes) raw += String.fromCharCode(b);
    return btoa(raw);
  }
  function decodeKey(key) {
    return normalizeData(
      JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(atob(key.trim()), (c) => c.charCodeAt(0)),
        ),
      ),
    );
  }
  function safeUrl(value) {
    try {
      const u = new URL(value);
      return ["https:", "http:", "mailto:", "tel:"].includes(u.protocol)
        ? u.href
        : "";
    } catch {
      return "";
    }
  }
  return {
    VERSION,
    PRODUCTS,
    DEFAULT_TASKS,
    copy,
    uid,
    productId,
    emptyWorkspace,
    normalizeWorkspace,
    extractWorkspace,
    normalizeData,
    emptyData,
    createStore,
    hasResources,
    encodeKey,
    decodeKey,
    safeUrl,
    validateUsername,
  };
});
