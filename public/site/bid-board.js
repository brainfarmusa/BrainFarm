(function () {
  "use strict";
  var SHEET_ID = "1HgPjnh9I4BvF1H8E63bMUnCPKbqHbggoRwKTGA0FNV8";
  var SHEET_GID = "2088576041";
  var SHEET_URL = "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit?gid=" + SHEET_GID + "#gid=" + SHEET_GID;
  var lots = [];
  var grid = document.querySelector("[data-bid-lots]");
  if (!grid) return;
  var status = document.querySelector("[data-bid-status]");
  var empty = document.querySelector("[data-bid-empty]");
  var search = document.querySelector("[data-bid-search]");
  var category = document.querySelector("[data-bid-category]");

  function text(cell) { return !cell ? "" : String(cell.f != null ? cell.f : (cell.v != null ? cell.v : "")).trim(); }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]; }); }
  function lotParts(value) { var lines = value.split(/\n+/).map(function (line) { return line.trim(); }).filter(Boolean); return { title: lines[0] || "Current opportunity", due: lines.slice(1).join(" · ") }; }

  function render() {
    var term = search.value.trim().toLowerCase();
    var selected = category.value;
    var filtered = lots.filter(function (lot) {
      var haystack = [lot.category, lot.bidId, lot.details, lot.notes].join(" ").toLowerCase();
      return (!selected || lot.category === selected) && (!term || haystack.indexOf(term) !== -1);
    });
    grid.innerHTML = filtered.map(function (lot) {
      var parts = lotParts(lot.details);
      return '<article class="bid-lot-card"><div class="bid-lot-meta"><span>' + escapeHtml(lot.category) + '</span><b>' + escapeHtml(lot.bidId) + '</b></div><h3>' + escapeHtml(parts.title) + '</h3>' + (parts.due ? '<p class="bid-due">' + escapeHtml(parts.due) + '</p>' : '') + (lot.notes ? '<p class="bid-notes">' + escapeHtml(lot.notes) + '</p>' : '') + '<div class="bid-lot-actions"><a href="' + SHEET_URL + '&range=A' + lot.sheetRow + '" target="_blank" rel="noopener">View lot on live board</a></div></article>';
    }).join("");
    empty.hidden = filtered.length !== 0;
    status.textContent = filtered.length === lots.length ? "Showing all current opportunities." : "Showing " + filtered.length + " of " + lots.length + " current opportunities.";
  }

  function loadResponse(response) {
    try {
      if (!response || response.status === "error") throw new Error("Feed unavailable");
      lots = response.table.rows.map(function (row, index) { var cells = row.c || []; return { category: text(cells[0]), bidId: text(cells[1]), details: text(cells[2]), download: text(cells[3]), notes: text(cells[4]), sheetRow: index + 10 }; }).filter(function (lot) { return lot.category && lot.bidId && lot.details; });
      var categories = Array.from(new Set(lots.map(function (lot) { return lot.category; }))).sort();
      categories.forEach(function (name) { var option = document.createElement("option"); option.value = name; option.textContent = name; category.appendChild(option); });
      document.querySelector("[data-bid-count]").textContent = lots.length;
      document.querySelector("[data-category-count]").textContent = categories.length;
      render();
    } catch (error) {
      status.innerHTML = 'The live listings could not be loaded. <a href="' + SHEET_URL + '" target="_blank" rel="noopener">Open the full bid board</a>.';
    }
  }

  window.google = window.google || {};
  window.google.visualization = window.google.visualization || {};
  window.google.visualization.Query = window.google.visualization.Query || {};
  window.google.visualization.Query.setResponse = loadResponse;
  search.addEventListener("input", render);
  category.addEventListener("change", render);
  var script = document.createElement("script");
  var query = "select A,C,D,E,F where A is not null";
  script.src = "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/gviz/tq?gid=" + SHEET_GID + "&range=A9:F&headers=1&tqx=out:json&tq=" + encodeURIComponent(query);
  script.onerror = function () { loadResponse(null); };
  document.head.appendChild(script);
})();
