
function byId(id){ return document.getElementById(id); }



function normalizeData(obj){
  // Accept:
  // - Web schema (open/finished/links/kb_texts/kb_tabs/categories/theme)
  // - Python app exports: orders.json (open/finished/links/kb_texts/kb_chart/kb_tabs) + settings.json (theme/categories/default_tasks)
  const out = structuredClone(DEFAULT_DATA);
  const src = (obj && typeof obj === "object") ? obj : {};

  // Orders
  out.open = Array.isArray(src.open) ? src.open : out.open;
  out.finished = Array.isArray(src.finished) ? src.finished : out.finished;

  // Links may live in orders.json
  out.links = Array.isArray(src.links) ? src.links : out.links;

  // KB common texts
  out.kb_texts = Array.isArray(src.kb_texts) ? src.kb_texts : out.kb_texts;

  // KB tabs: prefer kb_tabs; else migrate legacy kb_chart into one tab
  if(Array.isArray(src.kb_tabs) && src.kb_tabs.length){
    out.kb_tabs = src.kb_tabs;
  } else if(Array.isArray(src.kb_chart)){
    out.kb_tabs = [{ name: "General", color: "#3b82f6", rows: src.kb_chart }];
  } else {
    out.kb_tabs = out.kb_tabs;
  }

  // Categories: prefer categories; else migrate from default_tasks (old settings)
  if(Array.isArray(src.categories) && src.categories.length){
    out.categories = src.categories;
  } else if(Array.isArray(src.default_tasks) && src.default_tasks.length){
    out.categories = [{ name: "Default", color: "#3b82f6", tasks: src.default_tasks }];
  } else {
    out.categories = out.categories;
  }

  // Theme
  out.theme = (src.theme === "light" || src.theme === "dark") ? src.theme : out.theme;

  // Normalize orders fields
  const ensureOrder = (o)=>{
    if(!o || typeof o !== "object") return null;
    o.id ??= Date.now();
    o.val23 ??= "";
    o.notes ??= [];
    o.files ??= [];
    // legacy: python uses category; keep
    o.category ??= out.categories?.[0]?.name || "Default";
    // tasks
    if(!Array.isArray(o.tasks) || !o.tasks.length){
      const cat = out.categories.find(c=>c.name===o.category) || out.categories[0];
      const tpl = (cat?.tasks?.length ? cat.tasks : DEFAULT_TASKS);
      o.tasks = tpl.map(t=>({name:t, done:false}));
    } else {
      // ensure task objects
      o.tasks = o.tasks.map(t=> (typeof t === "string") ? ({name:t, done:false}) : ({name:t.name||"", done:!!t.done}));
    }
    // files: allow strings/paths from python; web expects {name,url}
    if(Array.isArray(o.files)){
      o.files = o.files.map((f)=>{
        if(!f) return null;
        if(typeof f === "string") return {name: f.split(/[\\/]/).pop(), url: f};
        if(typeof f === "object") return {name: f.name || "link", url: f.url || f.path || f.link || ""};
        return null;
      }).filter(Boolean);
    }
    return o;
  };

  out.open = (out.open||[]).map(ensureOrder).filter(Boolean);
  out.finished = (out.finished||[]).map(ensureOrder).filter(Boolean);

  // Normalize kb tabs/rows
  if(!Array.isArray(out.kb_tabs) || !out.kb_tabs.length){
    out.kb_tabs = [{ name: "General", color: "#3b82f6", rows: [] }];
  }
  out.kb_tabs = out.kb_tabs.map(t=>{
    const tab = (t && typeof t === "object") ? t : {};
    tab.name = tab.name || "Tab";
    tab.color = tab.color || "#3b82f6";
    tab.rows = Array.isArray(tab.rows) ? tab.rows : [];
    tab.rows = tab.rows.map(r=>{
      if(!r) return null;
      if(typeof r === "string") return {name:"", value:r};
      return {name: r.name || "", value: r.value || ""};
    }).filter(Boolean);
    return tab;
  });

  // Normalize links (python: {name, link})
  out.links = (out.links||[]).map(l=>{
    if(!l) return null;
    if(typeof l === "string") return {name:"Link", link:l};
    return {name: l.name || "Link", link: l.link || l.url || ""};
  }).filter(Boolean);

  return out;
}

window.OT = {
State, DEFAULT_TASKS, DEFAULT_DATA,
initCommon, saveUser, applyTheme, toast, copyToClipboard,
categoryNames, categoryByName, makeOrder, nowTs,
encodeKey, loadFromKeyPreview, restoreFromPreview,
  normalizeData,
el, clear, byId,
};
