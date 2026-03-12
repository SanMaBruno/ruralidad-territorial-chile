/**
 * panel.js — Panel lateral de detalle de comunas
 *
 * Se abre al hacer clic en una región del mapa.
 * Muestra breakdown rural/urbano + lista de comunas rurales con
 * animación escalonada (stagger).
 */

import { colorScale } from "./choropleth.js";

let panelEl  = null;
let onClose  = null;

export function initPanel(closeCb) {
  onClose = closeCb;
  panelEl = document.getElementById("detail-panel");
  if (!panelEl) return;

  document.getElementById("panel-close")
    ?.addEventListener("click", closePanel);
}

export function closePanel() {
  if (!panelEl) return;
  panelEl.classList.remove("open");
  onClose?.();
}

export function openPanel(regionData) {
  if (!panelEl || !regionData) return;

  const { name, comunas_rurales, comunas_mixtas = [], comunas_urbanas = [], n_rural, n_mixta = 0, n_total, n_urban, pct_rural } = regionData;
  const pctUrban = (100 * n_urban / n_total).toFixed(1);
  const pctMixta = (100 * n_mixta / n_total).toFixed(1);
  const color = colorScale(pct_rural);

  // Header
  document.getElementById("panel-region").textContent = name;
  document.getElementById("panel-subtitle").textContent =
    `${n_rural} rurales · ${n_mixta} mixtas · ${n_urban} urbanas · ${n_total} total`;

  // Stacked bar  
  const barRural = document.getElementById("bar-rural");
  const barUrban = document.getElementById("bar-urban");
  barRural.style.width = `${pct_rural}%`;
  barRural.style.background = color;
  barUrban.style.width = `${pctUrban}%`;

  document.getElementById("bar-label-rural").textContent = `${pct_rural}% rural`;
  document.getElementById("bar-label-urban").textContent = `${pctUrban}% urbana`;

  // Commune list
  const list = document.getElementById("panel-comunas");
  list.innerHTML = "";

  // Rural communes
  comunas_rurales.forEach((comuna, i) => {
    const li = document.createElement("li");
    li.className = "comuna-item";
    li.style.animationDelay = `${i * 25}ms`;
    li.innerHTML = `<span class="comuna-dot" style="background:${color}"></span>${comuna} <span class="comuna-tag rural">rural</span>`;
    list.appendChild(li);
  });

  // Mixta communes
  comunas_mixtas.forEach((comuna, i) => {
    const li = document.createElement("li");
    li.className = "comuna-item";
    li.style.animationDelay = `${(n_rural + i) * 25}ms`;
    li.innerHTML = `<span class="comuna-dot" style="background:#b8960c"></span>${comuna} <span class="comuna-tag mixta">mixta</span>`;
    list.appendChild(li);
  });

  // Urban communes
  comunas_urbanas.forEach((comuna, i) => {
    const li = document.createElement("li");
    li.className = "comuna-item";
    li.style.animationDelay = `${(n_rural + n_mixta + i) * 25}ms`;
    li.innerHTML = `<span class="comuna-dot" style="background:#c8c3b8"></span>${comuna} <span class="comuna-tag urbana">urbana</span>`;
    list.appendChild(li);
  });

  // Urban footer (hidden when all are listed)
  const urbanNote = document.getElementById("panel-urban-note");
  urbanNote.textContent = "";

  // Open
  panelEl.classList.add("open");
}
