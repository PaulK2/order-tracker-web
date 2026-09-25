(function (root, factory) {
  const api = factory(
    typeof module === "object" && module.exports
      ? require("./data.js")
      : root.CDCData,
  );
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CDCTracking = api;
})(typeof window !== "undefined" ? window : globalThis, function (D) {
  "use strict";
  const ref = (s) =>
    String(s || "")
      .normalize("NFKC")
      .toUpperCase()
      .replace(/[\s-]/g, "");
  const client = (s) =>
    String(s || "")
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  const sameId = (a, b) => a != null && b != null && String(a) === String(b);
  function matchScore(flow, order) {
    if (order.product !== "lan") return 0;
    for (const key of ["val42", "bsId"])
      if (
        ref(flow[key]) &&
        ref(order[key]) &&
        ref(flow[key]) !== ref(order[key])
      )
        return 0;
    if (ref(flow.val42) && ref(flow.val42) === ref(order.val42)) return 3;
    if (ref(flow.bsId) && ref(flow.bsId) === ref(order.bsId)) return 2;
    // An old completed flow must not finish an unrelated future order for the same client.
    if (
      !flow.completed &&
      client(flow.customer) &&
      client(flow.customer) === client(order.customer)
    )
      return 1;
    return 0;
  }
  function linkEflows(data) {
    const all = [...data.open, ...data.finished];
    for (const flow of data.eflows) {
      const linked = all.find(
        (o) => sameId(o.id, flow.linkedOrderId) && o.product === "lan",
      );
      if (flow.linkMode === "none") {
        flow.linkedOrderId = null;
        flow.linkReason = "";
        continue;
      }
      if (flow.linkMode === "manual") {
        flow.linkedOrderId = linked ? String(linked.id) : null;
        flow.linkReason = linked ? "Manual link" : "";
        continue;
      }
      // Keep completed links stable when further orders arrive.
      if (linked && data.finished.some((o) => sameId(o.id, linked.id)))
        continue;
      const scores = data.open.map((order) => ({
        order,
        score: matchScore(flow, order),
      }));
      const highest = Math.max(0, ...scores.map((o) => o.score));
      const matches = scores.filter((o) => o.score === highest && highest > 0);
      flow.linkedOrderId =
        matches.length === 1 ? String(matches[0].order.id) : null;
      flow.linkReason =
        matches.length === 1
          ? ["", "Client name", "BS-ID", "42x number"][highest]
          : "";
    }
    return data;
  }
  function completeLinkedOrder(data, flow, now) {
    const index = data.open.findIndex((o) => sameId(o.id, flow.linkedOrderId));
    if (index < 0) return;
    const order = data.open.splice(index, 1)[0];
    order.previousStatus = order.status;
    order.status = "Completed";
    order.finishedAt = now;
    order.completedByEflowId = flow.id;
    data.finished.push(order);
  }
  function synchronize(data) {
    linkEflows(data);
    for (const flow of data.eflows)
      if (flow.completed && flow.linkedOrderId)
        completeLinkedOrder(
          data,
          flow,
          flow.completedAt || new Date().toISOString(),
        );
    return data;
  }
  function completeEflow(data, id) {
    linkEflows(data);
    const flow = data.eflows.find((e) => sameId(e.id, id));
    if (!flow) throw Error("This eFlow is no longer available.");
    flow.completed = true;
    flow.completedAt = new Date().toISOString();
    completeLinkedOrder(data, flow, flow.completedAt);
    return flow;
  }
  function restoreOrder(data, id) {
    const index = data.finished.findIndex((o) => sameId(o.id, id));
    if (index < 0) return;
    const order = data.finished.splice(index, 1)[0];
    order.status = order.previousStatus || "Open";
    delete order.finishedAt;
    delete order.completedByEflowId;
    for (const flow of data.eflows.filter((e) => sameId(e.linkedOrderId, id))) {
      flow.completed = false;
      delete flow.completedAt;
    }
    data.open.push(order);
  }
  function reopenEflow(data, id) {
    const flow = data.eflows.find((e) => sameId(e.id, id));
    if (!flow) throw Error("This eFlow is no longer available.");
    flow.completed = false;
    delete flow.completedAt;
    const order = data.finished.find(
      (o) =>
        sameId(o.id, flow.linkedOrderId) &&
        sameId(o.completedByEflowId, flow.id),
    );
    if (!order) return;
    const other = data.eflows.find(
      (e) => e.completed && sameId(e.linkedOrderId, order.id),
    );
    if (other) order.completedByEflowId = other.id;
    else restoreOrder(data, order.id);
  }
  function sortEflows(flows) {
    return [...flows].sort(
      (a, b) =>
        (a.dateFrom || "9999").localeCompare(b.dateFrom || "9999") ||
        String(a.createdAt || "").localeCompare(String(b.createdAt || "")),
    );
  }
  function importRows(data, kind, rows, options = {}) {
    const keys =
      kind === "eflow"
        ? ["val42", "dateFrom", "grossAmount", "bsId", "customer"]
        : [
            "customer",
            "name",
            "product",
            "val310",
            "bsId",
            "status",
            "date",
            "val42",
            "val23",
          ];
    const valid = rows.filter(
      (r) => r?.fields && keys.some((k) => String(r.fields[k] ?? "").trim()),
    );
    if (!valid.length)
      throw Error(
        "No order information was detected. Try a clearer screenshot.",
      );
    const ids = [],
      batchId = D.uid(),
      now = new Date().toISOString();
    for (const row of valid) {
      const fields = Object.fromEntries(
        keys.map((k) => [k, String(row.fields[k] ?? "").trim()]),
      );
      const base = {
        ...fields,
        id: D.uid(),
        createdAt: now,
        importBatchId: batchId,
        ocrText: row.rawText || "",
        files: options.attachment ? [D.copy(options.attachment)] : [],
      };
      if (kind === "eflow")
        data.eflows.push({ ...base, completed: false, linkedOrderId: null });
      else {
        const product = D.productId(fields.product) || data.assignedProduct;
        const template = options.workspace?.(product)?.categories?.[0];
        const completed =
          /^(?:completed|finished|done|erledigt|abgeschlossen)$/i.test(
            fields.status,
          );
        const order = {
          ...base,
          product,
          productFromProfile: !D.productId(fields.product),
          status: fields.status || "Open",
          category: template?.name || "Default",
          tasks: (template?.tasks || []).map((name) => ({ name, done: false })),
          notes: [],
        };
        if (completed) {
          order.finishedAt = now;
          data.finished.push(order);
        } else data.open.push(order);
      }
      ids.push(base.id);
    }
    synchronize(data);
    return { ids, batchId, count: ids.length };
  }
  return {
    matchScore,
    linkEflows,
    synchronize,
    completeEflow,
    reopenEflow,
    restoreOrder,
    sortEflows,
    importRows,
  };
});
