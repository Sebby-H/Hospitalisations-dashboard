// ═══════════════════════════════════════════════
// histogram.js — Age Group Distribution
// Data: data/demographics_age.csv
// ═══════════════════════════════════════════════

(function () {

  const CONTAINER_ID = "chart-histogram";
  const AGE_ORDER    = ["0-7","8-16","17-25","26-39","40-64","65-74","75+"];
  const BAR_COLORS   = { all: "#66C2A5", Male: "#2563A8", Female: "#E78AC3" };

  const tooltip = createTooltip();

  // ── Load data (cache handled by scatterplot) ─
  d3.csv("data/demographics_age.csv").then(function (rawData) {
    rawData.forEach(d => {
      d.year             = +d.year;
      d.hospitalisations = +d.hospitalisations;
    });
    // Only cache if scatterplot hasn't already
    if (!dataCache.demographics) dataCache.demographics = rawData;
    drawChart(rawData, "all");
  }).catch(() => {
    document.getElementById(CONTAINER_ID).innerHTML =
      `<p style="color:#64748B;padding:1rem;">⚠️ Could not load data/demographics_age.csv — use Live Server.</p>`;
  });

  // ── Expose update function ───────────────────
  window.updateHistogram = function(filteredData, gender) {
    drawChart(filteredData, gender || "all");
  };

  // ── Draw chart ───────────────────────────────
  function drawChart(data, gender) {
    if (!data || data.length === 0) return;

    // Aggregate by age group
    const byAge = d3.rollups(
      data, v => d3.sum(v, d => d.hospitalisations), d => d.age_group
    ).map(([age_group, total]) => ({ age_group, total }))
     .sort((a,b) => AGE_ORDER.indexOf(a.age_group) - AGE_ORDER.indexOf(b.age_group));

    const container = document.getElementById(CONTAINER_ID);
    const totalW = container.clientWidth || 600;
    const totalH = 380;
    const margin = { top: 30, right: 30, bottom: 60, left: 70 };
    const width  = totalW - margin.left - margin.right;
    const height = totalH - margin.top  - margin.bottom;

    d3.select(`#${CONTAINER_ID}`).select("svg").remove();
    const svg = d3.select(`#${CONTAINER_ID}`)
      .append("svg").attr("width",totalW).attr("height",totalH);
    const g = svg.append("g")
      .attr("transform",`translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(AGE_ORDER).range([0, width]).padding(0.08);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(byAge, d => d.total) * 1.1])
      .range([height, 0]);

    const barColor = BAR_COLORS[gender] || BAR_COLORS.all;

    // Grid
    g.append("g").call(
      d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat("")
    ).call(gEl => {
      gEl.select(".domain").remove();
      gEl.selectAll(".tick line").attr("stroke","#E2E8F0").attr("stroke-dasharray","3,3");
    });

    // Bars
    g.selectAll(".bar").data(byAge).join("rect")
      .attr("class","bar")
      .attr("x", d => xScale(d.age_group))
      .attr("y", d => yScale(d.total))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - yScale(d.total))
      .attr("fill", barColor).attr("fill-opacity", 0.85)
      .style("cursor","pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill-opacity",1);
        showTooltip(tooltip, event,
          `<strong>Age: ${d.age_group}</strong><br/>Hospitalisations: ${formatComma(d.total)}`);
      })
      .on("mousemove", function(event) {
        tooltip.style("left",(event.pageX+14)+"px").style("top",(event.pageY-28)+"px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill-opacity",0.85);
        hideTooltip(tooltip);
      });

    // Value labels
    g.selectAll(".bar-label").data(byAge).join("text")
      .attr("class","bar-label")
      .attr("x", d => xScale(d.age_group) + xScale.bandwidth()/2)
      .attr("y", d => yScale(d.total)-6)
      .attr("text-anchor","middle").attr("font-size","10px")
      .attr("font-family","'DM Sans',sans-serif").attr("fill","#64748B")
      .text(d => d3.format(".2s")(d.total).replace("k","K"));

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

    // Gender label
    const label = gender==="all" ? "All genders" : gender==="Male" ? "Male only" : "Female only";
    g.append("text").attr("x",width).attr("y",-10)
      .attr("text-anchor","end").attr("font-size","11px")
      .attr("font-family","'DM Sans',sans-serif")
      .attr("fill",barColor).attr("font-weight","600").text(label);
  }

})();
