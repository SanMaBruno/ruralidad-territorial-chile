/**
 * main.js — Mapa bivariado de Chile (plantilla genérica)
 *
 * ✏️ CONFIGURACIÓN: Editar la sección CONFIG más abajo para adaptar
 * a tu dataset. El resto del código no necesita cambios.
 */

import { bivariateClassify } from "./bivariate.js";
import { drawLegend } from "./legend.js";
import { initTooltip, showTooltip, hideTooltip } from "./tooltip.js";

// =====================================================================
// ✏️ CONFIG — Editar aquí para adaptar al nuevo dataset
// =====================================================================
const CONFIG = {
  // Archivos de datos
  topoURL: "data/chile_adm1.topojson",
  dataURL: "data/chile_data.csv",

  // Columna de join entre CSV y TopoJSON
  idKey: "shapeID",

  // Columnas numéricas del CSV para clasificación bivariada
  varA: "x",    // eje X (intensidad / nivel)
  varB: "y",    // eje Y (cambio / dirección)

  // Columna del nombre de región en el CSV
  nameKey: "name",

  // Etiquetas para la leyenda
  legendLabelA: "Variable A →",
  legendLabelB: "↑ Variable B",

  // Texto en esquinas de la leyenda
  legendCornerLow: "Bajo A, baja B",
  legendCornerHigh: "Alto A, sube B",

  // Tooltip
  tooltipLabelA: "Variable A",
  tooltipLabelB: "Variable B",
  tooltipUnitA: "%",       // "%" | "pp" | "" etc.
  tooltipUnitB: "pp",      // "%" | "pp" | "" etc.
  tooltipKeySig: null,     // columna de significancia (null = no mostrar)
  tooltipLabelSig: "Significancia 95%",

  // Meta footer
  metaLabel: "Chile",
  metaUnitA: "%",
  metaUnitB: "pp"
};
// =====================================================================

function fmt1(value) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(Number(value));
}

