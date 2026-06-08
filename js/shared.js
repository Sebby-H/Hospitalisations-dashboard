// ═══════════════════════════════════════════════
// shared.js — Shared constants, utilities, filter
// ═══════════════════════════════════════════════

const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 };

const COLOR_PALETTE = [
  "#66C2A5",  // Driver
  "#FC8D62",  // Passenger
  "#8DA0CB",  // Motorcyclist
  "#E78AC3",  // Cyclist
  "#A6D854",  // Pedestrian
];

const GENDER_COLORS = {
  all:    "#66C2A5",
  Male:   "#2563A8",
  Female: "#E78AC3",
};

const ROAD_USER_LABELS = ["Driver","Passenger","Motorcyclist","Cyclist","Pedestrian"];
const STATE_LABELS     = ["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"];

// ── Shared filter state ──────────────────────────
const filterState = {
  gender:    "all",
  ageGroups: ["0-7","8-16","17-25","26-39","40-64","65-74","75+"],
  roadUsers: ["all"],
  yearFrom:  2011,
  yearTo:    2021,
};

// ── Raw data cache (loaded once) ─────────────────
const dataCache = {
  stateAnnual:    null,
  nationalAnnual: null,
  demographics:   null,
  roadUser:       null,
};

// ── Tooltip helpers ──────────────────────────────
function createTooltip() {
  return d3.select("body").append("div").attr("class", "d3-tooltip");
}
function showTooltip(tooltip, event, html) {
  tooltip.html(html)
    .style("opacity", 1)
    .style("left", (event.pageX + 14) + "px")
    .style("top",  (event.pageY - 28) + "px");
}
function hideTooltip(tooltip) {
  tooltip.style("opacity", 0);
}

// ── Number formatters ────────────────────────────
const formatComma = d3.format(",");
const formatPct   = d3.format(".1%");

// ═══════════════════════════════════════════════
// applyFilters()
// Called whenever any filter changes.
// Filters each dataset and calls each chart's
// window.update*() function.
// ═══════════════════════════════════════════════
function applyFilters() {
  const { yearFrom, yearTo, gender, ageGroups, roadUsers } = filterState;

  // ── Bar chart: filter state_annual by year ───
  if (dataCache.stateAnnual && window.updateBarchart) {
    const filtered = dataCache.stateAnnual.filter(d =>
      d.year >= yearFrom && d.year <= yearTo
    );
    window.updateBarchart(filtered);
  }

  // ── Line chart: filter road_user_annual by year + road user ──
  if (dataCache.roadUser && window.updateLinechart) {
    const filtered = dataCache.roadUser.filter(d =>
      d.year >= yearFrom && d.year <= yearTo
    );
    const activeUsers = roadUsers.includes("all")
      ? ["Driver","Passenger","Motorcyclist","Cyclist","Pedestrian"]
      : roadUsers;
    window.updateLinechart(filtered, activeUsers);
  }

  // ── Scatterplot: filter demographics by year + gender + age ──
  if (dataCache.demographics && window.updateScatterplot) {
    let filtered = dataCache.demographics.filter(d =>
      d.year >= yearFrom && d.year <= yearTo
    );
    if (gender !== "all") {
      filtered = filtered.filter(d => d.sex === gender);
    }
    if (ageGroups.length > 0) {
      filtered = filtered.filter(d => ageGroups.includes(d.age_group));
    }
    window.updateScatterplot(filtered, gender);
  }

  // ── Histogram: filter demographics by year + gender + age ──
  if (dataCache.demographics && window.updateHistogram) {
    let filtered = dataCache.demographics.filter(d =>
      d.year >= yearFrom && d.year <= yearTo
    );
    if (gender !== "all") {
      filtered = filtered.filter(d => d.sex === gender);
    }
    if (ageGroups.length > 0) {
      filtered = filtered.filter(d => ageGroups.includes(d.age_group));
    }
    window.updateHistogram(filtered, gender);
  }
}