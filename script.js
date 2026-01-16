(async function () {
  // ===== DATA & STATE =====
  const DATA_URL = "./data/heart.csv";
  let rawData = [];
  let filteredData = [];
  
  // UI State
  let state = {
    sexParam: "All",
    ageMin: 20,
    ageMax: 80,
    xVar: "age",
    yVar: "chol",
    targetSel: null,
    scatterBrush: null,
    selectedPatients: new Set(),
    brushActive: false
  };

  const scatterVars = ["age", "trestbps", "chol", "thalach", "oldpeak", "ca"];
  
  // Color schemes
  const outcomeColors = {
    "Heart disease": "#e15759",
    "No heart disease": "#4e79a7"
  };

  // ===== DATA LOADING & PROCESSING =====
  async function loadData() {
    const csv = await d3.csv(DATA_URL);
    
    rawData = csv.map((d, i) => ({
      age: +d.age,
      sex: d.sex === "Male" ? 1 : 0,
      sex_label: d.sex,
      trestbps: +d.trestbps,
      chol: +d.chol,
      thalach: +d.thalch, // Note: CSV uses 'thalch'
      oldpeak: +d.oldpeak,
      ca: (d.ca === "" || d.ca === "?") ? null : +d.ca,
      num: +d.num,
      target: +d.num > 0 ? 1 : 0,
      target_label: +d.num > 0 ? "Heart disease" : "No heart disease",
      cp: d.cp,
      fbs: d.fbs,
      restecg: d.restecg,
      exang: d.exang,
      slope: d.slope,
      thal: d.thal,
      pid: d.id ? +d.id : i + 1
    }));
  }

  function applyFilters() {
    filteredData = rawData.filter(d => {
      // Sex filter
      if (state.sexParam !== "All" && d.sex_label !== state.sexParam) return false;
      // Age filter
      if (d.age < state.ageMin || d.age > state.ageMax) return false;
      // Target filter
      if (state.targetSel && d.target_label !== state.targetSel) return false;
      return true;
    });
  }

  // ===== UI CONTROLS =====
  function createControls() {
    const controls = d3.select("#controls");
    controls.style("padding", "10px 0 20px 0")
      .style("border-bottom", "1px solid rgba(255,255,255,0.08)")
      .style("margin-bottom", "20px");

    const row1 = controls.append("div").style("margin-bottom", "15px");
    const row2 = controls.append("div");

    // Sex dropdown
    row1.append("label")
      .style("color", "#a8b3cf")
      .style("margin-right", "10px")
      .text("Sex: ");
    
    const sexSelect = row1.append("select")
      .style("margin-right", "30px")
      .on("change", function() {
        state.sexParam = this.value;
        update();
      });
    
    ["All", "Male", "Female"].forEach(opt => {
      sexSelect.append("option").text(opt).attr("value", opt);
    });

    // Age min slider
    row1.append("label")
      .style("color", "#a8b3cf")
      .style("margin-right", "10px")
      .text("Age min: ");
    
    row1.append("input")
      .attr("type", "range")
      .attr("min", 20)
      .attr("max", 80)
      .attr("value", 20)
      .style("margin-right", "10px")
      .on("input", function() {
        state.ageMin = +this.value;
        ageMinLabel.text(this.value);
        update();
      });
    
    const ageMinLabel = row1.append("span")
      .style("color", "#a8b3cf")
      .style("margin-right", "30px")
      .text("20");

    // Age max slider
    row1.append("label")
      .style("color", "#a8b3cf")
      .style("margin-right", "10px")
      .text("Age max: ");
    
    row1.append("input")
      .attr("type", "range")
      .attr("min", 20)
      .attr("max", 80)
      .attr("value", 80)
      .style("margin-right", "10px")
      .on("input", function() {
        state.ageMax = +this.value;
        ageMaxLabel.text(this.value);
        update();
      });
    
    const ageMaxLabel = row1.append("span")
      .style("color", "#a8b3cf")
      .text("80");

    // Scatter X dropdown
    row2.append("label")
      .style("color", "#a8b3cf")
      .style("margin-right", "10px")
      .text("Scatter X: ");
    
    const xSelect = row2.append("select")
      .style("margin-right", "30px")
      .on("change", function() {
        state.xVar = this.value;
        drawScatter();
      });
    
    scatterVars.forEach(v => {
      xSelect.append("option").text(v).attr("value", v).property("selected", v === "age");
    });

    // Scatter Y dropdown
    row2.append("label")
      .style("color", "#a8b3cf")
      .style("margin-right", "10px")
      .text("Scatter Y: ");
    
    const ySelect = row2.append("select")
      .style("margin-right", "30px")
      .on("change", function() {
        state.yVar = this.value;
        drawScatter();
      });
    
    scatterVars.forEach(v => {
      ySelect.append("option").text(v).attr("value", v).property("selected", v === "chol");
    });

    // Clear Selection button
    row2.append("button")
      .style("padding", "5px 15px")
      .style("background", "#e15759")
      .style("color", "#fff")
      .style("border", "none")
      .style("border-radius", "4px")
      .style("cursor", "pointer")
      .style("font-size", "12px")
      .text("Clear Selection")
      .on("click", function() {
        state.selectedPatients.clear();
        state.scatterBrush = null;
        state.brushActive = false;
        update();
      })
      .on("mouseover", function() {
        d3.select(this).style("background", "#c94d4f");
      })
      .on("mouseout", function() {
        d3.select(this).style("background", "#e15759");
      });
  }

  // ===== OUTCOME BAR CHART =====
  function drawOutcomeChart() {
    const container = d3.select("#outcome-chart");
    container.selectAll("*").remove();
    
    container.append("h3")
      .style("color", "#e8eefc")
      .style("font-size", "14px")
      .style("margin", "0 0 10px 0")
      .text("Outcome overview");

    const width = 360;
    const height = 180;
    const margin = {top: 10, right: 10, bottom: 30, left: 50};

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    const counts = d3.rollup(
      filteredData,
      v => v.length,
      d => d.target_label
    );

    const data = Array.from(counts, ([key, value]) => ({label: key, count: value}));

    const x = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Bars
    svg.selectAll("rect")
      .data(data)
      .join("rect")
        .attr("x", d => x(d.label))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.count))
        .attr("fill", d => outcomeColors[d.label])
        .attr("opacity", d => state.targetSel === null || state.targetSel === d.label ? 1 : 0.35)
        .attr("rx", 3)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
          if (state.targetSel === d.label) {
            state.targetSel = null;
          } else {
            state.targetSel = d.label;
          }
          update();
        })
        .append("title")
        .text(d => `${d.label}: ${d.count}`);

    // X axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("fill", "#a8b3cf");

    // Y axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#a8b3cf");

    svg.selectAll(".domain, .tick line")
      .style("stroke", "rgba(255,255,255,0.08)");
  }

  // ===== FILTER STATUS =====
  function drawFilterStatus() {
    const container = d3.select("#filter-status");
    container.selectAll("*").remove();
    
    container.append("h3")
      .style("color", "#e8eefc")
      .style("font-size", "14px")
      .style("margin", "0 0 10px 0")
      .text("Current filters & interactions");

    const info = container.append("div")
      .style("padding", "20px")
      .style("color", "#a8b3cf")
      .style("font-size", "14px")
      .style("line-height", "1.8");

    info.append("div").text(`Sex: ${state.sexParam} | Age: ${state.ageMin}-${state.ageMax}`);
    info.append("div").text(`Outcome: ${state.targetSel || "(none selected)"}`);
    info.append("div").text(`Filtered N: ${filteredData.length}`);
    if (state.selectedPatients.size > 0) {
      info.append("div")
        .style("color", "#e8eefc")
        .style("font-weight", "bold")
        .text(`Selected for comparison: ${state.selectedPatients.size} patients`);
    }
  }

  // ===== HISTOGRAMS =====
  function drawHistograms() {
    const specs = [
      { id: "hist-age", field: "age", title: "Age" },
      { id: "hist-trestbps", field: "trestbps", title: "Resting BP (trestbps)" },
      { id: "hist-chol", field: "chol", title: "Cholesterol (chol)" },
      { id: "hist-thalach", field: "thalach", title: "Max HR (thalach)" }
    ];

    specs.forEach(spec => drawHistogram(spec.id, spec.field, spec.title));
  }

  function drawHistogram(containerId, field, title) {
    const container = d3.select(`#${containerId}`);
    container.selectAll("*").remove();
    
    container.append("h4")
      .style("color", "#e8eefc")
      .style("font-size", "12px")
      .style("margin", "0 0 5px 0")
      .text(title);

    const width = 250;
    const height = 180;
    const margin = {top: 10, right: 10, bottom: 30, left: 40};

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    // Use selected patients if any, otherwise use filtered data
    const dataToShow = state.selectedPatients.size > 0
      ? filteredData.filter(d => state.selectedPatients.has(d.pid))
      : filteredData;

    // Create bins
    const values = dataToShow.map(d => d[field]).filter(v => v != null);
    const bins = d3.bin()
      .domain(d3.extent(filteredData.map(d => d[field]).filter(v => v != null)))
      .thresholds(18)(values);

    // Group by outcome
    const binnedData = bins.map(bin => {
      const inBin = dataToShow.filter(d => d[field] >= bin.x0 && d[field] < bin.x1);
      const byOutcome = d3.rollup(inBin, v => v.length, d => d.target_label);
      return {
        x0: bin.x0,
        x1: bin.x1,
        patients: inBin,
        groups: Array.from(byOutcome, ([key, value]) => ({outcome: key, count: value}))
      };
    });

    const x = d3.scaleLinear()
      .domain([d3.min(bins, d => d.x0), d3.max(bins, d => d.x1)])
      .range([margin.left, width - margin.right]);

    const maxCount = d3.max(binnedData, d => d3.sum(d.groups, g => g.count));
    const y = d3.scaleLinear()
      .domain([0, maxCount])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Create tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "histogram-tooltip")
      .style("position", "absolute")
      .style("background", "#1e2732")
      .style("color", "#e8eefc")
      .style("padding", "10px")
      .style("border-radius", "4px")
      .style("border", "1px solid rgba(255,255,255,0.2)")
      .style("font-size", "11px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000)
      .style("max-height", "400px")
      .style("overflow-y", "auto");

    // Draw stacked bars
    binnedData.forEach(bin => {
      let yOffset = 0;
      bin.groups.forEach(g => {
        svg.append("rect")
          .attr("x", x(bin.x0))
          .attr("y", y(yOffset + g.count))
          .attr("width", x(bin.x1) - x(bin.x0) - 1)
          .attr("height", y(yOffset) - y(yOffset + g.count))
          .attr("fill", outcomeColors[g.outcome])
          .attr("opacity", 0.75)
          .style("cursor", "pointer")
          .on("mouseover", function(event) {
            d3.select(this).attr("opacity", 1);
            
            let html = `<strong>${field}: ${bin.x0.toFixed(1)} - ${bin.x1.toFixed(1)}</strong><br>`;
            html += `<strong>${g.outcome}</strong>: ${g.count} patients<br><br>`;
            
            const patientsInGroup = bin.patients.filter(p => p.target_label === g.outcome);
            if (patientsInGroup.length > 0 && patientsInGroup.length <= 10) {
              html += `<div style="max-height: 300px; overflow-y: auto;">`;
              patientsInGroup.forEach(p => {
                html += `<div style="margin-bottom: 8px; padding: 5px; background: rgba(255,255,255,0.05); border-radius: 3px;">`;
                html += `<strong>Patient ${p.pid}</strong><br>`;
                html += `Age: ${p.age}, Sex: ${p.sex_label}<br>`;
                html += `BP: ${p.trestbps}, Chol: ${p.chol}<br>`;
                html += `Max HR: ${p.thalach}`;
                html += `</div>`;
              });
              html += `</div>`;
            } else if (patientsInGroup.length > 10) {
              html += `<em>(${patientsInGroup.length} patients - too many to display)</em>`;
            }
            
            tooltip.html(html)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 10) + "px")
              .style("opacity", 1);
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.75);
            tooltip.style("opacity", 0);
          });
        yOffset += g.count;
      });
    });

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
      .style("fill", "#a8b3cf");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("fill", "#a8b3cf");

    svg.selectAll(".domain, .tick line")
      .style("stroke", "rgba(255,255,255,0.08)");
  }

  // ===== SCATTERPLOT =====
  function drawScatter() {
    const container = d3.select("#scatter-chart");
    container.selectAll("*").remove();
    
    container.append("h3")
      .style("color", "#e8eefc")
      .style("font-size", "14px")
      .style("margin", "0 0 10px 0")
      .text("Relationship view (scatter, brush & select)");

    const width = 520;
    const height = 420;
    const margin = {top: 10, right: 120, bottom: 40, left: 50};

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    const xField = state.xVar;
    const yField = state.yVar;

    const xExtent = d3.extent(filteredData, d => d[xField]);
    const yExtent = d3.extent(filteredData, d => d[yField]);

    const x = d3.scaleLinear()
      .domain(xExtent)
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain(yExtent)
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Brush
    const brush = d3.brush()
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .on("end", brushed);

    svg.append("g")
      .attr("class", "brush")
      .call(brush);

    // Points
    const points = svg.append("g")
      .selectAll("circle")
      .data(filteredData)
      .join("circle")
        .attr("cx", d => x(d[xField]))
        .attr("cy", d => y(d[yField]))
        .attr("r", 5)
        .attr("fill", d => outcomeColors[d.target_label])
        .attr("opacity", 1)
        .attr("stroke", d => state.selectedPatients.has(d.pid) ? "#ffffff" : "none")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
          event.stopPropagation();
          state.brushActive = false;
          if (state.selectedPatients.has(d.pid)) {
            state.selectedPatients.delete(d.pid);
          } else {
            if (state.selectedPatients.size < 6) {
              state.selectedPatients.add(d.pid);
            }
          }
          drawScatter();
          drawHistograms();
          drawPatientDetails();
        })
        .append("title")
        .text(d => `Patient ${d.pid}\n${d.target_label}\nAge: ${d.age}\n${xField}: ${d[xField]}\n${yField}: ${d[yField]}`);

    function brushed({selection}) {
      if (!selection) {
        state.scatterBrush = null;
        state.selectedPatients.clear();
        state.brushActive = false;
        drawScatter();
        drawHistograms();
        drawPatientDetails();
        return;
      }
      
      state.scatterBrush = selection;
      state.selectedPatients.clear();
      state.brushActive = true;
      
      const [[x0, y0], [x1, y1]] = selection;
      filteredData.forEach(d => {
        const cx = x(d[xField]);
        const cy = y(d[yField]);
        if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) {
          state.selectedPatients.add(d.pid);
        }
      });
      
      drawScatter();
      drawHistograms();
      drawPatientDetails();
    }

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("fill", "#a8b3cf");

    svg.append("text")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .style("fill", "#a8b3cf")
      .style("font-size", "12px")
      .text(xField);

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#a8b3cf");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(margin.top + height - margin.bottom) / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("fill", "#a8b3cf")
      .style("font-size", "12px")
      .text(yField);

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);

    Object.entries(outcomeColors).forEach(([label, color], i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color);

      legend.append("text")
        .attr("x", 18)
        .attr("y", i * 20 + 10)
        .style("fill", "#a8b3cf")
        .style("font-size", "11px")
        .text(label);
    });

    svg.selectAll(".domain, .tick line")
      .style("stroke", "rgba(255,255,255,0.08)");
  }

  // ===== PATIENT DETAILS =====
  function drawPatientDetails() {
    const container = d3.select("#patient-details");
    container.selectAll("*").remove();
    
    container.append("h3")
      .style("color", "#e8eefc")
      .style("font-size", "14px")
      .style("margin", "0 0 10px 0")
      .text("Patient details (selected patients for comparison)");

    // Only show patient details if brush is NOT active (i.e., individual clicks only)
    if (state.brushActive) {
      container.append("p")
        .style("color", "#a8b3cf")
        .style("padding", "20px")
        .text("Click individual points (not brush) to compare patients in detail.");
      return;
    }

    if (state.selectedPatients.size === 0) {
      container.append("p")
        .style("color", "#a8b3cf")
        .style("padding", "20px")
        .text("Click points in the scatterplot to select patients for comparison (max 6).");
      return;
    }

    const allSelectedData = filteredData.filter(d => state.selectedPatients.has(d.pid));
    const selectedData = allSelectedData.slice(0, 6);

    const attributes = [
      "sex_label", "age", "cp", "trestbps", "chol", "fbs", "restecg",
      "thalach", "exang", "oldpeak", "slope", "ca", "thal", "target_label"
    ];

    const table = container.append("table")
      .style("width", "100%")
      .style("border-collapse", "collapse")
      .style("color", "#e8eefc")
      .style("font-size", "12px");

    const thead = table.append("thead");
    const headerRow = thead.append("tr");
    headerRow.append("th")
      .style("text-align", "left")
      .style("padding", "8px")
      .style("border-bottom", "1px solid rgba(255,255,255,0.08)")
      .text("Attribute");

    selectedData.forEach(d => {
      headerRow.append("th")
        .style("text-align", "center")
        .style("padding", "8px")
        .style("border-bottom", "1px solid rgba(255,255,255,0.08)")
        .text(`Patient ${d.pid}`);
    });

    const tbody = table.append("tbody");
    attributes.forEach(attr => {
      const row = tbody.append("tr");
      row.append("td")
        .style("padding", "8px")
        .style("border-bottom", "1px solid rgba(255,255,255,0.04)")
        .style("color", "#a8b3cf")
        .text(attr);

      selectedData.forEach(d => {
        row.append("td")
          .style("text-align", "center")
          .style("padding", "8px")
          .style("border-bottom", "1px solid rgba(255,255,255,0.04)")
          .text(d[attr] ?? "N/A");
      });
    });
  }

  // ===== UPDATE ALL VIEWS =====
  function update() {
    applyFilters();
    drawOutcomeChart();
    drawFilterStatus();
    drawHistograms();
    drawScatter();
    drawPatientDetails();
  }

  // ===== INITIALIZATION =====
  await loadData();
  createControls();
  applyFilters();
  
  drawOutcomeChart();
  drawFilterStatus();
  drawHistograms();
  drawScatter();
  drawPatientDetails();
})();