async function init() {
  const [topo, csvRaw] = await Promise.all([
    d3.json(CONFIG.topoURL),
    d3.csv(CONFIG.dataURL, d3.autoType)
  ]);

  if (!topo?.objects) throw new Error("TopoJSON inválido o vacío");
  if (!csvRaw?.length) throw new Error("CSV vacío o no accesible");

  const objectKey = Object.keys(topo.objects)[0];
  const geojson = topojson.feature(topo, topo.objects[objectKey]);

  if (!geojson?.features?.length) {
    throw new Error("No se pudieron extraer features del TopoJSON");
  }

  const cols = Object.keys(csvRaw[0]);
  if (!cols.includes(CONFIG.idKey)) {
    throw new Error(`Falta columna '${CONFIG.idKey}' en CSV`);
  }
  if (!cols.includes(CONFIG.varA) || !cols.includes(CONFIG.varB)) {
    throw new Error(`Faltan columnas '${CONFIG.varA}' y '${CONFIG.varB}' en CSV`);
  }

  const { breaksA, breaksB, classified } = bivariateClassify(csvRaw, CONFIG.varA, CONFIG.varB);
  const dataMap = new Map(classified.map(d => [String(d[CONFIG.idKey]), d]));

  // --- Render SVG ---
  const container = document.getElementById("map");
  container.innerHTML = "";

  const wrapper = container.closest(".map-wrapper");
  const rect = wrapper.getBoundingClientRect();

  const width = Math.max(360, Math.floor(rect.width || 420));
  const height = Math.max(760, Math.floor(window.innerHeight * 0.82));

  const svg = d3.select("#map")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%");

  const padding = 20;

  const projection = d3.geoMercator()
    .fitExtent(
      [[padding, padding], [width - padding, height - padding]],
      geojson
    );

  // Ajuste fino para Chile (mapa largo y angosto)
  const escalaActual = projection.scale();
  const [tx, ty] = projection.translate();

  projection
    .scale(escalaActual * 1.40)
    .translate([tx - 18, ty - 170]);

  const path = d3.geoPath(projection);

  // --- Tooltip ---
  initTooltip({
    keyA: CONFIG.varA,
    keyB: CONFIG.varB,
    keySig: CONFIG.tooltipKeySig,
    labelA: CONFIG.tooltipLabelA,
    labelB: CONFIG.tooltipLabelB,
    labelSig: CONFIG.tooltipLabelSig,
    unitA: CONFIG.tooltipUnitA,
    unitB: CONFIG.tooltipUnitB,
    nameKey: CONFIG.nameKey
  });

  // --- Regiones ---
  svg.append("g")
    .attr("class", "regions")
    .selectAll("path")
    .data(geojson.features)
    .join("path")
    .attr("d", path)
    .attr("fill-rule", "evenodd")
    .attr("clip-rule", "evenodd")
    .attr("fill", d => {
      const key = String(d.properties[CONFIG.idKey]);
      const record = dataMap.get(key);
      return record ? record.color : "#ddd8ce";
    })
    .attr("stroke", "#eae6de")
    .attr("stroke-width", 0.8)
    .attr("class", d => {
      const key = String(d.properties[CONFIG.idKey]);
      const record = dataMap.get(key);
      return record ? `region cell-${record.classA}-${record.classB}` : "region no-data";
    })
    .on("mouseenter", (event, d) => {
      const key = String(d.properties[CONFIG.idKey]);
      const record = dataMap.get(key);
      if (!record) return;

      d3.select(event.currentTarget)
        .attr("stroke", "#2a2a2a")
        .attr("stroke-width", 1.5);

      showTooltip(event, record);
    })
    .on("mousemove", (event, d) => {
      const key = String(d.properties[CONFIG.idKey]);
      const record = dataMap.get(key);
      if (record) showTooltip(event, record);
    })
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget)
        .attr("stroke", "#eae6de")
        .attr("stroke-width", 0.8);
      hideTooltip();
    });

  // --- Leyenda ---
  drawLegend("#legend", {
    labelA: CONFIG.legendLabelA,
    labelB: CONFIG.legendLabelB,
    onCellHover(classA, classB) {
      svg.selectAll(".region")
        .transition()
        .duration(120)
        .style("opacity", function () {
          return this.classList.contains(`cell-${classA}-${classB}`) ? 1 : 0.18;
        });
    },
    onCellLeave() {
      svg.selectAll(".region")
        .transition()
        .duration(120)
        .style("opacity", 1);
    }
  });

  // --- Insight automático ---
  const mayorA = classified.reduce((a, b) => b[CONFIG.varA] > a[CONFIG.varA] ? b : a);
  const menorA = classified.reduce((a, b) => b[CONFIG.varA] < a[CONFIG.varA] ? b : a);
  const mayorMejora = classified.reduce((a, b) => b[CONFIG.varB] < a[CONFIG.varB] ? b : a);
  const mayorDeterioro = classified.reduce((a, b) => b[CONFIG.varB] > a[CONFIG.varB] ? b : a);

  document.getElementById("insight").innerHTML =
    `Se analizaron ${classified.length} regiones. ` +
    `El mayor nivel de la variable A se observa en <strong>${mayorA[CONFIG.nameKey]}</strong> ` +
    `(${fmt1(mayorA[CONFIG.varA])}${CONFIG.metaUnitA}), mientras que <strong>${menorA[CONFIG.nameKey]}</strong> registra el nivel más bajo ` +
    `(${fmt1(menorA[CONFIG.varA])}${CONFIG.metaUnitA}). ` +
    `La mayor reducción de B se presenta en <strong>${mayorMejora[CONFIG.nameKey]}</strong> ` +
    `(${fmt1(mayorMejora[CONFIG.varB])} ${CONFIG.metaUnitB}). ` +
    `El mayor aumento corresponde a <strong>${mayorDeterioro[CONFIG.nameKey]}</strong> ` +
    `(+${fmt1(mayorDeterioro[CONFIG.varB])} ${CONFIG.metaUnitB}).`;

  // --- Meta ---
  const meta = document.getElementById("meta");
  if (meta) {
    meta.textContent =
      `${classified.length} regiones · ${CONFIG.metaLabel} · Var A: ${breaksA.map(b => fmt1(b)).join(", ")}${CONFIG.metaUnitA} · Var B: ${breaksB.map(b => fmt1(b)).join(", ")} ${CONFIG.metaUnitB}`;
  }
}

init().catch(err => {
  console.error(err);
  document.getElementById("map").innerHTML =
    `<p class="error" style="color:#c24e80">Error: ${err.message}</p>`;
});
