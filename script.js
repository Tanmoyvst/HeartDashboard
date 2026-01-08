(async function () {
  // Data columns expected (typical UCI/Kaggle heart dataset):
  // age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, target

  // Dataset file served by this project
  const DATA_URL = "./data/heart.csv";

  // Variables available in the scatter X/Y dropdowns
  const scatterVars = [
    "age", "trestbps", "chol", "thalach", "oldpeak", "ca"
  ];

  const vlSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "Linked multivariate heart disease dashboard (A3).",
    background: "#121a26",
    padding: 10,
    data: { url: DATA_URL },

    // Global UI controls (filters)
    params: [
      {
        name: "sexParam",
        value: "All",
        bind: {
          input: "select",
          name: "Sex: ",
          options: ["All", "Male", "Female"]
        }
      },
      {
        name: "ageMin",
        value: 20,
        bind: { input: "range", name: "Age min: ", min: 20, max: 80, step: 1 }
      },
      {
        name: "ageMax",
        value: 80,
        bind: { input: "range", name: "Age max: ", min: 20, max: 80, step: 1 }
      },

      // Scatter dropdowns
      {
        name: "xVar",
        value: "age",
        bind: { input: "select", name: "Scatter X: ", options: scatterVars }
      },
      {
        name: "yVar",
        value: "chol",
        bind: { input: "select", name: "Scatter Y: ", options: scatterVars }
      }
    ],

    // Normalize the UCI CSV columns + apply global filters (sex + age + targetSel)
    transform: [
      // Coerce / normalize fields into the names used throughout the spec
      { calculate: "toNumber(datum.age)", as: "age" },
      // Original CSV: sex is 'Male'/'Female'
      { calculate: "datum.sex === 'Male' ? 1 : (datum.sex === 'Female' ? 0 : null)", as: "sex" },
      { calculate: "datum.sex === 'Male' ? 'Male' : (datum.sex === 'Female' ? 'Female' : 'Unknown')", as: "sex_label" },

      { calculate: "toNumber(datum.trestbps)", as: "trestbps" },
      { calculate: "toNumber(datum.chol)", as: "chol" },
      // Original CSV uses 'thalch' (no second 'a')
      { calculate: "toNumber(datum.thalch)", as: "thalach" },
      { calculate: "toNumber(datum.oldpeak)", as: "oldpeak" },
      { calculate: "(datum.ca === '' || datum.ca === '?' || datum.ca == null) ? null : toNumber(datum.ca)", as: "ca" },

      // Original CSV: num is 0..4, treat >0 as heart disease
      { calculate: "toNumber(datum.num)", as: "num" },
      { calculate: "datum.num != null && toNumber(datum.num) > 0 ? 1 : 0", as: "target" },
      { calculate: "(datum.num != null && toNumber(datum.num) > 0) ? 'Heart disease' : 'No heart disease'", as: "target_label" },

      // Stable patient id (prefer id column if present)
      { calculate: "datum.id != null && datum.id !== '' ? toNumber(datum.id) : null", as: "pid" },
      { window: [{ op: "row_number", as: "pid_fallback" }] },
      { calculate: "datum.pid != null ? datum.pid : datum.pid_fallback", as: "pid" },

      // Sex filter
      {
        filter:
          "sexParam === 'All' || datum.sex_label === sexParam"
      },
      // Age range filter
      {
        filter:
          "datum.age >= ageMin && datum.age <= ageMax"
      },
      // Note: the outcome filter (targetSel) is applied inside linked views.
    ],

    // Layout: top (overview) + middle (small multiples + scatter) + bottom (details)
    vconcat: [
      // ---------------------------
      // Row 1: Outcome overview
      // ---------------------------
      {
        hconcat: [
          {
            width: 360,
            height: 180,
            title: { text: "Outcome overview", color: "#e8eefc" },
            params: [
              {
                name: "targetSel",
                select: { type: "point", fields: ["target_label"], on: "click", clear: "dblclick" }
              }
            ],
            mark: { type: "bar", cornerRadiusTopLeft: 3, cornerRadiusTopRight: 3 },
            encoding: {
              x: {
                field: "target_label",
                type: "nominal",
                axis: { labelColor: "#a8b3cf", title: null }
              },
              y: {
                aggregate: "count",
                type: "quantitative",
                axis: { labelColor: "#a8b3cf", title: "Patients" }
              },
              color: {
                field: "target_label",
                type: "nominal",
                legend: null
              },
              opacity: {
                condition: { param: "targetSel", value: 1 },
                value: 0.35
              },
              tooltip: [
                { field: "target_label", type: "nominal", title: "Outcome" },
                { aggregate: "count", type: "quantitative", title: "Count" }
              ]
            }
          },

          // A small “status” text panel for current filters
          {
            width: 760,
            height: 180,
            title: { text: "Current filters & interactions", color: "#e8eefc" },
            transform: [
              { filter: { param: "targetSel", empty: true } },
              { aggregate: [{ op: "count", as: "n" }] },
              {
                calculate:
                  "'Sex: ' + sexParam + ' | Age: ' + ageMin + '-' + ageMax",
                as: "filters_text"
              },
              {
                calculate:
                  "targetSel.target_label ? ('Outcome: ' + targetSel.target_label) : 'Outcome: (none selected)'",
                as: "outcome_text"
              }
            ],
            mark: { type: "text", align: "left", baseline: "top", dx: 10, dy: 10 },
            encoding: {
              text: {
                field: "filters_text",
                type: "nominal"
              },
              color: { value: "#a8b3cf" }
            },
            layer: [
              {
                mark: { type: "text", align: "left", baseline: "top", dx: 10, dy: 18, fontSize: 14 },
                encoding: { text: { field: "filters_text" }, color: { value: "#a8b3cf" } }
              },
              {
                mark: { type: "text", align: "left", baseline: "top", dx: 10, dy: 44, fontSize: 14 },
                encoding: { text: { field: "outcome_text" }, color: { value: "#a8b3cf" } }
              },
              {
                mark: { type: "text", align: "left", baseline: "top", dx: 10, dy: 70, fontSize: 14 },
                encoding: {
                  text: { field: "n", type: "quantitative", title: "Filtered N" },
                  color: { value: "#a8b3cf" }
                }
              }
            ]
          }
        ],
        spacing: 18
      },

      // ---------------------------
      // Row 2: Small multiples + Relationship view
      // ---------------------------
      {
        hconcat: [
          // Small multiples histograms (2x2)
          {
            title: { text: "Feature distributions (small multiples)", color: "#e8eefc" },
            transform: [
              { filter: { param: "targetSel", empty: true } }
            ],
            vconcat: [
              {
                hconcat: [
                  histogramSpec("age", "Age"),
                  histogramSpec("trestbps", "Resting BP (trestbps)")
                ],
                spacing: 14
              },
              {
                hconcat: [
                  histogramSpec("chol", "Cholesterol (chol)"),
                  histogramSpec("thalach", "Max HR (thalach)")
                ],
                spacing: 14
              }
            ],
            spacing: 14
          },

          // Relationship (scatter with x/y dropdown + brush + patient selection)
          {
            width: 520,
            height: 420,
            title: { text: "Relationship view (scatter, brush & select)", color: "#e8eefc" },
            transform: [
              { filter: { param: "targetSel", empty: true } }
            ],
            params: [
              {
                name: "scatterBrush",
                select: { type: "interval" }
              },
              {
                name: "patientSel",
                select: { type: "point", fields: ["pid"], on: "click", toggle: true, clear: "dblclick" }
              }
            ],
            mark: { type: "point", filled: true, size: 70 },
            encoding: {
              x: {
                field: { expr: "xVar" },
                type: "quantitative",
                title: { expr: "xVar" },
                axis: { labelColor: "#a8b3cf", titleColor: "#a8b3cf" }
              },
              y: {
                field: { expr: "yVar" },
                type: "quantitative",
                title: { expr: "yVar" },
                axis: { labelColor: "#a8b3cf", titleColor: "#a8b3cf" }
              },
              color: {
                field: "target_label",
                type: "nominal",
                title: "Outcome",
                legend: { labelColor: "#a8b3cf", titleColor: "#a8b3cf" }
              },
              opacity: {
                condition: [
                  { param: "scatterBrush", value: 1 },
                  { param: "patientSel", value: 1 }
                ],
                value: 0.25
              },
              stroke: {
                condition: { param: "patientSel", value: "#ffffff" },
                value: null
              },
              strokeWidth: {
                condition: { param: "patientSel", value: 2 },
                value: 0
              },
              tooltip: [
                { field: "pid", type: "quantitative", title: "Patient ID" },
                { field: "target_label", type: "nominal", title: "Outcome" },
                { field: "sex_label", type: "nominal", title: "Sex" },
                { field: "age", type: "quantitative", title: "Age" },
                { field: "trestbps", type: "quantitative", title: "trestbps" },
                { field: "chol", type: "quantitative", title: "chol" },
                { field: "thalach", type: "quantitative", title: "thalach" },
                { field: "oldpeak", type: "quantitative", title: "oldpeak" },
                { field: "ca", type: "quantitative", title: "ca" }
              ]
            }
          }
        ],
        spacing: 18
      },

      // ---------------------------
      // Row 3: Patient details (comparison)
      // ---------------------------
      {
        title: { text: "Patient details (selected patients for comparison)", color: "#e8eefc" },
        height: 260,
        transform: [
          { filter: { param: "targetSel", empty: true } },
          { filter: { param: "patientSel", empty: false } },
          // Only show up to 6 selected patients to keep it readable
          { window: [{ op: "rank", as: "r" }], sort: [{ field: "pid", order: "ascending" }] },
          { filter: "datum.r <= 6" },
          {
            fold: [
              "sex_label", "age", "cp", "trestbps", "chol", "fbs", "restecg",
              "thalach", "exang", "oldpeak", "slope", "ca", "thal", "target_label"
            ],
            as: ["attribute", "value"]
          }
        ],
        mark: "text",
        encoding: {
          y: {
            field: "attribute",
            type: "nominal",
            axis: { labelColor: "#a8b3cf", title: null }
          },
          x: {
            field: "pid",
            type: "nominal",
            axis: { labelColor: "#a8b3cf", title: "Selected Patient ID" }
          },
          text: { field: "value", type: "nominal" },
          color: { value: "#e8eefc" }
        }
      }
    ],

    config: {
      view: { stroke: "transparent" },
      axis: {
        grid: true,
        gridColor: "rgba(255,255,255,0.06)",
        domainColor: "rgba(255,255,255,0.08)",
        tickColor: "rgba(255,255,255,0.08)",
        labelFontSize: 11,
        titleFontSize: 12
      },
      legend: { labelFontSize: 11, titleFontSize: 12 }
    }
  };

  function histogramSpec(field, titleText) {
    return {
      width: 250,
      height: 180,
      title: { text: titleText, color: "#e8eefc", fontSize: 12 },
      mark: { type: "bar" },
      encoding: {
        x: {
          field,
          type: "quantitative",
          bin: { maxbins: 18 },
          axis: { labelColor: "#a8b3cf", title: null }
        },
        y: {
          aggregate: "count",
          type: "quantitative",
          axis: { labelColor: "#a8b3cf", title: "Count" }
        },
        color: {
          field: "target_label",
          type: "nominal",
          legend: null
        },
        opacity: {
          condition: { param: "scatterBrush", value: 1 },
          value: 0.75
        },
        tooltip: [
          { field, type: "quantitative", title: field },
          { aggregate: "count", type: "quantitative", title: "Count" },
          { field: "target_label", type: "nominal", title: "Outcome" }
        ]
      }
    };
  }

  // Render
  const embedOpts = { actions: false };
  await vegaEmbed("#vis", vlSpec, embedOpts);
})();
