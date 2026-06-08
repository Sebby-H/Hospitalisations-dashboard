// ═══════════════════════════════════════════════
// linechart.js — National Hospitalisation Trend
// Data: data/road_user_annual.csv
// Tab:  Trend — multi-line by road user type
// ═══════════════════════════════════════════════

(function () {

  const CONTAINER_ID = "chart-linechart";

  const ROAD_USERS = ["Driver","Passenger","Motorcyclist","Cyclist","Pedestrian"];

  // ColorBrewer Set2 palette — one colour per road user
  const COLOR = d3.scaleOrdinal()
    .domain(ROAD_USERS)
    .range(["#2563A8","#FC8D62","#8DA0CB","#66C2A5","#E78AC3"]);

  const tooltip = createTooltip();

  // ── Load & cache data ────────────────────────
  d3.csv("data/road_user_annual.csv").then(function (rawData) {
    rawData.forEach(d => {
      d.year             = +d.year;
      d.hospitalisations = +d.hospitalisations;
    });
    dataCache.roadUser = rawData;
    drawChart(rawData, ROAD_USERS);
  }).catch(() => {
    document.getElementById(CONTAINER_ID).innerHTML =
      `<p style="color:#64748B;padding:1rem;">⚠️ Could not load data/road_user_annual.csv — use Live Server.</p>`;
  });

  // ── Expose update function ───────────────────
  // Called by applyFilters() in shared.js
  window.updateLinechart = function(filteredData, activeRoadUsers) {
    // filteredData is year-filtered national data
    // activeRoadUsers comes from filterState.roadUsers
    const users = (activeRoadUsers && !activeRoadUsers.includes("all"))
      ? activeRoadUsers
      : ROAD_USERS;

    // Re-filter road_user_annual by year range
    const { yearFrom, yearTo } = filterState;
    const data = (dataCache.roadUser || []).filter(d =>
      d.year >= yearFrom && d.year <= yearTo
    );
    drawChart(data, users);
  };

  // ── Draw chart ───────────────────────────────
  function drawChart(data, activeUsers) {
    if (!data || data.length === 0) return;

    // Group data by road user
    const nested = d3.group(data, d => d.road_user);

    const container = document.getElementById(CONTAINER_ID);
    const totalW = container.clientWidth || 800;
    const totalH = 420;
    const margin = { top: 30, right: 140, bottom: 60, left: 80 };
    const width  = totalW - margin.left - margin.right;
    const height = totalH - margin.top  - margin.bottom;

    d3.select(`#${CONTAINER_ID}`).select("svg").remove();

    const svg = d3.select(`#${CONTAINER_ID}`)
      .append("svg").attr("width", totalW).attr("height", totalH);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ── Scales ──────────────────────────────────
    const years  = [...new Set(data.map(d => d.year))].sort();
    const xScale = d3.scaleLinear()
      .domain([d3.min(years), d3.max(years)])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.hospitalisations) * 1.1])
      .range([height, 0]);

    // ── Grid lines ──────────────────────────────
    g.append("g").call(
      d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat("")
    ).call(gEl => {
      gEl.select(".domain").remove();
      gEl.selectAll(".tick line")
        .attr("stroke","#E2E8F0").attr("stroke-dasharray","3,3");
    });

    // ── Lines + dots per road user ───────────────
    const lineGen = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.hospitalisations))
      .curve(d3.curveMonotoneX);

    ROAD_USERS.forEach(user => {
      const userData = nested.get(user) || [];
      const isActive = activeUsers.includes(user);
      const color    = COLOR(user);

      if (userData.length === 0) return;

      // Line
      g.append("path")
        .datum(userData)
        .attr("class", `line-${user.replace(/\s/g,"-")}`)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", isActive ? 2.5 : 1)
        .attr("opacity", isActive ? 1 : 0.15)
        .attr("d", lineGen);

      // Dots
      g.selectAll(`.dot-${user}`)
        .data(userData)
        .join("circle")
          .attr("class", `dot-${user}`)
          .attr("cx", d => xScale(d.year))
          .attr("cy", d => yScale(d.hospitalisations))
          .attr("r", isActive ? 4 : 2)
          .attr("fill", color)
          .attr("stroke", "white")
          .attr("stroke-width", 1.5)
          .attr("opacity", isActive ? 1 : 0.15)
          .style("cursor", isActive ? "pointer" : "default")
          .on("mouseover", function(event, d) {
            if (!activeUsers.includes(user)) return;
            d3.select(this).attr("r", 6);
            showTooltip(tooltip, event,
              `<strong>${user} · ${d.year}</strong><br/>
               Hospitalisations: ${formatComma(d.hospitalisations)}`);
          })
          .on("mousemove", function(event) {
            tooltip.style("left",(event.pageX+14)+"px")
                   .style("top",(event.pageY-28)+"px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("r", isActive ? 4 : 2);
            hideTooltip(tooltip);
          });
    });

    // ── X axis ──────────────────────────────────
    const xAxis = g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(years.length)
        .tickFormat(d3.format("d")));
    xAxis.select(".domain").attr("stroke","#CBD5E1");
    xAxis.selectAll(".tick line").attr("stroke","#E2E8F0");
    xAxis.selectAll("text")
      .attr("font-family","'DM Sans',sans-serif")
      .attr("font-size","11px").attr("fill","#64748B");
    g.append("text")
      .attr("x", width/2).attr("y", height+46)
      .attr("text-anchor","middle").attr("font-size","11px")
      .attr("font-family","'DM Sans',sans-serif")
      .attr("fill","#64748B").text("Year");

    // ── Y axis ──────────────────────────────────
    const yAxis = g.append("g").call(
      d3.axisLeft(yScale).ticks(5)
        .tickFormat(d => d3.format(".2s")(d).replace("k","K")));
    yAxis.select(".domain").attr("stroke","#CBD5E1");
    yAxis.selectAll("text")
      .attr("font-family","'DM Sans',sans-serif")
      .attr("font-size","11px").attr("fill","#64748B");
    g.append("text")
      .attr("transform","rotate(-90)")
      .attr("x",-height/2).attr("y",-62)
      .attr("text-anchor","middle").attr("font-size","11px")
      .attr("font-family","'DM Sans',sans-serif")
      .attr("fill","#64748B").text("Hospitalisations");

    // ── Legend ──────────────────────────────────
    const legend = g.append("g")
      .attr("transform", `translate(${width+16}, 0)`);

    ROAD_USERS.forEach((user, i) => {
      const isActive = activeUsers.includes(user);
      const ly = i * 28;

      legend.append("line")
        .attr("x1", 0).attr("x2", 18)
        .attr("y1", ly+7).attr("y2", ly+7)
        .attr("stroke", COLOR(user))
        .attr("stroke-width", 2.5)
        .attr("opacity", isActive ? 1 : 0.3);

      legend.append("circle")
        .attr("cx", 9).attr("cy", ly+7).attr("r", 4)
        .attr("fill", COLOR(user))
        .attr("opacity", isActive ? 1 : 0.3);

      legend.append("text")
        .attr("x", 24).attr("y", ly+11)
        .attr("font-size","11px")
        .attr("font-family","'DM Sans',sans-serif")
        .attr("fill", isActive ? "#1E293B" : "#94A3B8")
        .text(user);
    });
  }

})();