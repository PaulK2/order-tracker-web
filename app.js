
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

function encodeKey(obj){
  // Simple base64 of UTF-8 JSON (no compression). Good enough for MVP.
  const json = JSON.stringify(obj);
  const utf8 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_,p)=> String.fromCharCode(parseInt(p,16)));
  return btoa(utf8);
}
function decodeKey(key){
  const bin = atob(key.trim());
  const utf8 = Array.from(bin, c=> `%${c.charCodeAt(0).toString(16).padStart(2,"0").toUpperCase()}`).join("");
  const json = decodeURIComponent(utf8);
  return JSON.parse(json);
}

function loadFromKeyPreview(key){
  let shared;
  try{ shared = decodeKey(key); }
  catch(e){ toast("Invalid key", "bad"); return; }

  if(!State.preview){
    State.snapshot = structuredClone(State.data);
  }
  State.preview = true;

  // Merge shared payload in a controlled way
  State.data.open = shared.open || [];
  State.data.finished = shared.finished || [];
  State.data.links = shared.links || [];
  State.data.kb_texts = shared.kb_texts || [];
  State.data.kb_tabs = shared.kb_tabs || [{name:"General", color:"#3b82f6", rows:[]}];
  State.data.categories = shared.categories || State.data.categories;
  State.data.theme = shared.theme || State.data.theme;

  applyTheme(State.data.theme || "dark");
  updateTopbar();
  toast("Loaded shared data (preview)", "ok");
}

function restoreFromPreview(){
  if(!State.preview || !State.snapshot){
    toast("Already on your data", "warn");
    return;
  }
  State.data = structuredClone(State.snapshot);
  State.snapshot = null;
  State.preview = false;
  applyTheme(State.data.theme || "dark");
  saveUser();
  toast("Restored your data", "ok");
}

/* ---------- Page helpers ---------- */

function el(html){
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function clear(node){ while(node.firstChild) node.removeChild(node.firstChild); }

function byId(id){ return document.getElementById(id); }

window.OT = {
  State, DEFAULT_TASKS, DEFAULT_DATA,
  initCommon, saveUser, applyTheme, toast, copyToClipboard,
  categoryNames, categoryByName, makeOrder, nowTs,
  encodeKey, loadFromKeyPreview, restoreFromPreview,
  el, clear, byId,
};
