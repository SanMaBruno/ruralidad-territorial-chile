/**
 * main.js — Radiografía de la Ruralidad Territorial en Chile
 * CENSO 2024 — Visualización interactiva
 *
 * Choropleth sequencial + explorador de comunas por región
 */

import { colorScale, COLOR_RANGE } from "./choropleth.js";
import { drawLegend } from "./legend.js";
import { initTooltip, showTooltip, hideTooltip } from "./tooltip.js";
import { initPanel, openPanel, closePanel } from "./panel.js";

/* ── Config ─────────────────────────────────────────── */
const TOPO_URL  = "data/chile_adm1.topojson";
const DATA_URL  = "data/chile_data_agg.csv";
const COMUNAS_URL = "data/chile_comunas.json";
const ID_KEY    = "shapeID";

/* ── State ──────────────────────────────────────────── */
let selectedId = null;
let svgRef = null;

/* ── Helpers ────────────────────────────────────────── */
function fmtPct(v) {
  return new Intl.NumberFormat("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(v));
}

/* ── Animated counter ───────────────────────────────── */
function animateValue(el, end, duration = 1200, suffix = "") {
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);          // easeOutCubic
    el.textContent = Math.round(start + (end - start) * ease) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── Region selection ───────────────────────────────── */
function selectRegion(id, comunasData) {
  if (selectedId === id) {
    selectedId = null;
    closePanel();
    resetMapHighlight();
    return;
  }
  selectedId = id;
  highlightRegion(id);
  openPanel(comunasData[id]);
}

function highlightRegion(id) {
  if (!svgRef) return;
  svgRef.selectAll(".region")
    .transition().duration(200)
    .style("opacity", function () {
      return this.dataset.sid === id ? 1 : 0.3;
    })
    .attr("stroke", function () {
      return this.dataset.sid === id ? "#2a2a2a" : "#c8c3b8";
    })
    .attr("stroke-width", function () {
      return this.dataset.sid === id ? 2 : 0.5;
    });
}

function resetMapHighlight() {
  if (!svgRef) return;
  svgRef.selectAll(".region")
    .transition().duration(200)
    .style("opacity", 1)
    .attr("stroke", "#c8c3b8")
    .attr("stroke-width", 0.6);
}

/* ── Sidebar: region cards ──────────────────────────── */
function renderRegionCards(dataMap, comunasData) {
  const container = document.getElementById("region-list");
  if (!container) return;

  // Sort by pct_rural descending
  const sorted = [...dataMap.values()].sort((a, b) => b.pct_rural - a.pct_rural);

  sorted.forEach((d, i) => {
    const card = document.createElement("button");
    card.className = "region-card";
    card.dataset.sid = d[ID_KEY];
    card.style.animationDelay = `${i * 40}ms`;

    const pct = d.pct_rural;
    const color = colorScale(pct);

    card.innerHTML = `
      <div class="rc-color" style="background:${color}"></div>
      <div class="rc-body">
        <span class="rc-name">${d.name}</span>
        <span class="rc-stat">${d.comunas_rurales}r · ${d.comunas_mixtas || 0}m · ${d.comunas_totales}t · ${fmtPct(pct)}%</span>
      </div>
      <svg class="rc-bar" viewBox="0 0 60 6">
        <rect x="0" y="0" width="60" height="6" rx="3" fill="#ddd8ce"/>
        <rect x="0" y="0" width="${pct * 0.6}" height="6" rx="3" fill="${color}"
              class="rc-fill" style="transition:width .5s ease ${i * 40}ms"/>
      </svg>
    `;

    card.addEventListener("click", () => selectRegion(d[ID_KEY], comunasData));
    container.appendChild(card);
  });
}

/* ── Init ───────────────────────────────────────────── */
async function init() {
  const [topo, csvRaw, comunasData] = await Promise.all([
    d3.json(TOPO_URL),
    d3.csv(DATA_URL, d3.autoType),
    d3.json(COMUNAS_URL)
  ]);

  if (!topo?.objects) throw new Error("TopoJSON inválido");
  if (!csvRaw?.length) throw new Error("CSV vacío");

  const objectKey = Object.keys(topo.objects)[0];
  const geojson   = topojson.feature(topo, topo.objects[objectKey]);

  // Build lookup
  const dataMap = new Map(csvRaw.map(d => [String(d[ID_KEY]), d]));

  // National stats
  const totalRural = csvRaw.reduce((s, d) => s + d.comunas_rurales, 0);
  const totalMixta = csvRaw.reduce((s, d) => s + (d.comunas_mixtas || 0), 0);
  const totalAll   = csvRaw.reduce((s, d) => s + d.comunas_totales, 0);
  const totalUrban = totalAll - totalRural - totalMixta;
  const pctNat     = (100 * totalRural / totalAll);

  // Animate hero counters
  animateValue(document.getElementById("cnt-rural"), totalRural);
  animateValue(document.getElementById("cnt-mixta"), totalMixta);
  animateValue(document.getElementById("cnt-urban"), totalUrban);
  animateValue(document.getElementById("cnt-total"), totalAll);
  animateValue(document.getElementById("cnt-pct"), Math.round(pctNat), 1200, "%");

  // ── SVG Map ──
  const container = document.getElementById("map");
  container.innerHTML = "";
  const wrapper = container.closest(".map-wrapper");
  const rect    = wrapper.getBoundingClientRect();

  const width  = Math.max(360, Math.floor(rect.width || 480));
  const height = Math.max(700, Math.floor(rect.height || window.innerHeight * 0.75));

  /* ← PARÁMETRO: sube el divisor para más chico, bájalo para más grande */
  const vbWidth = Math.round(width / 1.3);

  const svg = d3.select("#map")
    .append("svg")
    .attr("viewBox", `0 0 ${vbWidth} ${height}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .style("width", "100%")
    .style("height", "100%");

  svgRef = svg;

  const padding = 20;
  const projection = d3.geoMercator()
    .fitExtent([[padding, padding], [vbWidth - padding, height - padding]], geojson);

  const path = d3.geoPath(projection);

  // ── Tooltip ──
  initTooltip();

  // ── Draw regions ──
  svg.append("g").attr("class", "regions")
    .selectAll("path")
    .data(geojson.features)
    .join("path")
      .attr("d", path)
      .attr("fill-rule", "evenodd")
      .attr("clip-rule", "evenodd")
      .each(function (d) {
        const sid = String(d.properties[ID_KEY]);
        const rec = dataMap.get(sid);
        this.dataset.sid = sid;
        d3.select(this)
          .attr("fill", rec ? colorScale(rec.pct_rural) : "#ddd8ce")
          .attr("stroke", "#c8c3b8")
          .attr("stroke-width", 0.6)
          .attr("class", rec ? "region" : "region no-data");
      })
      .on("mouseenter", function (event, d) {
        const sid = String(d.properties[ID_KEY]);
        const rec = dataMap.get(sid);
        if (!rec) return;
        if (selectedId && selectedId !== sid) return;
        d3.select(this).attr("stroke", "#2a2a2a").attr("stroke-width", 1.8);
        showTooltip(event, rec, comunasData[sid]);
      })
      .on("mousemove", function (event, d) {
        const sid = String(d.properties[ID_KEY]);
        const rec = dataMap.get(sid);
        if (rec) showTooltip(event, rec, comunasData[sid]);
      })
      .on("mouseleave", function () {
        if (selectedId && selectedId !== this.dataset.sid) return;
        if (!selectedId) {
          d3.select(this).attr("stroke", "#c8c3b8").attr("stroke-width", 0.6);
        }
        hideTooltip();
      })
      .on("click", function (event, d) {
        const sid = String(d.properties[ID_KEY]);
        if (dataMap.has(sid)) selectRegion(sid, comunasData);
      });

  // ── Legend ──
  drawLegend("#legend", csvRaw.map(d => d.pct_rural));

  // ── Sidebar region cards ──
  renderRegionCards(dataMap, comunasData);

  // ── Panel ──
  initPanel(() => {
    selectedId = null;
    resetMapHighlight();
  });

  // ── Insight ──
  const mayorPct  = csvRaw.reduce((a, b) => b.pct_rural > a.pct_rural ? b : a);
  const menorPct  = csvRaw.reduce((a, b) => b.pct_rural < a.pct_rural ? b : a);
  const mayorN    = csvRaw.reduce((a, b) => b.comunas_rurales > a.comunas_rurales ? b : a);

  document.getElementById("insight").innerHTML =
    `De las <strong>${totalAll}</strong> comunas de Chile, <strong>${totalRural}</strong> son clasificadas como rurales (${fmtPct(pctNat)}%). ` +
    `<strong>${mayorPct.name}</strong> lidera en proporción de ruralidad (${fmtPct(mayorPct.pct_rural)}%), ` +
    `mientras <strong>${menorPct.name}</strong> registra la menor (${fmtPct(menorPct.pct_rural)}%). ` +
    `La región con más comunas rurales es <strong>${mayorN.name}</strong> (${mayorN.comunas_rurales}).`;

  // ── Footer meta ──
  const meta = document.getElementById("meta");
  if (meta) {
    meta.textContent = `${csvRaw.length} regiones · ${totalRural} comunas rurales · ${totalUrban} urbanas · CENSO 2024`;
  }
}

init().catch(err => {
  console.error(err);
  document.getElementById("map").innerHTML =
    `<p style="color:#c24e80;padding:2rem">Error: ${err.message}</p>`;
});
