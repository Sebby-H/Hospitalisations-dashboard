// ═══════════════════════════════════════════════
// scatterplot.js — Age Group vs Hospitalisations
// Data: data/demographics_age.csv
// ═══════════════════════════════════════════════

(function () {

  const CONTAINER_ID = "chart-scatterplot";
  const AGE_ORDER    = ["0-7","8-16","17-25","26-39","40-64","65-74","75+"];
  const COLOR        = { Male: "#2563A8", Female: "#E78AC3" };

  const tooltip = createTooltip();

  // ── Load & cache data ────────────────────────
  d3.csv("data/demographics_age.csv").then(function (rawData) {
    rawData.forEach(d => {
      d.year             = +d.year;
      d.hospitalisations = +d.hospitalisations;
    });
    dataCache.demographics = rawData;
    drawChart(rawData, "all");
  }).catch(() => {
    document.getElementById(CONTAINER_ID).innerHTML =
      `<p style="color:#64748B;padding:1rem;">⚠️ Could not load data/demographics_age.csv — use Live Server.</p>`;
  });

  // ── Expose update function ───────────────────
  window.updateScatterplot = function(filteredData, gender) {
    drawChart(filteredData, gender || "all");
  };

  // ── Draw chart ───────────────────────────────
  function drawChart(data, gender) {
    if (!data || data.length === 0) return;

    // Aggregate by age_group + sex
    const aggregated = d3.rollups(
      data, v => d3.sum(v, d => d.hospitalisations),
      d => d.age_group, d => d.sex
    ).flatMap(([age, sexArr]) =>
      sexArr.map(([sex, total]) => ({ age_group: age, sex, total }))
    );

    const grandTotal = d3.sum(aggregated, d => d.total);
    aggregated.forEach(d => d.proportion = d.total / grandTotal);

    const container = document.getElementById(CONTAINER_ID);
    const totalW = container.clientWidth || 600;
    const totalH = 380;
    const margin = { top: 30, right: 120, bottom: 60, left: 70 };
    const width  = totalW - margin.left - margin.right;
    const height = totalH - margin.top  - margin.bottom;

    d3.select(`#${CONTAINER_ID}`).select("svg").remove();
    const svg = d3.select(`#${CONTAINER_ID}`)
      .append("svg").attr("width",totalW).attr("height",totalH);
    const g = svg.append("g")
      .attr("transform",`translate(${margin.left},${margin.top})`);

    const xScale = d3.scalePoint()
      .domain(AGE_ORDER).range([0, width]).padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(aggregated, d => d.total) * 1.1])
      .range([height, 0]);

    const rScale = d3.scaleSqrt()
      .domain([0, d3.max(aggregated, d => d.proportion)])
      .range([5, 22]);

    // Grid
    g.append("g").call(
      d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat("")
    ).call(gEl => {
      gEl.select(".domain").remove();
      gEl.selectAll(".tick line").attr("stroke","#E2E8F0").attr("stroke-dasharray","3,3");
    });

    // Dots — Female first (behind), Male on top
    ["Female","Male"].forEach(sex => {
      const sexData = aggregated.filter(d => d.sex === sex);
      if (sexData.length === 0) return;
      g.selectAll(`.dot-${sex}`).data(sexData).join("circle")
        .attr("class",`dot dot-${sex}`)
        .attr("cx", d => xScale(d.age_group))
        .attr("cy", d => yScale(d.total))
        .attr("r",  d => rScale(d.proportion))
        .attr("fill", COLOR[sex]).attr("fill-opacity", 0.75)
        .attr("stroke","white").attr("stroke-width",1.5)
        .style("cursor","pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("fill-opacity",1).attr("stroke-width",2.5);
          showTooltip(tooltip, event,
            `<strong>${d.age_group} · ${d.sex}</strong><br/>
             Hospitalisations: ${formatComma(d.total)}<br/>
             Share: ${(d.proportion*100).toFixed(1)}%`);
        })
        .on("mousemove", function(event) {
          tooltip.style("left",(event.pageX+14)+"px").style("top",(event.pageY-28)+"px");
        })
        .on("mouseout", function() {
          d3.select(this).attr("fill-opacity",0.75).attr("stroke-width",1.5);
          hideTooltip(tooltip);
        });
    });

    // X axis
    const xAxis = g.append("g").attr("transform",`translate(0,${height})`)
      .call(d3.axisBottom(xScale));
    xAxis.select(".domain").attr("stroke","#CBD5E1");
    xAxis.selectAll(".tick line").remove();
    xAxis.selectAll("text").attr("font-family","'DM Sans',sans-serif")
      .attr("font-size","11px").attr("fill","#64748B");
    g.append("text").attr("x",width/2).attr("y",height+46)
      .attr("text-anchor","middle").attr("font-size","11px")
      .attr("font-family","'DM Sans',sans-serif").attr("fill","#64748B")
      .text("Age Group");

    // Y axis
    const yAxis = g.append("g").call(
      d3.axisLeft(yScale).ticks(5)
        .tickFormat(d => d3.format(".2s")(d).replace("k","K")));
    yAxis.select(".domain").attr("stroke","#CBD5E1");
    yAxis.selectAll("text").attr("font-family","'DM Sans',sans-serif")
      .attr("font-size","11px").attr("fill","#64748B");
    g.append("text").attr("transform","rotate(-90)")
      .attr("x",-height/2).attr("y",-55)
      .attr("text-anchor","middle").attr("font-size","11px")
      .attr("font-family","'DM Sans',sans-serif").attr("fill","#64748B")
      .text("Hospitalisations");

    // Legend
    const legend = g.append("g").attr("transform",`translate(${width+15},10)`);
    Object.entries(COLOR).forEach(([sex, color], i) => {
      legend.append("circle").attr("cx",7).attr("cy",i*24+7)
        .attr("r",7).attr("fill",color).attr("fill-opacity",0.75);
      legend.append("text").attr("x",18).attr("y",i*24+11)
        .attr("font-size","11px").attr("font-family","'DM Sans',sans-serif")
        .attr("fill","#1E293B").text(sex);
    });
    legend.append("text").attr("x",0).attr("y",68)
      .attr("font-size","10px").attr("font-family","'DM Sans',sans-serif")
      .attr("fill","#64748B").text("Dot size =");
    legend.append("text").attr("x",0).attr("y",80)
      .attr("font-size","10px").attr("font-family","'DM Sans',sans-serif")
      .attr("fill","#64748B").text("% of total");
  }

})();