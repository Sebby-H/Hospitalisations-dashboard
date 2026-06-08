// ═══════════════════════════════════════════════
// barchart.js — Hospitalisations by State
// Data: data/state_annual.csv
// ═══════════════════════════════════════════════

(function () {

  const CONTAINER_ID    = "chart-barchart";
  const BAR_COLOR       = "#2563A8";
  const BAR_HOVER_COLOR = "#66C2A5";

  const STATE_NAME_MAP = {
    "ACT":"ACT","NSW":"NSW","NT":"NT",
    "Qld":"QLD","SA":"SA","Tas":"TAS","Vic":"VIC","WA":"WA",
  };

  const tooltip = createTooltip();

  // ── Load & cache data ────────────────────────
  d3.csv("data/state_annual.csv").then(function (rawData) {
    rawData.forEach(d => {
      d.state            = STATE_NAME_MAP[d.state] || d.state;
      d.year             = +d.year;
      d.hospitalisations = +d["hospitalisations"];
    });
    dataCache.stateAnnual = rawData;
    drawChart(rawData);
    updateKeyStats(rawData);
  }).catch(() => {
    document.getElementById(CONTAINER_ID).innerHTML =
      `<p style="color:#64748B;padding:1rem;">⚠️ Could not load data/state_annual.csv — use Live Server.</p>`;
  });

  // ── Expose update function ───────────────────
  window.updateBarchart = function(filteredData) {
    drawChart(filteredData);
    updateKeyStats(filteredData);
  };

  // ── Draw chart ───────────────────────────────
  function drawChart(data) {
    const aggregated = d3.rollups(
      data, v => d3.sum(v, d => d.hospitalisations), d => d.state
    ).map(([state, total]) => ({ state, total }))
     .sort((a, b) => b.total - a.total);

    const container = document.getElementById(CONTAINER_ID);
    const totalW = container.clientWidth || 800;
    const totalH = 420;
    const margin = { top: 20, right: 80, bottom: 50, left: 60 };
    const width  = totalW - margin.left - margin.right;
    const height = totalH - margin.top  - margin.bottom;

    d3.select(`#${CONTAINER_ID}`).select("svg").remove();
    const svg = d3.select(`#${CONTAINER_ID}`)
      .append("svg").attr("width", totalW).attr("height", totalH);
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(aggregated, d => d.total) * 1.05])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(aggregated.map(d => d.state))
      .range([0, height]).padding(0.25);

    // Grid
    g.append("g").call(
      d3.axisBottom(xScale).ticks(6).tickSize(height).tickFormat("")
    ).call(gEl => {
      gEl.select(".domain").remove();
      gEl.selectAll(".tick line").attr("stroke","#E2E8F0").attr("stroke-dasharray","3,3");
    });

    // Bars
    g.selectAll(".bar").data(aggregated).join("rect")
      .attr("class","bar").attr("x",0)
      .attr("y", d => yScale(d.state))
      .attr("width", d => xScale(d.total))
      .attr("height", yScale.bandwidth())
      .attr("fill", BAR_COLOR).attr("rx", 3)
      .style("cursor","pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", BAR_HOVER_COLOR);
        showTooltip(tooltip, event,
          `<strong>${d.state}</strong><br/>Total: ${formatComma(d.total)} hospitalisations`);
      })
      .on("mousemove", function(event) {
        tooltip.style("left",(event.pageX+14)+"px").style("top",(event.pageY-28)+"px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill", BAR_COLOR);
        hideTooltip(tooltip);
      });

    // Value labels
    g.selectAll(".bar-label").data(aggregated).join("text")
      .attr("class","bar-label")
      .attr("x", d => xScale(d.total) + 8)
      .attr("y", d => yScale(d.state) + yScale.bandwidth()/2)
      .attr("dy","0.35em").attr("font-size","11px")
      .attr("font-family","'DM Sans',sans-serif").attr("fill","#64748B")
      .text(d => formatComma(d.total));

    // X axis
    const xAxis = g.append("g").attr("transform",`translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(6)
        .tickFormat(d => d3.format(".2s")(d).replace("G","B")));
    xAxis.select(".domain").attr("stroke","#CBD5E1");
    xAxis.selectAll("text").attr("font-family","'DM Sans',sans-serif")
      .attr("font-size","11px").attr("fill","#64748B");
    g.append("text").attr("x",width/2).attr("y",height+42)
      .attr("text-anchor","middle").attr("font-size","11px")
      .attr("font-family","'DM Sans',sans-serif").attr("fill","#64748B")
      .text("Total Hospitalisations");

    // Y axis
    const yAxis = g.append("g").call(d3.axisLeft(yScale).tickSize(0));
    yAxis.select(".domain").remove();
    yAxis.selectAll("text").attr("font-family","'DM Sans',sans-serif")
      .attr("font-size","12px").attr("font-weight","500")
      .attr("fill","#1E293B").attr("dx","-8px");
  }

  // ── Key Stats ────────────────────────────────
  function updateKeyStats(data) {
    const total    = d3.sum(data, d => d.hospitalisations);
    const byYear   = d3.rollups(data, v => d3.sum(v,d=>d.hospitalisations), d=>d.year);
    const peakYear = byYear.length ? byYear.reduce((a,b) => b[1]>a[1]?b:a)[0] : "—";

    // Use actual min/max year from filtered data
    const years    = data.map(d => d.year);
    const minYear  = d3.min(years);
    const maxYear  = d3.max(years);
    const tFirst   = d3.sum(data.filter(d=>d.year===minYear), d=>d.hospitalisations);
    const tLast    = d3.sum(data.filter(d=>d.year===maxYear), d=>d.hospitalisations);
    const pct      = tFirst ? ((tLast-tFirst)/tFirst*100).toFixed(1) : 0;

    const el1 = document.getElementById("stat-total");
    const el2 = document.getElementById("stat-peak");
    const el3 = document.getElementById("stat-change");
    const el3label = document.getElementById("stat-change-label");

    if (el1) el1.textContent = formatComma(total);
    if (el2) el2.textContent = peakYear || "—";
    if (el3) {
      el3.textContent = (pct>0?"+":"")+pct+"%";
      el3.style.color = pct>0?"#D97706":"#16A34A";
    }
    // Update label dynamically
    if (el3label) el3label.textContent = `Change ${minYear}→${maxYear}`;
  }

})();