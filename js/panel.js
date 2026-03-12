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

  const { name, comunas_rurales, comunas_mixtas = [], n_rural, n_mixta = 0, n_total, n_urban, pct_rural } = regionData;
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

  // Urban footer
  document.getElementById("panel-urban-note").textContent =
    n_urban > 0
      ? `+ ${n_urban} comuna${n_urban > 1 ? "s" : ""} urbana${n_urban > 1 ? "s" : ""}`
      : "Todas las comunas son rurales o mixtas";

  // Open
  panelEl.classList.add("open");
}
