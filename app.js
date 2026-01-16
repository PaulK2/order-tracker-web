
/**
 * Order Tracker - Web MVP (vanilla JS)
 * Data model mirrors the Python app (open/finished/links/kb_texts/kb_tabs/categories/theme). 
 * Persistence: localStorage per user.
 */

const DEFAULT_TASKS = [
  "MATERIAL LIST",
  "BUSINESS WEB ORDER",
  "SAP AUFTRAG",
  "SAP VERKNÜPFUNG",
  "CISCO ORDER FINISHED",
  "WARENEINGANG GEBUCHT",
  "SAP EFLOW"
];

const DEFAULT_CATEGORIES = [
  { name: "Default", color: "#3b82f6", tasks: [...DEFAULT_TASKS] }
];

const DEFAULT_DATA = {
  open: [],
  finished: [],
  links: [],
  kb_texts: [],
  kb_tabs: [{ name: "General", color: "#3b82f6", rows: [] }],
  categories: [...DEFAULT_CATEGORIES],
  theme: "dark"
};

const State = {
  user: null,
  preview: false,
  snapshot: null,
  data: structuredClone(DEFAULT_DATA),
};

function nowTs(){
  const d = new Date();
  const pad = (n)=> String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function storageKey(username){ return `ot:${username}`; }
function settingsKey(){ return "ot:settings"; }

function getUsersList(){
  const raw = localStorage.getItem("ot:users");
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function setUsersList(users){
  localStorage.setItem("ot:users", JSON.stringify(users));
}

function setCurrentUser(username){
  State.user = username;
  localStorage.setItem("ot:currentUser", username);
}

function getCurrentUser(){
  return localStorage.getItem("ot:currentUser") || null;
}

function loadUser(username){
  setCurrentUser(username);
  State.preview = false;
  State.snapshot = null;

  const raw = localStorage.getItem(storageKey(username));
  if(raw){
    try { State.data = JSON.parse(raw); }
    catch { State.data = structuredClone(DEFAULT_DATA); }
  } else {
    State.data = structuredClone(DEFAULT_DATA);
    saveUser(); // create initial blob
  }
  applyTheme(State.data.theme || "dark");
  updateTopbar();
}

function saveUser(){
  if(State.preview) return; // disabled in preview mode
  if(!State.user) return;
  localStorage.setItem(storageKey(State.user), JSON.stringify(State.data));
  updateTopbar();
}

function applyTheme(theme){
  document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
}

function toast(msg, kind="ok"){
  const el = document.querySelector("#notice");
  if(!el) return;
  el.textContent = msg;
  el.className = `notice show ${kind}`;
  setTimeout(()=> el.classList.remove("show"), 1800);
}

function copyToClipboard(text){
  if(!text){ toast("Nothing to copy", "bad"); return; }
  navigator.clipboard.writeText(text).then(()=> toast("Copied", "ok")).catch(()=> toast("Copy failed", "bad"));
}

function ensureCategories(){
  if(!Array.isArray(State.data.categories) || !State.data.categories.length){
    State.data.categories = structuredClone(DEFAULT_CATEGORIES);
  }
}

function categoryNames(){
  ensureCategories();
  return State.data.categories.map(c => c.name);
}
function categoryByName(name){
  ensureCategories();
  return State.data.categories.find(c => c.name === name) || State.data.categories[0];
}

function makeOrder({name, val310, val42, category}){
  const cat = categoryByName(category || "Default");
  return {
    id: Date.now(),
    name,
    val310,
    val42,
    val23: "",
    category: cat.name,
    tasks: (cat.tasks || DEFAULT_TASKS).map(t => ({ name: t, done: false })),
    notes: [],
    files: [] // web version uses {name,url}
  };
}

function updateTopbar(){
  const userEl = document.querySelector("[data-user]");
  const openEl = document.querySelector("[data-open]");
  const finEl  = document.querySelector("[data-finished]");
  const banner = document.querySelector("#previewBanner");

  if(userEl) userEl.textContent = State.preview ? "PREVIEW MODE" : (State.user || "No user");
  if(openEl) openEl.textContent = `Open: ${State.data.open?.length || 0}`;
  if(finEl)  finEl.textContent  = `Finished: ${State.data.finished?.length || 0}`;
  if(banner) banner.classList.toggle("show", !!State.preview);
}

function setActiveNav(){
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(a=>{
    const href = a.getAttribute("href");
    a.classList.toggle("active", href === here);
  });
}

function initCommon(){
  setActiveNav();

  // If no current user, push to users page.
  const u = getCurrentUser();
  if(!u && !location.pathname.endsWith("users.html")){
    location.href = "users.html";
    return;
  }
  if(u && !State.user) loadUser(u);

  // Wire "switch user"
  document.querySelectorAll("[data-switch-user]").forEach(btn=>{
    btn.addEventListener("click", ()=> location.href = "users.html");
  });
}

/* ---------- Data Key (share) ---------- */

// ---------- Data Key / Preview Mode (robust) ----------

// Use base64url (safe for copy/paste) + UTF-8 safe encoding.
OT.encodeKey = function (obj) {
  const json = JSON.stringify(obj ?? {});
  const utf8 = new TextEncoder().encode(json);
  let bin = "";
  utf8.forEach(b => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  // base64url
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

OT.decodeKey = function (key) {
  const k = String(key || "").trim();
  if (!k) throw new Error("Empty key");

  // base64url -> base64 + padding
  let b64 = k.replaceAll("-", "+").replaceAll("_", "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);

  const bin = atob(b64);
  const bytes = new Uint8Array([...bin].map(ch => ch.charCodeAt(0)));
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
};

// Where preview state is stored
OT.PREVIEW_STORAGE_KEY = "ot_preview_payload_v1";

// True if currently previewing
OT.isPreview = function () {
  return !!localStorage.getItem(OT.PREVIEW_STORAGE_KEY);
};

// Load preview payload and activate preview mode
OT.loadFromKeyPreview = function (key) {
  const payload = OT.decodeKey(key);

  // Basic shape normalization (prevents crashes)
  payload.open ||= [];
  payload.finished ||= [];
  payload.links ||= [];
  payload.kb_texts ||= [];
  payload.kb_tabs ||= [{ name: "General", color: "#3b82f6", rows: [] }];
  payload.categories ||= [{ name: "Default", color: "#3b82f6", tasks: [...OT.DEFAULT_TASKS] }];
  payload.theme ||= "dark";

  localStorage.setItem(OT.PREVIEW_STORAGE_KEY, JSON.stringify(payload));
  OT.State.data = payload;

  // apply theme + banners + counters
  OT.applyTheme(payload.theme);
  OT.updateTopCounts?.();
  OT.updatePreviewBanner?.(true);
};

// Restore normal data (exit preview)
OT.restoreFromPreview = function () {
  localStorage.removeItem(OT.PREVIEW_STORAGE_KEY);
  // Reload the current user normally (initCommon does it on page load)
};

// Patch OT.initCommon so preview loads automatically if present
const _oldInitCommon = OT.initCommon;
OT.initCommon = function () {
  _oldInitCommon();

  // If preview exists, use it and disable saving
  const p = localStorage.getItem(OT.PREVIEW_STORAGE_KEY);
  if (p) {
    try {
      const payload = JSON.parse(p);
      OT.State.data = payload;
      OT.applyTheme(payload.theme || "dark");
      OT.updateTopCounts?.();
      OT.updatePreviewBanner?.(true);
      OT.toast?.("Preview mode enabled", "ok");
    } catch (e) {
      // if corrupted, drop it
      localStorage.removeItem(OT.PREVIEW_STORAGE_KEY);
    }
  } else {
    OT.updatePreviewBanner?.(false);
  }
};

// Make saveUser a no-op in preview mode (critical!)
const _oldSaveUser = OT.saveUser;
OT.saveUser = function () {
  if (OT.isPreview()) {
    OT.toast?.("Preview mode: saving disabled", "bad");
    return;
  }
  return _oldSaveUser();
};

// Helper to show/hide banner (works with your existing HTML banner)
OT.updatePreviewBanner = function (on) {
  const el = document.getElementById("previewBanner");
  if (!el) return;
  el.style.display = on ? "block" : "none";
};


/* ---------- Page helpers ---------- */

function el(html){
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function clear(node){ while(node.firstChild) node.removeChild(node.firstChild); }

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
