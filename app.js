/* CDC Workspace — static GitHub Pages app; user data stays at the original origin. */
(() => {
  "use strict";
  const D = window.CDCData,
    O = window.CDCOCR;
  const $ = (id) => document.getElementById(id);
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const icons = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
    network:
      '<rect x="8" y="3" width="8" height="6" rx="1.5"/><rect x="2" y="16" width="7" height="5" rx="1.3"/><rect x="15" y="16" width="7" height="5" rx="1.3"/><path d="M12 9v4M5.5 16v-3h13v3"/>',
    layers:
      '<path d="m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5"/>',
    phone:
      '<path d="m8 3 3 5-3 2a15 15 0 0 0 6 6l2-3 5 3-1 4c-1 3-7 0-12-5S0 4 4 3h4Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    board: '<path d="M4 4h16v14H4zM8 8h8M8 12h5M9 18l-3 3M15 18l3 3"/>',
    settings:
      '<path d="m9 3-.7 2.4-2.4.6-2 3.4 1.5 1.8v1.6l-1.5 1.8 2 3.4 2.4.6L9 21h6l.7-2.4 2.4-.6 2-3.4-1.5-1.8v-1.6l1.5-1.8-2-3.4-2.4-.6L15 3H9Z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    orders:
      '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    note: '<path d="M5 3h10l4 4v14H5V3Zm10 0v5h4M8 12h8M8 16h6"/>',
    upload: '<path d="M12 16V3m-4 4 4-4 4 4M4 15v5h16v-5"/>',
    download: '<path d="M12 3v13m-4-4 4 4 4-4M4 17v4h16v-4"/>',
    image:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 3-4 6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    edit: '<path d="m15 4 5 5M4 20l1-5L16 4a3 3 0 0 1 4 4L9 19l-5 1Z"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
    link: '<path d="m10 13 4-4M8 15l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0m2 8a3 3 0 0 0 4 0l5-5a3 3 0 0 0-4-4l-2 2"/>',
    book: '<path d="M12 5c-4-3-8-2-10-1v15c3-2 6-2 10 0 4-2 7-2 10 0V4c-2-1-6-2-10 1Zm0 0v14"/>',
    pin: '<path d="m9 3 10 10-3 1-3 5-8-8 5-3-1-5ZM10 14l-7 7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
    moon: '<path d="M20 14A9 9 0 0 1 10 3a9 9 0 1 0 10 11Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01"/>',
    shield:
      '<path d="m12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3Z"/><path d="m8 11 3 3 5-6"/>',
    refresh:
      '<path d="M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3"/>',
  };
  const icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
  const btn = (action, label, ico = "", cls = "", attrs = "") =>
    `<button type="button" class="${cls}" data-action="${action}" ${attrs}>${ico ? icon(ico) : ""}${label}</button>`;
  const field = (name, label, value = "", attrs = "") =>
    `<label class="field" data-field="${name}">${label}<input name="${name}" value="${esc(value)}" ${attrs}></label>`;
  const textarea = (name, label, value = "", attrs = "") =>
    `<label class="field">${label}<textarea name="${name}" ${attrs}>${esc(value)}</textarea></label>`;
  const select = (name, label, options, value = "") =>
    `<label class="field" data-field="${name}">${label}<select name="${name}">${options.map((o) => `<option value="${esc(o.value ?? o)}" ${(o.value ?? o) === value ? "selected" : ""}>${esc(o.label ?? o)}</option>`).join("")}</select></label>`;
  const dateLabel = (date) => {
    if (!date) return "No date";
    const d = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(date) ? date + "T12:00:00" : date,
    );
    return isNaN(d)
      ? String(date)
      : d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  let store,
    user = null,
    data = D.emptyData(),
    preview = false,
    board = [],
    publishedLan = {},
    publicationError = "",
    filter = { q: "", product: "", category: "", sort: "newest" },
    resourceTab = 0,
    toastTimer,
    modalCleanup;
  const workspaceCache = {};
  const modal = $("modal");
  const route = () => (location.hash.slice(1) || "dashboard").split("/");
  function notify(message, error = false) {
    const el = $("notice");
    clearTimeout(toastTimer);
    el.textContent = message;
    el.className = `show${error ? " error" : ""}`;
    toastTimer = setTimeout(() => (el.className = ""), 5000);
  }
  const on = (selector, event, fn, root = document) =>
    root
      .querySelectorAll(selector)
      .forEach((el) => el.addEventListener(event, fn));
  function persist(mutator) {
    if (preview) {
      notify("Preview is read-only. Return to your data to edit.", true);
      return false;
    }
    if (!user) {
      location.hash = "users";
      return false;
    }
    try {
      const next = store.load(user);
      mutator(next);
      store.save(user, next);
      data = next;
      return true;
    } catch (e) {
      notify(e.message, true);
      return false;
    }
  }
  function workspace(id) {
    if (preview && id === "lan")
      return {
        data: D.extractWorkspace(data),
        source: "Shared preview",
        local: false,
      };
    return (
      workspaceCache[id] ||
      (workspaceCache[id] = store.workspace(
        id,
        id === "lan" ? publishedLan : {},
      ))
    );
  }
  function updateWorkspace(id, mutator) {
    if (preview) {
      notify("Preview is read-only.", true);
      return false;
    }
    if (!user) {
      location.hash = "users";
      return false;
    }
    try {
      const next = D.copy(workspace(id).data);
      mutator(next);
      store.saveWorkspace(id, next, user);
      delete workspaceCache[id];
      return true;
    } catch (e) {
      notify(e.message, true);
      return false;
    }
  }
  function productName(id) {
    return D.PRODUCTS.find((p) => p.id === id)?.name || "LAN Service";
  }
  function badge(id) {
    const p = D.PRODUCTS.find((p) => p.id === id) || D.PRODUCTS[0];
    return `<span class="pill ${p.color}">${esc(p.name)}</span>`;
  }
  function statusBadge(s) {
    const color = /complet|finish|abgeschlossen/i.test(s)
      ? "green"
      : /wait|pending|wart/i.test(s)
        ? "amber"
        : "blue";
    return `<span class="pill ${color}">${esc(s || "Open")}</span>`;
  }
  function empty(ico, title, description, action = "") {
    return `<div class="empty-state"><div class="empty-icon">${icon(ico)}</div><h3>${title}</h3><p>${description}</p>${action}</div>`;
  }
  function heading(kicker, title, description, action = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${esc(title)}</h1><p>${description}</p></div>${action}</div>`;
  }
  function personalTabs(active) {
    return `<nav class="tabs" aria-label="User sections">${[
      ["open", "Open orders", data.open.length],
      ["finished", "Finished", data.finished.length],
      ["notes", "Notes", noteCount()],
    ]
      .map(
        ([id, name, count]) =>
          `<a class="tab ${active === id ? "active" : ""}" href="#user/${id}">${name}<span class="badge">${count}</span></a>`,
      )
      .join("")}</nav>`;
  }
  const noteCount = () =>
    data.personalNotes.length +
    [...data.open, ...data.finished].reduce(
      (sum, o) => sum + o.notes.length,
      0,
    );
  function navLink(href, label, ico, active, count) {
    return `<a class="nav-link ${active ? "active" : ""}" href="#${href}" ${active ? 'aria-current="page"' : ""}>${icon(ico)}${label}${count !== undefined ? `<span class="nav-count">${count}</span>` : ""}</a>`;
  }
  function render() {
    const [page, sub, tab] = route();
    document.documentElement.dataset.theme = data.theme;
    const titles = {
      dashboard: "Overview",
      products: productName(sub),
      user: "My workspace",
      settings: "Settings",
      board: "Public Board",
      users: "User profiles",
      info: "About this workspace",
    };
    const title = titles[page] || "Overview";
    document.title = `${title} · CDC Workspace`;
    let body;
    if (["user", "settings"].includes(page) && !user && !preview)
      body = accounts();
    else if (page === "user") body = userView(sub || "open");
    else if (page === "products") body = productView(sub, tab || "overview");
    else if (page === "settings") body = settingsView();
    else if (page === "board") body = boardView();
    else if (page === "users") body = accounts();
    else if (page === "info") body = infoView();
    else body = dashboard();
    $("app").innerHTML =
      `<div class="mobile-shade" data-action="menu-close"></div><aside class="sidebar" aria-label="Main navigation"><a class="brand" href="#dashboard"><span class="brand-mark">${icon("layers")}</span><span><span class="brand-name">CDC<span style="font-weight:500"> Workspace</span></span><span class="brand-sub">Order & delivery hub</span></span></a><div class="nav-label">WORKSPACE</div>${navLink("dashboard", "Dashboard", "grid", page === "dashboard")}${navLink("user/open", "User", "user", page === "user", data.open.length)}${navLink("board", "Public Board", "board", page === "board")}<div class="nav-label">PRODUCT CATEGORIES</div>${D.PRODUCTS.map((p) => navLink(`products/${p.id}`, p.name, p.icon, page === "products" && sub === p.id)).join("")}<div class="sidebar-bottom">${navLink("settings", "Settings", "settings", page === "settings")}${navLink("info", "Help & information", "help", page === "info")}<div class="sidebar-note"><div><span class="save-dot"></span>${preview ? "Read-only preview" : user ? "Saved in this browser" : "Your delivery workspace"}</div><div>CDC Workspace <span class="muted">/ 2.0</span></div></div></div></aside><div class="workspace"><header class="topbar"><div class="row">${btn("menu-open", "", "menu", "ghost icon-button menu-button", 'aria-label="Open navigation"')}<div class="breadcrumb"><span class="muted">Workspace</span><span class="muted">/</span><strong>${esc(title)}</strong></div></div><div class="top-actions">${btn("search", `${icon("search")}<span>Search your orders</span><span class="keycap">/</span>`, "", "top-search", 'aria-label="Search your orders"')}<span class="top-divider"></span>${btn("theme", "", "sun", "ghost icon-button", 'aria-label="Toggle color theme"')}<button type="button" class="profile-button" data-action="profiles"><span class="avatar">${esc((user || "G").slice(0, 2).toUpperCase())}</span><span class="profile-label">${esc(user || "Guest")}<small>${preview ? "Preview mode" : user ? "Customer Delivery" : "Select a user"}</small></span>${icon("down")}</button></div></header><main id="main" class="content" tabindex="-1">${preview ? `<div class="banner"><span><b>Shared-data preview.</b> Your saved data is protected; changes are disabled.</span>${btn("preview-exit", "Back to my data", "", "small")}</div>` : ""}${body}<footer class="dashboard-footer"><span>CDC Workspace <span class="muted">·</span> Built around your delivery day.</span><span class="row">${icon("shield")} ${preview ? "Read-only preview" : user ? "Personal records stay in your browser" : "One place for knowledge and work"}</span></footer></main></div>`;
    bindPage(page, sub, tab);
  }
  function dashboard() {
    const notes = noteCount(),
      waiting = data.open.filter((o) =>
        /wait|pending|wart|hold/i.test(o.status),
      ).length;
    return (
      heading(
        "CUSTOMER DELIVERY / " +
          new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
        user ? `Welcome back, ${user}.` : "Your work, in one place.",
        "A clear view of your orders, product knowledge and team updates.",
        btn("new-order", "New order", "plus", "primary"),
      ) +
      `<div class="stats">${[
        [
          "Open orders",
          data.open.length,
          "orders",
          "blue",
          "Your active workload",
        ],
        [
          "Finished orders",
          data.finished.length,
          "checkCircle",
          "green",
          "Delivered and completed",
        ],
        [
          "Waiting / on hold",
          waiting,
          "clock",
          "amber",
          "Orders needing a follow-up",
        ],
        ["Saved notes", notes, "note", "violet", "Your knowledge, kept close"],
      ]
        .map(
          ([label, value, ico, color, foot], i) =>
            `<a class="stat" href="#user/${i === 1 ? "finished" : i === 3 ? "notes" : "open"}"><div class="stat-top"><span>${label}</span><span class="stat-icon ${color}">${icon(ico)}</span></div><div class="stat-value">${String(value).padStart(2, "0")}</div><div class="stat-foot">${foot}</div></a>`,
        )
        .join(
          "",
        )}</div><section><div class="section-header"><div><h2>Product categories</h2><p>Choose a product to open its workspace.</p></div><span class="eyebrow">YOUR DELIVERY TOOLKIT</span></div><div class="products">${D.PRODUCTS.map(
        (p) => {
          const w = workspace(p.id).data;
          const n =
            w.links.length +
            w.kb_texts.length +
            w.kb_tabs.reduce((s, t) => s + t.rows.length, 0);
          return `<a class="product-card ${p.color}" href="#products/${p.id}"><div class="product-art">${icon(p.icon)}</div><div class="product-symbol">${icon(p.icon)}</div><h3>${p.name}</h3><p>${p.description}</p><div class="product-bottom"><span>${n ? `${n} saved resources` : p.label}</span>${icon("arrow")}</div></a>`;
        },
      ).join(
        "",
      )}</div></section><div class="lower-grid"><section class="panel"><div class="panel-head"><div class="section-header"><h2>Recent open orders</h2><a href="#user/open">View all ${icon("arrow")}</a></div></div>${recentOrders()}</section><section class="panel"><div class="panel-head"><div class="section-header"><h2>Public Board</h2><a href="#board">View board ${icon("arrow")}</a></div></div>${
        board.length
          ? board
              .slice(0, 2)
              .map(
                (p) =>
                  `<div class="board-preview"><span class="badge blue">${p.pinned ? icon("pin") : ""}${esc(p.category || "Team update")}</span><h3>${esc(p.title)}</h3><p>${esc(p.body.length > 170 ? p.body.slice(0, 170) + "…" : p.body)}</p><div class="board-meta"><span>${esc(p.author || "Workspace")}</span><span>${esc(dateLabel(p.date))}</span></div></div>`,
              )
              .join("")
          : empty(
              "board",
              "All caught up",
              publicationError || "Important updates will appear here.",
            )
      }</section></div>`
    );
  }
  function recentOrders() {
    const orders = data.open.slice(-4).reverse();
    if (!orders.length)
      return empty(
        "orders",
        "Ready for your next order",
        user
          ? "Create an order or import a screenshot to get started."
          : "Select your profile to see your orders and personal notes.",
        btn(
          user ? "new-order" : "profiles",
          user ? "Create an order" : "Select a user",
          user ? "plus" : "user",
          "small",
        ),
      );
    return `<div class="table-wrap"><table class="order-table"><thead><tr><th>ORDER / CUSTOMER</th><th>PRODUCT</th><th>STATUS</th></tr></thead><tbody>${orders.map((o) => `<tr class="table-row-link"><td><button class="ghost small" data-action="order-detail" data-id="${esc(o.id)}">${esc(o.name)}</button><div class="secondary">${esc(o.customer || o.val310 || "No customer yet")}</div></td><td>${badge(o.product)}</td><td>${statusBadge(o.status)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function accounts() {
    let users = store.users();
    if (user && !users.includes(user)) users = [...users, user];
    return (
      heading(
        "YOUR WORKSPACE",
        "Choose your profile",
        "Your existing profiles and records stay in this browser.",
      ) +
      `<div class="account-layout"><section class="panel"><div class="panel-body"><h2>Welcome back</h2><p>Open your own orders, finished work and notes.</p><form id="selectUserForm">${select("username", "Saved user", users.length ? users.map((u) => ({ value: u, label: u })) : [{ value: "", label: "No users on this device" }], user || "")}<button class="primary" ${users.length ? "" : "disabled"}>Open workspace ${icon("arrow")}</button></form>${user ? btn("logout", "Continue as guest", "", "ghost small", 'style="margin-top:15px"') : ""}</div></section><section class="panel"><div class="panel-body"><h2>Create a profile</h2><p>Anyone with the registration passport can get started.</p><form id="createUserForm" class="stack">${field("username", "Your name", "", 'required minlength="2" maxlength="40" autocomplete="off" placeholder="e.g. Pavel"')}${field("passport", "Registration passport", "", 'required type="password" autocomplete="off" placeholder="Enter your registration code"')}<div id="signupError" class="dialog-error" role="alert"></div><button class="primary">Create profile ${icon("plus")}</button></form></div></section></div>`
    );
  }
  function userView(tab) {
    if (!["open", "finished", "notes"].includes(tab)) tab = "open";
    const actions =
      tab === "notes"
        ? btn("new-note", "New note", "plus", "primary")
        : btn("import-order", "Import screenshot", "image") +
          " " +
          btn("new-order", "New order", "plus", "primary");
    return (
      heading(
        "PERSONAL WORKSPACE",
        `${user || "Shared"}’s workspace`,
        "Track every product in one place. Your orders and notes stay with you.",
        `<div class="row">${actions}</div>`,
      ) +
      personalTabs(tab) +
      (tab === "notes"
        ? notesView()
        : `<div class="toolbar"><div class="search-field">${icon("search")}<input id="orderSearch" aria-label="Search orders" placeholder="Search customer, order, 310x or BS-ID…" value="${esc(filter.q)}"></div><select id="productFilter" aria-label="Filter by product"><option value="">All products</option>${D.PRODUCTS.map((p) => `<option value="${p.id}" ${filter.product === p.id ? "selected" : ""}>${p.name}</option>`).join("")}</select><select id="categoryFilter" aria-label="Filter by checklist template"><option value="">All templates</option>${[...new Set([...data.open, ...data.finished].map((o) => o.category))].map((c) => `<option value="${esc(c)}" ${filter.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select><select id="orderSort" aria-label="Sort orders">${[
            ["newest", "Newest first"],
            ["name", "Order name A–Z"],
            ["customer", "Customer A–Z"],
            ["date", "Order date"],
            ["val310", "310x number"],
            ["val42", "42x number"],
            ["val23", "23x number"],
          ]
            .map(
              ([v, l]) =>
                `<option value="${v}" ${filter.sort === v ? "selected" : ""}>${l}</option>`,
            )
            .join(
              "",
            )}</select>${tab === "finished" ? btn("clear-finished", "Archive all", "", "small ghost") : ""}</div><div id="orderList" class="order-list">${orderList(tab)}</div>`)
    );
  }
  function orderList(tab) {
    let orders = [...(tab === "finished" ? data.finished : data.open)].filter(
      (o) =>
        (!filter.product || o.product === filter.product) &&
        (!filter.category || o.category === filter.category) &&
        (!filter.q ||
          [
            o.name,
            o.customer,
            o.val310,
            o.bsId,
            o.val42,
            o.val23,
            o.status,
            o.category,
          ].some((v) =>
            String(v).toLowerCase().includes(filter.q.toLowerCase()),
          )),
    );
    if (filter.sort === "newest") orders.reverse();
    else
      orders.sort((a, b) =>
        String(a[filter.sort] || "").localeCompare(
          String(b[filter.sort] || ""),
        ),
      );
    if (!orders.length)
      return `<div class="panel">${empty(tab === "finished" ? "checkCircle" : "orders", filter.q || filter.product || filter.category ? "No matching orders" : tab === "finished" ? "Your finished work will appear here" : "Start your next delivery", filter.q || filter.product || filter.category ? "Try another search or product filter." : tab === "finished" ? "Finish an open order to keep it here, with its checklist and notes." : "Add the details yourself or let a screenshot do the typing.", tab === "open" && !filter.q ? btn("new-order", "Create an order", "plus", "small primary") : "")}</div>`;
    return orders
      .map((o) => {
        const done = o.tasks.filter((t) => t.done).length;
        return `<article class="order-card"><div class="row between"><div><button class="order-title" data-action="order-detail" data-id="${esc(o.id)}">${esc(o.name || "Untitled order")}</button><div class="order-customer">${esc(o.customer || "Customer not specified")}</div></div><div class="row">${badge(o.product)}${statusBadge(o.status)}</div></div><div class="order-meta"><span>310x <b class="mono">${esc(o.val310 || "—")}</b></span><span>BS-ID <b class="mono">${esc(o.bsId || "—")}</b></span>${o.val42 ? `<span>42x <b class="mono">${esc(o.val42)}</b></span>` : ""}${o.val23 ? `<span>23x <b class="mono">${esc(o.val23)}</b></span>` : ""}<span>${icon("clock")} ${esc(dateLabel(o.date))}</span></div>${o.notes.length ? `<div class="last-note"><b>Last note</b> · ${esc(o.notes.at(-1)?.text || "")}</div>` : ""}<div class="order-bottom"><div class="row"><div class="progress"><span style="width:${o.tasks.length ? Math.round((done / o.tasks.length) * 100) : 0}%"></span></div><span>${done}/${o.tasks.length} checklist</span><span>${o.notes.length} notes · ${o.files.length} attachments</span></div><div class="row">${btn("order-detail", "Open", "arrow", "ghost small", `data-id="${esc(o.id)}"`)}${btn(tab === "finished" ? "restore-order" : "finish-order", tab === "finished" ? "Restore" : "Finish", tab === "finished" ? "refresh" : "check", "small", `data-id="${esc(o.id)}"`)}</div></div></article>`;
      })
      .join("");
  }
  function notesView() {
    const orderNotes = [...data.open, ...data.finished].filter(
      (o) => o.notes.length,
    );
    return `<div class="grid two"><section class="panel"><div class="panel-head"><h2>Personal notes</h2></div><div class="panel-body stack">${
      data.personalNotes.length
        ? data.personalNotes
            .slice()
            .reverse()
            .map(
              (n) =>
                `<article class="resource-row"><div><h3>${esc(n.title || "Note")}</h3><p class="pre" style="margin-top:8px">${esc(n.text)}</p><div class="hint" style="margin-top:12px">${esc(dateLabel(n.updatedAt || n.createdAt))}</div></div><div class="actions">${btn("edit-note", "", "edit", "ghost icon-button", `data-id="${esc(n.id)}" aria-label="Edit note"`)}${btn("delete-note", "", "trash", "ghost icon-button danger", `data-id="${esc(n.id)}" aria-label="Archive note"`)}</div></article>`,
            )
            .join("")
        : empty(
            "note",
            "A little space for your thoughts",
            "Save reminders and useful details that are not tied to an order.",
            btn("new-note", "Write a note", "plus", "small"),
          )
    }</div></section><section class="panel"><div class="panel-head"><h2>Order notes</h2><p class="hint">All your order history, including finished work.</p></div><div class="panel-body stack">${orderNotes.length ? orderNotes.map((o) => `<div><div class="row between"><h3>${esc(o.name)}</h3>${btn("order-detail", "Open order", "arrow", "small ghost", `data-id="${esc(o.id)}"`)}</div>${o.notes.map((n) => `<div class="note-entry"><div class="hint">${esc(n.ts || "Saved note")}</div><div class="pre">${esc(n.text)}</div></div>`).join("")}</div>`).join("") : empty("note", "No order notes yet", "Open an order to add its first update.")}</div></section></div>`;
  }
  function productView(id, tab) {
    const p = D.PRODUCTS.find((p) => p.id === id);
    if (!p)
      return heading(
        "PRODUCTS",
        "Product not found",
        "Choose a product from the navigation.",
      );
    const w = workspace(id).data;
    const tabs = [
      ["overview", "Overview"],
      ["knowledge", "Knowledge base"],
      ["links", "Useful links"],
      ["templates", "Checklists"],
    ];
    const source = workspace(id);
    let content = "";
    if (tab === "overview")
      content = `<div class="grid two"><section class="panel"><div class="panel-body stack"><h2>Everything you need for ${p.name}</h2><p class="muted" style="font-size:12px">Keep reusable knowledge, links and delivery checklists together in this product workspace.</p><div class="list-buttons">${[
        [
          "knowledge",
          "Knowledge base",
          "book",
          w.kb_texts.length + w.kb_tabs.reduce((n, t) => n + t.rows.length, 0),
        ],
        ["links", "Useful links", "link", w.links.length],
        ["templates", "Checklist templates", "orders", w.categories.length],
      ]
        .map(
          ([key, name, ico, count]) =>
            `<a class="resource-row" href="#products/${id}/${key}"><span class="row">${icon(ico)}<b>${name}</b></span><span class="row"><span class="count-label">${count} entries</span>${icon("arrow")}</span></a>`,
        )
        .join(
          "",
        )}</div></div></section><section class="panel"><div class="panel-body stack"><span class="badge ${p.color}" style="align-self:flex-start">${p.label}</span><h2>${id === "lan" ? "Your LAN Service workspace" : "Ready to make it your own"}</h2><p class="muted" style="font-size:12px">${id === "lan" ? "Pavel’s existing links, common texts, chart tabs and checklists are retained here when available in this browser. Orders and notes are in the User area." : "Add your product instructions, useful resources and checklist templates as this category grows."}</p><div class="sep"></div><div class="hint">${source.local ? `Resources loaded from ${esc(source.source)} on this device. Use Settings to publish them for other devices.` : "Showing published resources. Local edits can be published from Settings."}</div><a class="text-link" href="#settings">Manage sharing ${icon("arrow")}</a></div></section></div>`;
    else if (tab === "links")
      content = `<div class="section-header"><div><h2>Useful links</h2><p>Shortcuts to the tools and references you use.</p></div>${btn("add-link", "Add link", "plus", "primary small", `data-product="${id}"`)}</div><div class="stack">${
        w.links.length
          ? w.links
              .map((l, i) => {
                const url = D.safeUrl(l.link);
                return `<div class="panel"><div class="resource-row" style="border:0"><div>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><b>${esc(l.name)}</b> ${icon("arrow")}</a>` : `<b>${esc(l.name)}</b>`}<div class="hint pre">${esc(l.link)}</div></div><div class="actions">${btn("copy-link", "", "copy", "ghost icon-button", `data-index="${i}" data-product="${id}" aria-label="Copy link"`)}${btn("edit-link", "", "edit", "ghost icon-button", `data-index="${i}" data-product="${id}" aria-label="Edit link"`)}${btn("remove-resource", "", "trash", "ghost icon-button danger", `data-kind="links" data-index="${i}" data-product="${id}" aria-label="Remove link"`)}</div></div></div>`;
              })
              .join("")
          : `<div class="panel">${empty("link", "Your shortcuts belong here", "Add a link to a portal, document or reference.", btn("add-link", "Add your first link", "plus", "small", `data-product="${id}"`))}</div>`
      }</div>`;
    else if (tab === "knowledge") {
      resourceTab = Math.min(resourceTab, Math.max(w.kb_tabs.length - 1, 0));
      const t = w.kb_tabs[resourceTab];
      content = `<div class="grid two"><section class="panel"><div class="panel-head"><div class="section-header"><h2>Common texts</h2>${btn("add-text", "Add text", "plus", "small", `data-product="${id}"`)}</div></div><div class="panel-body stack">${w.kb_texts.length ? w.kb_texts.map((text, i) => `<div class="resource-row"><div class="pre">${esc(typeof text === "string" ? text : JSON.stringify(text))}</div><div class="actions">${btn("copy-text", "", "copy", "ghost icon-button", `data-index="${i}" data-product="${id}" aria-label="Copy text"`)}${btn("edit-text", "", "edit", "ghost icon-button", `data-index="${i}" data-product="${id}" aria-label="Edit text"`)}${btn("remove-resource", "", "trash", "ghost icon-button danger", `data-kind="kb_texts" data-index="${i}" data-product="${id}" aria-label="Remove text"`)}</div></div>`).join("") : empty("book", "Reusable words, close at hand", "Save the messages and instructions you use often.")}</div></section><section class="panel"><div class="panel-head"><div class="section-header"><h2>Reference charts</h2>${btn("add-tab", "Add tab", "plus", "small", `data-product="${id}"`)}</div></div><div class="panel-body stack"><div class="row between"><select id="resourceTab" aria-label="Reference chart tab">${w.kb_tabs.map((t, i) => `<option value="${i}" ${i === resourceTab ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select><div class="row">${btn("edit-tab", "", "edit", "ghost icon-button", `data-product="${id}" aria-label="Edit chart tab"`)}${btn("remove-tab", "", "trash", "ghost icon-button danger", `data-product="${id}" aria-label="Remove chart tab"`)}</div></div>${t ? `<div style="height:4px;background:${safeColor(t.color)};border-radius:4px"></div>${t.rows.map((r, i) => `<div class="resource-row"><div><b class="row-name">${esc(r.name)}</b><p class="row-value pre">${esc(r.value)}</p></div><div class="actions">${btn("copy-row", "", "copy", "ghost icon-button", `data-index="${i}" data-product="${id}" aria-label="Copy value"`)}${btn("edit-row", "", "edit", "ghost icon-button", `data-index="${i}" data-product="${id}" aria-label="Edit row"`)}${btn("move-row", "↑", "", "ghost small", `data-index="${i}" data-direction="-1" data-product="${id}" aria-label="Move row up"`)}${btn("move-row", "↓", "", "ghost small", `data-index="${i}" data-direction="1" data-product="${id}" aria-label="Move row down"`)}${btn("remove-row", "", "trash", "ghost icon-button danger", `data-index="${i}" data-product="${id}" aria-label="Remove row"`)}</div></div>`).join("")}${!t.rows.length ? '<p class="hint">This chart has no rows yet.</p>' : ""}${btn("add-row", "Add row", "plus", "small", `data-product="${id}"`)}` : ""}</div></section></div>`;
    } else if (tab === "templates")
      content = `<div class="section-header"><div><h2>Checklist templates</h2><p>Used for new ${p.name} orders. Existing order checklists keep their progress.</p></div>${btn("add-template", "New template", "plus", "primary small", `data-product="${id}"`)}</div><div class="stack">${w.categories.map((c, i) => `<section class="panel"><div class="panel-body"><div class="row between"><div><h3>${esc(c.name)}</h3><span class="hint">${c.tasks.length} checklist items</span></div><div class="row">${btn("edit-template", "Edit", "edit", "small", `data-index="${i}" data-product="${id}"`)}${btn("remove-resource", "", "trash", "ghost icon-button danger", `data-kind="categories" data-index="${i}" data-product="${id}" aria-label="Remove template"`)}</div></div><div class="stack" style="gap:8px;margin-top:16px">${c.tasks.map((t) => `<div class="task-row">${icon("check")}<span>${esc(t)}</span></div>`).join("") || '<p class="hint">No tasks yet. Edit this template to add them.</p>'}</div></div></section>`).join("")}</div>`;
    return `<div class="workspace-hero"><div class="product-symbol">${icon(p.icon)}</div><div><div class="eyebrow">PRODUCT WORKSPACE</div><h1>${p.name}</h1><p>${p.label}</p></div></div><nav class="tabs" aria-label="Product resources">${tabs.map(([key, name]) => `<a class="tab ${tab === key ? "active" : ""}" href="#products/${id}/${key}">${name}</a>`).join("")}</nav>${content}`;
  }
  const safeColor = (color) =>
    /^#[\da-f]{6}$/i.test(color) ? color : "#3974ee";
  function settingsView() {
    return (
      heading(
        "WORKSPACE PREFERENCES",
        "Make yourself at home",
        "Appearance, backups and shared resources.",
      ) +
      `<div class="grid two"><div class="stack"><section class="panel"><div class="panel-body settings-section"><div class="row between"><div><h2>Appearance</h2><p>Choose the workspace theme that suits you.</p></div><div class="theme-options">${btn("set-theme", "Light", "sun", data.theme === "light" ? "selected" : "", 'data-theme="light"')}${btn("set-theme", "Dark", "moon", data.theme === "dark" ? "selected" : "", 'data-theme="dark"')}</div></div></div></section><section class="panel"><div class="panel-body stack"><div><h2>Your data & backups</h2><p class="hint">Records stay in this browser. Export a backup to keep a copy or move to another device.</p></div><div class="row">${btn("export", "Export my data", "download", "primary small")}${btn("import-data", "Import JSON", "upload", "small")}${btn("export-original", "Original backup", "shield", "small")}${btn("saved-backups", "Saved backups", "clock", "small")}</div><div class="sep"></div><h3>Share a preview</h3><p class="hint">Share your data as a key. Preview mode is read-only and never replaces saved records.</p><div class="row">${btn("share-key", "Create share key", "copy", "small")}${btn("load-preview", "Load a preview", "upload", "small")}</div></div></section><section class="panel"><div class="panel-body stack"><div><h2>Archive</h2><p class="hint">Removed orders and notes remain recoverable here.</p></div>${data.trash.length ? data.trash.map((item, i) => `<div class="resource-row"><div><b class="small">${esc(item.record.name || item.record.title || "Note")}</b><p class="hint">${esc(item.kind)} · ${esc(dateLabel(item.removedAt))}</p></div>${btn("unarchive", "Restore", "refresh", "small", `data-index="${i}"`)}</div>`).join("") : '<p class="hint">Your archive is empty.</p>'}</div></section></div><div class="stack"><section class="panel"><div class="panel-body stack"><div><h2>Publish product resources</h2><p class="hint">Local resource edits are shared by profiles on this device. Publish a reviewed copy to make them available to everyone.</p></div><div class="row">${btn("publish-lan", "Publish LAN Service", "upload", "small primary")}${btn("legacy-resources", "My original resources", "book", "small")}</div><p class="hint">Publishing uses the repository’s normal GitHub editor and commit process. Order records and personal notes are excluded.</p></div></section><section class="panel"><div class="panel-body stack"><h2>Profile</h2><div class="row"><span class="avatar">${esc((user || "G").slice(0, 2).toUpperCase())}</span><div><b>${esc(user || "Guest")}</b><p class="hint">Customer Delivery</p></div></div><div class="row">${btn("profiles", "Switch user", "user", "small")}${btn("logout", "Sign out", "", "ghost small")}</div></div></section><section class="panel"><div class="panel-body stack"><h2>Adding more products</h2><p class="hint">LAN Service, Standard and PABX are ready to use. More product workspaces can be added as your delivery toolkit grows.</p><a class="text-link" href="#board">Visit the Public Board ${icon("arrow")}</a></div></section></div></div>`
    );
  }
  function boardView() {
    const drafts = store.parse("ot:boardDrafts", []);
    return (
      heading(
        "SHARED WITH EVERYONE",
        "Public Board",
        "Important information and updates for the whole team.",
        btn("new-post", "Write an update", "plus", "primary"),
      ) +
      `<div class="board-grid"><div class="stack">${publicationError ? `<div class="banner warning">${esc(publicationError)} ${btn("reload-public", "Retry", "", "small")}</div>` : ""}${board.length ? board.map((p) => `<article class="panel board-post"><div class="row between"><span class="badge blue">${esc(p.category || "Team update")}</span>${p.pinned ? `<span class="hint">${icon("pin")} Pinned update</span>` : ""}</div><h2>${esc(p.title)}</h2><p class="pre">${esc(p.body)}</p><div class="post-footer row between"><span>${esc(p.author || "Workspace")}</span><span>${esc(dateLabel(p.date))}</span></div></article>`).join("") : `<div class="panel">${empty("board", "A shared place to stay informed", "Published team announcements will appear here for everyone.")}</div>`}${drafts.length ? `<section class="panel"><div class="panel-body stack"><h2>Drafts on this device</h2><p class="hint">These are not public yet. Publish them through GitHub to share with all users.</p>${drafts.map((p, i) => `<div class="board-draft"><div class="row between"><h3>${esc(p.title)}</h3>${btn("delete-draft", "", "trash", "ghost icon-button danger", `data-index="${i}" aria-label="Delete draft"`)}</div><p class="pre">${esc(p.body)}</p></div>`).join("")}${btn("publish-board", "Prepare publication", "upload", "primary small")}</div></section>` : ""}</div><aside class="board-aside"><section class="panel"><div class="panel-body stack"><span class="stat-icon blue">${icon("board")}</span><h2>One board. Everyone informed.</h2><p class="hint">Published updates are the same for every visitor, across profiles and devices.</p><div class="sep"></div><p class="hint">Write a draft here, then publish the prepared update with your GitHub repository access. No GitHub password or token is stored in this app.</p><a class="text-link" href="https://github.com/PaulK2/order-tracker-web/blob/main/data/public-board.json" target="_blank" rel="noopener noreferrer">View published source ${icon("arrow")}</a></div></section></aside></div>`
    );
  }
  function infoView() {
    return (
      heading(
        "HELP & INFORMATION",
        "A workspace that keeps things together",
        "Product knowledge for the team. Order tracking for you.",
      ) +
      `<div class="grid two"><section class="panel"><div class="panel-body stack"><h2>What lives where?</h2><p><b>Product categories</b> hold links, common texts, reference charts and checklist templates.</p><p><b>User</b> holds your open and finished orders, attachments and notes across all products.</p><p><b>Public Board</b> shows published announcements to every visitor.</p><p><b>Settings</b> includes themes, backups, shared previews and resource publication.</p></div></section><section class="panel"><div class="panel-body stack"><h2>Your existing data</h2><p class="hint">This site retains its original browser storage keys. Pavel’s old data is read automatically in the browser where it was saved. A raw backup is retained before the updated record is saved.</p><p class="hint">If data seems missing, open the same website address and browser you used before. Different browsers and website addresses have separate storage. Export JSON from the original browser to move records.</p><h3>Screenshot import</h3><p class="hint">PNG, JPEG, WebP and BMP images up to 12 MB are read on your device. English and German labels are supported. Review all detected fields before saving; unrecognized fields stay empty.</p><h3>Profiles and publishing</h3><p class="hint">Profiles are local to this device. The registration passport is a lightweight browser-side gate, not a secure account system. Publishing shared content requires repository access on GitHub.</p><a class="text-link" href="https://github.com/PaulK2/order-tracker-web" target="_blank" rel="noopener noreferrer">View project ${icon("arrow")}</a></div></section></div>`
    );
  }
  function closeModal() {
    if (modal.open) modal.close();
  }
  function showModal(
    title,
    description,
    body,
    footer = "",
    submit = null,
    wide = false,
  ) {
    modalCleanup?.();
    modalCleanup = null;
    modal.className = wide ? "wide" : "";
    modal.innerHTML = `${submit ? '<form id="modalForm">' : ""}<div class="dialog-head"><div><h2 id="modalTitle">${esc(title)}</h2><p>${description}</p></div>${btn("close-modal", "", "close", "ghost icon-button", 'aria-label="Close dialog"')}</div><div class="dialog-body">${body}<div id="modalError" class="dialog-error" role="alert"></div></div>${footer ? `<div class="dialog-footer">${footer}</div>` : ""}${submit ? "</form>" : ""}`;
    modal.onsubmit = async (e) => {
      if (e.target.id !== "modalForm") return;
      e.preventDefault();
      const submitButton = e.submitter;
      try {
        if (submitButton) submitButton.disabled = true;
        await submit(new FormData(e.target), e.target);
      } catch (error) {
        $("modalError").textContent = error.message;
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    };
    if (!modal.open) modal.showModal();
  }
  modal.addEventListener("close", () => {
    modalCleanup?.();
    modalCleanup = null;
  });
  function confirmAction(title, description, action, label = "Continue") {
    showModal(
      title,
      esc(description),
      "",
      btn("close-modal", "Cancel") +
        `<button class="primary">${esc(label)}</button>`,
      async () => {
        if ((await action()) !== false) closeModal();
      },
    );
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(String(text));
      notify("Copied to clipboard.");
      return true;
    } catch {
      notify("Clipboard unavailable. Select and copy the text manually.", true);
      return false;
    }
  }
  function download(name, content, type = "application/json") {
    const blob =
      content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  let dbPromise;
  function attachmentDB() {
    if (!dbPromise)
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open("ot-attachments", 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("images", { keyPath: "id" });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          dbPromise = null;
          reject(new Error("Images could not be stored in this browser."));
        };
      });
    return dbPromise;
  }
  async function putImage(blob, name, id = D.uid()) {
    const db = await attachmentDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      tx.objectStore("images").put({ id, name, blob });
      tx.oncomplete = resolve;
      tx.onerror = () =>
        reject(
          new Error(
            "Could not save the screenshot. Export a backup and free browser storage.",
          ),
        );
    });
    return { attachmentId: id, name, url: "", type: blob.type };
  }
  async function getImage(id) {
    const db = await attachmentDB();
    return new Promise((resolve, reject) => {
      const r = db.transaction("images").objectStore("images").get(id);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(new Error("Could not read the saved image."));
    });
  }
  function findOrder(id) {
    return [...data.open, ...data.finished].find(
      (o) => String(o.id) === String(id),
    );
  }
  function requireProfile() {
    if (preview) {
      notify("Preview is read-only. Return to your data to edit.", true);
      return false;
    }
    if (!user) {
      location.hash = "users";
      return false;
    }
    return true;
  }
  function orderForm(id = "", scan = false) {
    if (!requireProfile()) return;
    const existing = id ? findOrder(id) : null;
    const order = existing || {
      name: "",
      customer: "",
      product: scan ? "" : "lan",
      val310: "",
      bsId: "",
      val42: "",
      val23: "",
      status: scan ? "" : "Open",
      date: scan ? "" : today(),
      category: "Default",
    };
    const categories = workspace(order.product || "lan").data.categories;
    let screenshot = null,
      reading = false,
      controller,
      selectedPreview;
    showModal(
      existing
        ? "Edit order"
        : scan
          ? "Import an order screenshot"
          : "Create an order",
      scan
        ? "Read the screenshot, review the details, then save to your workspace."
        : "Keep the customer, product and delivery details together.",
      `${!existing ? `<div class="dropzone" id="dropzone"><div>${icon("image")}</div><h3>Let a screenshot do the typing</h3><p>Drop an image here, paste it, or choose a file. PNG, JPG, WebP · up to 12 MB</p><label class="button small" for="screenshotFile">${icon("upload")} Choose screenshot</label><input id="screenshotFile" type="file" accept="image/png,image/jpeg,image/webp,image/bmp"><div id="scanStatus" aria-live="polite"></div></div><div style="height:22px"></div>` : ""}<div id="importSummary" class="import-summary" role="status"></div><div class="form-grid">${field("customer", "Customer name", order.customer, existing ? "" : "required")}${field("name", "Order name", order.name, "required")}${select("product", "Product type", [{ value: "", label: "Choose a product" }, ...D.PRODUCTS.map((p) => ({ value: p.id, label: p.name }))], order.product)}${field("val310", "310x number", order.val310, 'inputmode="numeric"')}${field("bsId", "BS-ID", order.bsId)}${field("status", "Status", order.status, 'list="orderStatuses"')}<datalist id="orderStatuses"><option>Open</option><option>In progress</option><option>Waiting</option><option>On hold</option><option>Ready for delivery</option></datalist>${field("date", "Order date", order.date, 'type="date"')}${select(
        "category",
        "Checklist template",
        categories.map((c) => c.name),
        order.category,
      )}<div class="section-label">Additional references</div>${field("val42", "42x number", order.val42)}${field("val23", "23x number", order.val23)}</div><div id="ocrReview" hidden style="margin-top:20px"><label class="row small"><input type="checkbox" name="reviewed"> I have reviewed and corrected the detected details.</label><details style="margin-top:16px"><summary>Recognized text</summary><textarea id="ocrText" aria-label="Recognized screenshot text" readonly></textarea></details></div>`,
      btn("close-modal", "Cancel") +
        `<button class="primary" id="saveOrder">${icon("check")} ${existing ? "Save changes" : "Create order"}</button>`,
      async (values) => {
        if (reading)
          throw new Error("Wait for the screenshot to finish reading.");
        if (!D.PRODUCTS.some((p) => p.id === values.get("product")))
          throw new Error("Select the product for this order.");
        const draft = Object.fromEntries(
          [
            "name",
            "customer",
            "product",
            "val310",
            "bsId",
            "status",
            "date",
            "category",
            "val42",
            "val23",
          ].map((k) => [k, String(values.get(k) || "").trim()]),
        );
        if (!draft.name) throw new Error("Enter an order name.");
        if (screenshot && !values.get("reviewed"))
          throw new Error("Review the detected fields before saving.");
        if (draft.val310 && !/^310\d+$/.test(draft.val310))
          throw new Error(
            "The 310x number must start with 310 and contain only digits.",
          );
        if (
          !existing &&
          draft.val310 &&
          data.open.some(
            (o) => o.val310 === draft.val310 && o.product === draft.product,
          )
        )
          throw new Error(
            "An open order already uses this 310x number for this product.",
          );
        const attachment = screenshot
          ? await putImage(screenshot, screenshot.name)
          : null;
        const saved = persist((next) => {
          if (existing) {
            const record = [...next.open, ...next.finished].find(
              (o) => String(o.id) === String(existing.id),
            );
            if (!record)
              throw new Error(
                "This order changed in another tab. Reopen it before editing.",
              );
            Object.assign(record, draft);
          } else {
            const cat = workspace(draft.product).data.categories.find(
              (c) => c.name === draft.category,
            );
            next.open.push({
              ...draft,
              id: D.uid(),
              createdAt: new Date().toISOString(),
              status: draft.status || "Open",
              tasks: (cat?.tasks || []).map((name) => ({ name, done: false })),
              notes: [],
              files: attachment ? [attachment] : [],
            });
          }
        });
        if (saved) {
          closeModal();
          location.hash = "user/open";
          render();
          notify(existing ? "Order updated." : "Order created.");
        }
      },
      true,
    );
    const form = $("modalForm");
    form.elements.product.required = true;
    form.elements.product.addEventListener("change", () => {
      const options = workspace(form.elements.product.value || "lan").data
        .categories;
      form.elements.category.innerHTML = options
        .map((c) => `<option>${esc(c.name)}</option>`)
        .join("");
    });
    if (existing) return;
    async function read(file) {
      if (reading) return;
      reading = true;
      screenshot = null;
      controller = new AbortController();
      $("saveOrder").disabled = true;
      try {
        const result = await O.recognize(
          file,
          (message, progress) => {
            if (controller.signal.aborted || !$("scanStatus")) return;
            $("scanStatus").innerHTML =
              `<div class="scan-status">${esc(message)} <b>${Math.round(progress * 100)}%</b><div class="scan-progress"><span style="width:${Math.round(progress * 100)}%"></span></div></div>`;
          },
          controller.signal,
        );
        if (!modal.open || controller.signal.aborted) return;
        screenshot = file;
        for (const [key, value] of Object.entries(result.fields)) {
          if (form.elements[key]) form.elements[key].value = value;
          const label = form.querySelector(`[data-field="${key}"]`);
          label?.classList.toggle("missing-field", !value);
        }
        form.elements.product.dispatchEvent(new Event("change"));
        form.elements.reviewed.checked = false;
        form.elements.reviewed.required = true;
        $("ocrText").value = result.rawText;
        $("ocrReview").hidden = false;
        $("importSummary").textContent =
          `${7 - result.missing.length} of 7 fields detected. ${result.missing.length ? "Highlighted fields need your input. " : " "}Please verify every field before saving.`;
        $("scanStatus").innerHTML =
          `<div class="scan-status success-text">${icon("checkCircle")} Screenshot read. Review the details below.</div>`;
      } catch (e) {
        if (controller.signal.aborted) return;
        $("scanStatus").innerHTML =
          `<div class="scan-status">${esc(e.message)} You can still enter the details manually.</div>`;
        $("ocrReview").hidden = true;
        form.elements.reviewed.required = false;
      } finally {
        reading = false;
        if ($("saveOrder")) $("saveOrder").disabled = false;
      }
    }
    $("screenshotFile").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) read(file);
    });
    const zone = $("dropzone");
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drag");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag");
      if (e.dataTransfer.files[0]) read(e.dataTransfer.files[0]);
    });
    const paste = (e) => {
      const image = [...(e.clipboardData?.items || [])].find((i) =>
        i.type.startsWith("image/"),
      );
      if (image) {
        e.preventDefault();
        read(image.getAsFile());
      }
    };
    modal.addEventListener("paste", paste);
    modalCleanup = () => {
      controller?.abort();
      modal.removeEventListener("paste", paste);
      if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    };
  }
  function orderDetail(id) {
    const o = findOrder(id);
    if (!o) return notify("Order not found.", true);
    const finished = data.finished.includes(o);
    showModal(
      o.name || "Order details",
      `${esc(o.customer || "Customer not specified")} · ${esc(productName(o.product))}`,
      `<div class="row between" style="margin-bottom:20px">${statusBadge(o.status)}<div class="row">${btn("edit-order", "Edit details", "edit", "small", `data-id="${esc(o.id)}"`)}${btn(finished ? "restore-order" : "finish-order", finished ? "Restore order" : "Finish order", finished ? "refresh" : "check", "primary small", `data-id="${esc(o.id)}"`)}</div></div><div class="form-grid">${[
        ["310x number", o.val310],
        ["BS-ID", o.bsId],
        ["42x number", o.val42],
        ["23x number", o.val23],
      ]
        .map(
          ([label, value]) =>
            `<div><div class="eyebrow">${label}</div><div class="row" style="margin-top:6px"><b class="mono">${esc(value || "—")}</b>${value ? btn("copy-reference", "", "copy", "ghost icon-button", `data-value="${esc(value)}" aria-label="Copy ${label}"`) : ""}</div></div>`,
        )
        .join(
          "",
        )}<div><div class="eyebrow">Order date</div><p class="small">${esc(dateLabel(o.date))}</p></div><div><div class="eyebrow">Template</div><p class="small">${esc(o.category)}</p></div></div><div class="sep" style="margin:22px 0"></div><div class="grid two"><div class="stack"><div class="row between"><h3>Checklist</h3>${!finished ? `<div class="row">${btn("apply-template", "Apply template", "", "ghost small", `data-id="${esc(o.id)}"`)}${btn("reset-checklist", "Reset", "", "ghost small", `data-id="${esc(o.id)}"`)}</div>` : ""}</div><div class="stack" style="gap:8px">${o.tasks.map((t, i) => `<label class="task-row ${t.done ? "done" : ""}"><input type="checkbox" data-check="${i}" ${t.done ? "checked" : ""} ${finished || preview ? "disabled" : ""}><span>${esc(t.name)}</span></label>`).join("") || '<p class="hint">This order has no checklist items.</p>'}</div><div class="row between"><h3>Attachments</h3>${btn("add-attachment", "Add link", "plus", "small", `data-id="${esc(o.id)}"`)}</div>${
        o.files
          .map((f, i) => {
            const url = D.safeUrl(f.url);
            return `<div class="resource-row"><div>${f.attachmentId ? btn("view-image", esc(f.name), "image", "ghost small", `data-id="${esc(o.id)}" data-index="${i}"`) : url ? `<a class="small" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(f.name)} ${icon("arrow")}</a>` : `<span class="small">${esc(f.name)}</span><div class="hint pre">${esc(f.url || "Image unavailable")}</div>`}</div>${btn("remove-attachment", "", "trash", "ghost small danger", `data-id="${esc(o.id)}" data-index="${i}" aria-label="Remove attachment"`)}</div>`;
          })
          .join("") || '<p class="hint">No attachments yet.</p>'
      }</div><div><div class="row between"><h3>Notes & history</h3>${o.notes.length ? btn("copy-reference", "Copy last", "", "ghost small", `data-value="${esc(o.notes.at(-1)?.text || "")}"`) : ""}</div><form id="orderNoteForm" class="stack" style="margin:14px 0">${textarea("text", "Add a note", "", 'required placeholder="What happened with this order?"')}<button class="primary small" ${preview ? "disabled" : ""}>Save note</button></form>${
        o.notes
          .slice()
          .reverse()
          .map(
            (n) =>
              `<div class="note-entry"><div class="hint">${esc(n.ts || "Saved note")}</div><p class="pre">${esc(n.text)}</p></div>`,
          )
          .join("") || '<p class="hint">No updates yet.</p>'
      }</div></div>`,
      btn(
        "archive-order",
        "Archive order",
        "trash",
        "danger ghost small",
        `data-id="${esc(o.id)}"`,
      ) + btn("close-modal", "Done"),
      null,
      true,
    );
    on(
      "[data-check]",
      "change",
      (e) => {
        const index = Number(e.target.dataset.check),
          value = e.target.checked;
        if (
          persist((next) => {
            const target = next.open.find((x) => String(x.id) === String(id));
            if (!target) throw new Error("Order is no longer open.");
            target.tasks[index].done = value;
          })
        ) {
          e.target.closest("label").classList.toggle("done", value);
          render();
        } else e.target.checked = !value;
      },
      modal,
    );
    $("orderNoteForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = new FormData(e.target).get("text").trim();
      if (!text) return;
      if (
        persist((next) => {
          const target = [...next.open, ...next.finished].find(
            (x) => String(x.id) === String(id),
          );
          if (!target) throw new Error("Order not found.");
          target.notes.push({ text, ts: new Date().toLocaleString("sv-SE") });
        })
      ) {
        orderDetail(id);
        render();
        notify("Order note saved.");
      }
    });
  }
  function noteForm(id) {
    if (!requireProfile()) return;
    const n = data.personalNotes.find((n) => n.id === id) || {};
    showModal(
      id ? "Edit note" : "A note for yourself",
      "Keep the details you want to come back to.",
      `<div class="stack">${field("title", "Title", n.title || "", 'required maxlength="120"')}${textarea("text", "Note", n.text || "", "required")}</div>`,
      btn("close-modal", "Cancel") +
        '<button class="primary">Save note</button>',
      (values) => {
        const text = values.get("text").trim(),
          title = values.get("title").trim();
        if (!text || !title) throw Error("Add a title and note.");
        if (
          persist((next) => {
            if (id) {
              const note = next.personalNotes.find((n) => n.id === id);
              if (!note) throw Error("Note not found.");
              Object.assign(note, {
                title,
                text,
                updatedAt: new Date().toISOString(),
              });
            } else
              next.personalNotes.push({
                id: D.uid(),
                title,
                text,
                createdAt: new Date().toISOString(),
              });
          })
        ) {
          closeModal();
          render();
          notify("Note saved.");
        }
      },
    );
  }
  function resourceForm(kind, id, index = -1) {
    if (!requireProfile()) return;
    const w = workspace(id).data;
    let title, body;
    if (kind === "link") {
      const l = w.links[index] || {};
      title = index < 0 ? "Add a useful link" : "Edit link";
      body =
        field("name", "Link name", l.name || "", "required") +
        field("link", "URL", l.link || "", 'required placeholder="https://…"');
    }
    if (kind === "text") {
      title = index < 0 ? "Add common text" : "Edit common text";
      body = textarea(
        "text",
        "Reusable text",
        w.kb_texts[index] || "",
        "required",
      );
    }
    if (kind === "tab") {
      const t = index < 0 ? {} : w.kb_tabs[index];
      title = index < 0 ? "Add reference tab" : "Edit reference tab";
      body =
        field("name", "Tab name", t.name || "", "required") +
        field("color", "Tab color", safeColor(t.color), 'type="color"');
    }
    if (kind === "row") {
      const r = w.kb_tabs[resourceTab]?.rows[index] || {};
      title = index < 0 ? "Add reference row" : "Edit reference row";
      body =
        field("name", "Name", r.name || "", "required") +
        textarea("value", "Value", r.value || "", "required");
    }
    if (kind === "template") {
      const c = w.categories[index] || {};
      title =
        index < 0 ? "Create checklist template" : "Edit checklist template";
      body =
        field("name", "Template name", c.name || "", "required") +
        field("color", "Template color", safeColor(c.color), 'type="color"') +
        textarea(
          "tasks",
          "Checklist items — one per line",
          (c.tasks || []).join("\n"),
          'style="min-height:210px"',
        ) +
        '<p class="hint">Move lines up or down to reorder tasks. Existing order checklists and completed tasks will stay unchanged.</p>';
    }
    showModal(
      title,
      esc(productName(id)),
      `<div class="stack">${body}</div>`,
      btn("close-modal", "Cancel") +
        '<button class="primary">Save changes</button>',
      (values) => {
        if (kind === "link" && !D.safeUrl(values.get("link")))
          throw Error("Use an http, https, mailto or tel link.");
        if (
          kind === "template" &&
          w.categories.some(
            (c, i) =>
              i !== index &&
              c.name.toLowerCase() === values.get("name").trim().toLowerCase(),
          )
        )
          throw Error("A template with that name already exists.");
        const saved = updateWorkspace(id, (next) => {
          if (kind === "link") {
            const value = {
              ...(next.links[index] || {}),
              name: values.get("name").trim(),
              link: values.get("link").trim(),
            };
            index < 0 ? next.links.push(value) : (next.links[index] = value);
          }
          if (kind === "text") {
            const value = values.get("text").trim();
            index < 0
              ? next.kb_texts.push(value)
              : (next.kb_texts[index] = value);
          }
          if (kind === "tab") {
            if (index < 0) {
              next.kb_tabs.push({
                name: values.get("name").trim(),
                color: values.get("color"),
                rows: [],
              });
              resourceTab = next.kb_tabs.length - 1;
            } else
              Object.assign(next.kb_tabs[index], {
                name: values.get("name").trim(),
                color: values.get("color"),
              });
          }
          if (kind === "row") {
            const rows = next.kb_tabs[resourceTab].rows;
            const value = {
              ...(rows[index] || {}),
              name: values.get("name").trim(),
              value: values.get("value").trim(),
            };
            index < 0 ? rows.push(value) : (rows[index] = value);
          }
          if (kind === "template") {
            const value = {
              ...(next.categories[index] || {}),
              name: values.get("name").trim(),
              color: values.get("color"),
              tasks: values
                .get("tasks")
                .split("\n")
                .map((t) => t.trim())
                .filter(Boolean),
            };
            index < 0
              ? next.categories.push(value)
              : (next.categories[index] = value);
          }
        });
        if (saved) {
          closeModal();
          render();
          notify("Resource saved on this device.");
        }
      },
    );
  }
  function finishOrder(id, restore = false) {
    if (!requireProfile()) return;
    if (
      persist((next) => {
        const from = restore ? "finished" : "open",
          to = restore ? "open" : "finished",
          i = next[from].findIndex((o) => String(o.id) === String(id));
        if (i < 0) throw Error("The order was already moved.");
        const [order] = next[from].splice(i, 1);
        if (restore) {
          order.status = order.previousStatus || "Open";
          delete order.finishedAt;
        } else {
          order.previousStatus = order.status;
          order.status = "Completed";
          order.finishedAt = new Date().toISOString();
        }
        next[to].push(order);
      })
    ) {
      closeModal();
      render();
      notify(restore ? "Order restored to open." : "Order marked as finished.");
    }
  }
  function archiveOrder(id) {
    confirmAction(
      "Archive this order?",
      "It will be kept in Settings → Archive, including its notes and attachments.",
      () => {
        const saved = persist((next) => {
          for (const kind of ["open", "finished"]) {
            const i = next[kind].findIndex((o) => String(o.id) === String(id));
            if (i >= 0)
              next.trash.push({
                kind,
                record: next[kind].splice(i, 1)[0],
                removedAt: new Date().toISOString(),
              });
          }
        });
        if (saved) {
          render();
          notify("Order archived.");
        }
        return saved;
      },
      "Archive order",
    );
  }
  async function exportData() {
    if (!user) return;
    const payload = D.copy(data);
    payload.exportedAt = new Date().toISOString();
    payload.sharedWorkspaces = Object.fromEntries(
      D.PRODUCTS.map((p) => [p.id, workspace(p.id).data]),
    );
    payload.attachments = [];
    const orders = [
      ...payload.open,
      ...payload.finished,
      ...payload.trash
        .filter((x) => x.kind === "open" || x.kind === "finished")
        .map((x) => x.record),
    ];
    const ids = new Set(
      orders.flatMap((o) =>
        (o.files || []).map((f) => f.attachmentId).filter(Boolean),
      ),
    );
    for (const id of ids) {
      const image = await getImage(id);
      if (!image)
        throw Error(
          `A screenshot (${id}) could not be found. Export the original record instead, or restore the image from a previous backup.`,
        );
      const dataURL = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(image.blob);
      });
      payload.attachments.push({ id, name: image.name, dataURL });
    }
    download(`cdc-${user}-${today()}.json`, JSON.stringify(payload, null, 2));
    notify("Backup exported with saved screenshots.");
  }
  function importData() {
    if (!requireProfile()) return;
    showModal(
      "Import a backup",
      `Import into ${esc(user)}. Your current record will be backed up first.`,
      `<div class="stack"><label class="field">JSON file(s)<input name="files" type="file" accept=".json,application/json" multiple required></label><p class="hint">Choose a CDC backup, a legacy JSON export, or both orders.json and settings.json. Imports replace this profile’s current records; the previous version stays available as a backup.</p><label class="row small"><input type="checkbox" name="confirmed" required> Replace my current profile with this backup.</label></div>`,
      btn("close-modal", "Cancel") +
        '<button class="primary">Import backup</button>',
      async (values, form) => {
        const files = [...form.elements.files.files];
        if (!files.length) throw Error("Choose at least one JSON file.");
        if (!values.get("confirmed"))
          throw Error("Confirm the import before continuing.");
        let merged = {};
        for (const file of files) {
          if (file.size > 50 * 1024 * 1024)
            throw Error("Choose a JSON file smaller than 50 MB.");
          const value = JSON.parse(await file.text());
          if (!value || typeof value !== "object" || Array.isArray(value))
            throw Error("This is not a supported user backup.");
          if (
            ![
              "open",
              "finished",
              "links",
              "kb_texts",
              "kb_tabs",
              "kb_chart",
              "categories",
              "default_tasks",
              "theme",
            ].some((k) => k in value)
          )
            throw Error("No recognized user data was found in this file.");
          merged = { ...merged, ...value };
        }
        const normalized = D.normalizeData(merged);
        const attachmentMap = new Map();
        // Imported attachment IDs are always remapped, so another profile's images cannot be overwritten.
        for (const image of merged.attachments || []) {
          if (
            typeof image.dataURL !== "string" ||
            !/^data:image\/(png|jpeg|webp|bmp);base64,[A-Za-z\d+/=\r\n]+$/.test(
              image.dataURL,
            )
          )
            throw Error("The backup contains an invalid image.");
          const response = await fetch(image.dataURL);
          const blob = await response.blob();
          if (blob.size > 12 * 1024 * 1024)
            throw Error("An image in this backup exceeds 12 MB.");
          const saved = await putImage(blob, image.name);
          attachmentMap.set(image.id, saved.attachmentId);
        }
        const orders = [
          ...normalized.open,
          ...normalized.finished,
          ...normalized.trash
            .filter((x) => x.kind === "open" || x.kind === "finished")
            .map((x) => x.record),
        ];
        orders.forEach((o) =>
          (o.files || []).forEach((f) => {
            if (attachmentMap.has(f.attachmentId))
              f.attachmentId = attachmentMap.get(f.attachmentId);
          }),
        );
        delete normalized.attachments;
        data = store.importData(user, normalized);
        // Shared resources are kept in the backup; importing a profile never overwrites a team's local workspace.
        Object.keys(workspaceCache).forEach((k) => delete workspaceCache[k]);
        closeModal();
        render();
        notify("Backup imported. Your previous record is retained.");
      },
    );
  }
  function originalBackup() {
    const raw =
      localStorage.getItem(`ot:backup:v1:${user}`) ||
      localStorage.getItem(`ot:${user}`);
    if (!raw) return notify("No backup found.", true);
    download(`order-tracker-original-${user}.json`, raw);
    notify("Original record exported.");
  }
  function shareKey() {
    showModal(
      "Share a read-only preview",
      "This key contains your order data. Share it only with the people you intend.",
      textarea("key", "Data key", D.encodeKey(data), 'readonly id="shareKey"'),
      btn("copy-share", "Copy key", "copy", "primary") +
        btn("close-modal", "Done"),
    );
  }
  function previewForm() {
    showModal(
      "Open shared data",
      "Your saved records will remain unchanged.",
      textarea("key", "Paste a data key", "", "required"),
      btn("close-modal", "Cancel") +
        '<button class="primary">Open preview</button>',
      (values) => {
        let shared;
        try {
          shared = D.decodeKey(values.get("key"));
        } catch {
          throw Error("This data key is invalid.");
        }
        sessionStorage.setItem("ot:previewPayload", JSON.stringify(shared));
        data = shared;
        preview = true;
        closeModal();
        location.hash = "user/open";
        render();
      },
    );
  }
  function exitPreview() {
    sessionStorage.removeItem("ot:previewPayload");
    preview = false;
    data = user ? store.load(user) : D.emptyData();
    render();
    notify("Back to your data.");
  }
  function postForm() {
    if (!requireProfile()) return;
    showModal(
      "Write a team update",
      "Save a draft, then publish it for everyone through GitHub.",
      `<div class="stack">${field("title", "Title", "", 'required maxlength="140"')}${field("category", "Category", "Team update", 'required maxlength="50"')}${textarea("body", "Update", "", 'required maxlength="10000"')}<label class="row small"><input type="checkbox" name="pinned"> Pin this announcement</label></div>`,
      btn("close-modal", "Cancel") +
        '<button class="primary">Save draft</button>',
      (values) => {
        const posts = store.parse("ot:boardDrafts", []);
        posts.push({
          id: D.uid(),
          title: values.get("title").trim(),
          body: values.get("body").trim(),
          category: values.get("category").trim(),
          pinned: !!values.get("pinned"),
          author: user,
          date: today(),
        });
        store.write("ot:boardDrafts", posts);
        closeModal();
        render();
        notify("Draft saved. Publish it to share with everyone.");
      },
    );
  }
  function publication(kind) {
    if (!requireProfile()) return;
    const lan = kind === "lan",
      path = lan ? "lan-service.json" : "public-board.json";
    const posts = [...board];
    for (const draft of store.parse("ot:boardDrafts", [])) {
      const i = posts.findIndex((p) => p.id === draft.id);
      i < 0 ? posts.push(draft) : (posts[i] = draft);
    }
    const payload = lan
      ? {
          version: 1,
          source: "Pavel",
          ...D.extractWorkspace(workspace("lan").data),
        }
      : { version: 1, posts };
    const json = JSON.stringify(payload, null, 2);
    showModal(
      lan ? "Publish LAN Service resources" : "Publish Public Board",
      "Review the shared content, then commit it to the website repository.",
      `<p class="hint">${lan ? "Only links, common texts, chart tabs and checklist templates are included. Your personal orders and notes stay in your browser." : "After you commit the file, GitHub Pages will publish it for every user."}</p><ol class="publication-steps"><li>Copy the reviewed JSON below.</li><li>Open the GitHub editor and replace the file contents.</li><li>Commit the change. The site will update after deployment.</li></ol>${textarea("publication", "Content to publish", json, 'id="publicationJson" readonly style="min-height:240px"')}<p class="hint" style="margin-top:12px">GitHub checks your repository permissions when you publish.</p>`,
      btn("copy-publication", "Copy JSON", "copy", "primary") +
        `<a class="button" href="https://github.com/PaulK2/order-tracker-web/edit/main/data/${path}" target="_blank" rel="noopener noreferrer">Open GitHub editor ${icon("arrow")}</a>` +
        btn("close-modal", "Done"),
      null,
      true,
    );
  }
  function legacyResources() {
    const resources = D.extractWorkspace(data);
    showModal(
      "Your original resources",
      "The links and knowledge originally saved in your selected profile.",
      `<div class="stack"><p class="hint">${resources.links.length} links · ${resources.kb_texts.length} common texts · ${resources.kb_tabs.length} chart tabs · ${resources.categories.length} checklist templates</p><p class="hint">These records are still kept with your profile. You can export them or use them as this device’s LAN Service workspace.</p>${textarea("legacy", "Original resources", JSON.stringify(resources, null, 2), 'id="legacyJson" readonly style="min-height:220px"')}</div>`,
      btn("download-legacy", "Export resources", "download") +
        btn("use-legacy", "Use in LAN Service", "book", "primary"),
    );
  }
  function bindPage(page, sub) {
    const userForm = $("selectUserForm");
    if (userForm)
      userForm.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
          const selected = new FormData(e.target).get("username");
          const next = store.load(selected);
          store.select(selected);
          user = selected;
          data = next;
          sessionStorage.removeItem("ot:previewPayload");
          preview = false;
          Object.keys(workspaceCache).forEach((k) => delete workspaceCache[k]);
          location.hash = "dashboard";
          render();
        } catch (error) {
          notify(error.message, true);
        }
      });
    const createForm = $("createUserForm");
    if (createForm)
      createForm.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
          const values = new FormData(e.target);
          const name = store.create(
            values.get("username"),
            values.get("passport"),
          );
          store.select(name);
          user = name;
          data = store.load(name);
          preview = false;
          sessionStorage.removeItem("ot:previewPayload");
          location.hash = "dashboard";
          render();
          notify("Your profile is ready.");
        } catch (error) {
          $("signupError").textContent = error.message;
        }
      });
    const search = $("orderSearch");
    if (search)
      search.addEventListener("input", () => {
        filter.q = search.value;
        $("orderList").innerHTML = orderList(sub || "open");
      });
    const product = $("productFilter");
    if (product)
      product.addEventListener("change", () => {
        filter.product = product.value;
        $("orderList").innerHTML = orderList(sub || "open");
      });
    const category = $("categoryFilter");
    if (category)
      category.addEventListener("change", () => {
        filter.category = category.value;
        $("orderList").innerHTML = orderList(sub || "open");
      });
    const sort = $("orderSort");
    if (sort)
      sort.addEventListener("change", () => {
        filter.sort = sort.value;
        $("orderList").innerHTML = orderList(sub || "open");
      });
    const tab = $("resourceTab");
    if (tab)
      tab.addEventListener("change", () => {
        resourceTab = Number(tab.value);
        render();
      });
  }
  const actions = {
    "close-modal": closeModal,
    "menu-open": () => {
      document.querySelector(".sidebar").classList.add("open");
      document.querySelector(".mobile-shade").classList.add("show");
    },
    "menu-close": () => {
      document.querySelector(".sidebar").classList.remove("open");
      document.querySelector(".mobile-shade").classList.remove("show");
    },
    profiles: () => {
      closeModal();
      location.hash = "users";
    },
    logout: () => {
      store.logout();
      user = null;
      data = D.emptyData();
      preview = false;
      sessionStorage.removeItem("ot:previewPayload");
      location.hash = "dashboard";
      render();
    },
    theme: () => setTheme(data.theme === "dark" ? "light" : "dark"),
    "set-theme": (el) => setTheme(el.dataset.theme),
    search: () => {
      location.hash = "user/open";
      render();
      $("orderSearch")?.focus();
    },
    "new-order": () => orderForm(),
    "import-order": () => orderForm("", true),
    "edit-order": (el) => orderForm(el.dataset.id),
    "order-detail": (el) => orderDetail(el.dataset.id),
    "finish-order": (el) => finishOrder(el.dataset.id),
    "restore-order": (el) => finishOrder(el.dataset.id, true),
    "archive-order": (el) => archiveOrder(el.dataset.id),
    "copy-reference": (el) => copyText(el.dataset.value),
    "apply-template": (el) => {
      if (!requireProfile()) return;
      const order = findOrder(el.dataset.id),
        templates = workspace(order.product).data.categories;
      showModal(
        "Apply a checklist template",
        "This replaces the current checklist and resets its progress.",
        select(
          "template",
          "Checklist template",
          templates.map((t) => t.name),
          order.category,
        ),
        btn("close-modal", "Cancel") +
          '<button class="primary">Apply template</button>',
        (values) => {
          const template = templates.find(
            (t) => t.name === values.get("template"),
          );
          if (!template) throw Error("Choose a template.");
          if (
            persist((next) => {
              const o = next.open.find((o) => String(o.id) === el.dataset.id);
              if (!o) throw Error("Order is no longer open.");
              o.category = template.name;
              o.tasks = template.tasks.map((name) => ({ name, done: false }));
            })
          ) {
            closeModal();
            render();
            notify("Checklist template applied.");
          }
        },
      );
    },
    "saved-backups": () => {
      const keys = Object.keys(localStorage)
        .filter((k) => k.startsWith("ot:backup:") && k.endsWith(":" + user))
        .sort()
        .reverse();
      showModal(
        "Saved profile backups",
        "Download a backup, then use Import JSON if you want to restore it.",
        `<div class="stack">${keys.length ? keys.map((key) => `<div class="resource-row"><span class="small">${esc(key.slice(10, -user.length - 1))}</span>${btn("download-backup", "Download", "download", "small", `data-key="${esc(key)}"`)}</div>`).join("") : '<p class="hint">No earlier versions are stored yet.</p>'}</div>`,
        btn("close-modal", "Done"),
      );
    },
    "download-backup": (el) => {
      const raw = localStorage.getItem(el.dataset.key);
      if (raw) download(`cdc-backup-${user}.json`, raw);
    },
    "reset-checklist": (el) =>
      confirmAction(
        "Reset this checklist?",
        "All checklist items on this order will be marked as incomplete.",
        () => {
          const saved = persist((next) => {
            const o = next.open.find((o) => String(o.id) === el.dataset.id);
            if (!o) throw Error("Order not found.");
            o.tasks.forEach((t) => (t.done = false));
          });
          if (saved) render();
          return saved;
        },
        "Reset checklist",
      ),
    "add-attachment": (el) => {
      if (!requireProfile()) return;
      const id = el.dataset.id;
      showModal(
        "Add an attachment link",
        "Link a document, portal or other reference.",
        `<div class="stack">${field("name", "Attachment name", "", "required")}${field("url", "URL", "", 'required placeholder="https://…"')}</div>`,
        btn("close-modal", "Cancel") +
          '<button class="primary">Add link</button>',
        (values) => {
          const url = D.safeUrl(values.get("url"));
          if (!url) throw Error("Enter a valid http or https URL.");
          if (
            persist((next) => {
              const o = [...next.open, ...next.finished].find(
                (o) => String(o.id) === id,
              );
              if (!o) throw Error("Order not found.");
              o.files.push({ name: values.get("name").trim(), url });
            })
          ) {
            orderDetail(id);
            render();
            notify("Link attached.");
          }
        },
      );
    },
    "remove-attachment": (el) => {
      const id = el.dataset.id;
      confirmAction(
        "Remove this attachment?",
        "The attachment will be removed from this order.",
        () => {
          const saved = persist((next) => {
            const o = [...next.open, ...next.finished].find(
              (o) => String(o.id) === id,
            );
            if (!o) throw Error("Order not found.");
            o.files.splice(Number(el.dataset.index), 1);
          });
          if (saved) render();
          return saved;
        },
        "Remove attachment",
      );
    },
    "view-image": async (el) => {
      const f = findOrder(el.dataset.id)?.files[Number(el.dataset.index)];
      if (!f) return;
      const image = await getImage(f.attachmentId);
      if (!image)
        throw Error(
          "This screenshot is not available in this browser. Import a full backup with images.",
        );
      const url = URL.createObjectURL(image.blob);
      showModal(
        f.name,
        "Saved with your order on this device.",
        `<img src="${url}" alt="${esc(f.name)}" style="width:100%;border-radius:8px">`,
        `<a class="button" href="${url}" download="${esc(f.name)}">Download image</a>` +
          btn("close-modal", "Done"),
        null,
        true,
      );
      modalCleanup = () => URL.revokeObjectURL(url);
    },
    "new-note": () => noteForm(),
    "edit-note": (el) => noteForm(el.dataset.id),
    "delete-note": (el) =>
      confirmAction(
        "Archive this note?",
        "You can restore it from Settings → Archive.",
        () => {
          const saved = persist((next) => {
            const i = next.personalNotes.findIndex(
              (n) => n.id === el.dataset.id,
            );
            if (i >= 0)
              next.trash.push({
                kind: "personalNotes",
                record: next.personalNotes.splice(i, 1)[0],
                removedAt: new Date().toISOString(),
              });
          });
          if (saved) render();
          return saved;
        },
        "Archive note",
      ),
    "clear-finished": () =>
      confirmAction(
        "Archive all finished orders?",
        "Every finished order will move to Settings → Archive and can be restored.",
        () => {
          const saved = persist((next) => {
            next.finished.forEach((record) =>
              next.trash.push({
                kind: "finished",
                record,
                removedAt: new Date().toISOString(),
              }),
            );
            next.finished = [];
          });
          if (saved) render();
          return saved;
        },
        "Archive finished orders",
      ),
    unarchive: (el) => {
      if (
        persist((next) => {
          const item = next.trash[Number(el.dataset.index)];
          if (
            !item ||
            !["open", "finished", "personalNotes"].includes(item.kind)
          )
            throw Error("This archive item cannot be restored.");
          next[item.kind].push(item.record);
          next.trash.splice(Number(el.dataset.index), 1);
        })
      ) {
        render();
        notify("Restored from the archive.");
      }
    },
    "add-link": (el) => resourceForm("link", el.dataset.product),
    "edit-link": (el) =>
      resourceForm("link", el.dataset.product, Number(el.dataset.index)),
    "add-text": (el) => resourceForm("text", el.dataset.product),
    "edit-text": (el) =>
      resourceForm("text", el.dataset.product, Number(el.dataset.index)),
    "add-tab": (el) => resourceForm("tab", el.dataset.product),
    "edit-tab": (el) => resourceForm("tab", el.dataset.product, resourceTab),
    "add-row": (el) => resourceForm("row", el.dataset.product),
    "edit-row": (el) =>
      resourceForm("row", el.dataset.product, Number(el.dataset.index)),
    "add-template": (el) => resourceForm("template", el.dataset.product),
    "edit-template": (el) =>
      resourceForm("template", el.dataset.product, Number(el.dataset.index)),
    "copy-link": (el) =>
      copyText(
        workspace(el.dataset.product).data.links[Number(el.dataset.index)].link,
      ),
    "copy-text": (el) =>
      copyText(
        workspace(el.dataset.product).data.kb_texts[Number(el.dataset.index)],
      ),
    "copy-row": (el) =>
      copyText(
        workspace(el.dataset.product).data.kb_tabs[resourceTab].rows[
          Number(el.dataset.index)
        ].value,
      ),
    "move-row": (el) => {
      if (
        updateWorkspace(el.dataset.product, (next) => {
          const rows = next.kb_tabs[resourceTab].rows,
            i = Number(el.dataset.index),
            j = i + Number(el.dataset.direction);
          if (j < 0 || j >= rows.length) return;
          [rows[i], rows[j]] = [rows[j], rows[i]];
        })
      )
        render();
    },
    "remove-row": (el) =>
      confirmAction(
        "Remove this reference row?",
        "This changes the chart on this device.",
        () => {
          const saved = updateWorkspace(el.dataset.product, (next) =>
            next.kb_tabs[resourceTab].rows.splice(Number(el.dataset.index), 1),
          );
          if (saved) render();
          return saved;
        },
        "Remove row",
      ),
    "remove-tab": (el) => {
      if (workspace(el.dataset.product).data.kb_tabs.length <= 1)
        return notify("Keep at least one reference tab.", true);
      confirmAction(
        "Remove this chart tab?",
        "All rows in this tab will be removed from this device’s workspace.",
        () => {
          const saved = updateWorkspace(el.dataset.product, (next) =>
            next.kb_tabs.splice(resourceTab, 1),
          );
          if (saved) {
            resourceTab = 0;
            render();
          }
          return saved;
        },
        "Remove tab",
      );
    },
    "remove-resource": (el) => {
      const { kind, product } = el.dataset;
      if (
        kind === "categories" &&
        workspace(product).data.categories.length <= 1
      )
        return notify("Keep at least one checklist template.", true);
      confirmAction(
        "Remove this resource?",
        "This changes the product workspace on this device. Existing orders are unaffected.",
        () => {
          const saved = updateWorkspace(product, (next) =>
            next[kind].splice(Number(el.dataset.index), 1),
          );
          if (saved) render();
          return saved;
        },
        "Remove resource",
      );
    },
    export: exportData,
    "import-data": importData,
    "export-original": originalBackup,
    "share-key": shareKey,
    "load-preview": previewForm,
    "preview-exit": exitPreview,
    "copy-share": () => copyText($("shareKey").value),
    "new-post": postForm,
    "publish-board": () => publication("board"),
    "publish-lan": () => publication("lan"),
    "copy-publication": () => copyText($("publicationJson").value),
    "delete-draft": (el) =>
      confirmAction(
        "Delete this draft?",
        "This only removes the unpublished draft on this device.",
        () => {
          const drafts = store.parse("ot:boardDrafts", []);
          drafts.splice(Number(el.dataset.index), 1);
          store.write("ot:boardDrafts", drafts);
          render();
        },
        "Delete draft",
      ),
    "reload-public": async () => {
      await loadPublished();
      Object.keys(workspaceCache).forEach((k) => delete workspaceCache[k]);
      render();
    },
    "legacy-resources": legacyResources,
    "download-legacy": () =>
      download(
        `lan-service-${user}.json`,
        JSON.stringify(D.extractWorkspace(data), null, 2),
      ),
    "use-legacy": () =>
      confirmAction(
        "Use your original resources in LAN Service?",
        "The current LAN resources on this device will be backed up before being replaced. Orders and notes are not included.",
        () => {
          if (!requireProfile()) return false;
          const before = workspace("lan");
          store.write(`ot:workspace-backup:lan:${Date.now()}`, before);
          store.saveWorkspace("lan", D.extractWorkspace(data), user);
          delete workspaceCache.lan;
          render();
          notify("Your original resources are now in LAN Service.");
        },
        "Use original resources",
      ),
  };
  function setTheme(theme) {
    if (preview) {
      data.theme = theme;
      render();
      return;
    }
    if (user) {
      if (persist((next) => (next.theme = theme))) render();
    } else {
      data.theme = theme;
      store.write("ot:guestTheme", theme);
      render();
    }
  }
  document.addEventListener("click", async (e) => {
    const target = e.target.closest("[data-action]");
    if (!target || target.disabled) return;
    const action = actions[target.dataset.action];
    if (!action) return;
    try {
      await action(target);
    } catch (error) {
      if (modal.open && $("modalError"))
        $("modalError").textContent = error.message;
      else notify(error.message, true);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      !modal.open &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
      e.preventDefault();
      actions.search();
    }
  });
  window.addEventListener("hashchange", () => {
    resourceTab = 0;
    closeModal();
    try {
      render();
      window.scrollTo(0, 0);
    } catch (e) {
      fatal(e);
    }
  });
  window.addEventListener("storage", (e) => {
    if (e.key === `ot:${user}` && !preview) {
      if (modal.open) {
        notify(
          "Your profile changed in another tab. New saves use the latest record.",
        );
        return;
      }
      try {
        data = store.load(user);
        render();
      } catch (error) {
        notify(error.message, true);
      }
    }
    if (e.key?.startsWith("ot:workspace:")) {
      Object.keys(workspaceCache).forEach((k) => delete workspaceCache[k]);
      if (!modal.open) render();
    }
  });
  async function loadPublished() {
    const results = await Promise.allSettled(
      ["data/public-board.json", "data/lan-service.json"].map(async (path) => {
        const response = await fetch(`${path}?v=2`, {
          cache: "no-cache",
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw Error("Published content could not be loaded.");
        return response.json();
      }),
    );
    publicationError = "";
    if (
      results[0].status === "fulfilled" &&
      Array.isArray(results[0].value.posts)
    ) {
      board = results[0].value.posts
        .filter(
          (p) => p && typeof p.title === "string" && typeof p.body === "string",
        )
        .sort(
          (a, b) =>
            Number(!!b.pinned) - Number(!!a.pinned) ||
            String(b.date || "").localeCompare(String(a.date || "")),
        );
    } else
      publicationError =
        "The Public Board could not be refreshed. Check your connection and try again.";
    if (results[1].status === "fulfilled") publishedLan = results[1].value;
  }
  function fatal(error) {
    $("app").innerHTML =
      `<main class="panel error-screen"><h1>We couldn’t open this record.</h1><p class="muted">${esc(error.message)}</p><p class="hint" style="margin:20px 0">Your saved data has not been reset or deleted.</p><div class="row">${btn("recover-data", "Export saved record", "download", "primary")}${btn("recover-profile", "Choose another profile", "user")}</div></main>`;
  }
  actions["recover-data"] = () => {
    const name = localStorage.getItem("ot:currentUser");
    download(
      `order-tracker-recovery-${name || "data"}.json`,
      localStorage.getItem(`ot:${name}`) || "{}",
    );
  };
  actions["recover-profile"] = () => {
    store.logout();
    user = null;
    data = D.emptyData();
    Object.keys(workspaceCache).forEach((k) => delete workspaceCache[k]);
    location.hash = "users";
    render();
  };
  async function init() {
    try {
      store = D.createStore(localStorage);
      user = store.current();
      if (user) data = store.load(user);
      else data.theme = localStorage.getItem("ot:guestTheme") || "light";
      const shared = sessionStorage.getItem("ot:previewPayload");
      if (shared) {
        try {
          data = D.normalizeData(JSON.parse(shared));
          preview = true;
        } catch {
          sessionStorage.removeItem("ot:previewPayload");
        }
      }
      await loadPublished();
      render();
    } catch (e) {
      fatal(e);
    }
  }
  init();
})();
