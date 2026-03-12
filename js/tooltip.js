/**
 * tooltip.js — Tooltip enriquecido para mapa de ruralidad Chile
 *
 * Muestra nombre de región, breakdown rural/urbano con barra visual,
 * y las primeras comunas rurales de la región.
 */

import { colorScale } from "./choropleth.js";

let tooltipEl = null;

export function initTooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.className = "tooltip";
    document.body.appendChild(tooltipEl);
  }
}

export function showTooltip(event, datum, comunasInfo) {
  if (!tooltipEl) return;

  const name      = datum.name || "Región";
  const nRural    = datum.comunas_rurales;
  const nMixta    = datum.comunas_mixtas || 0;
  const nTotal    = datum.comunas_totales;
  const nUrban    = nTotal - nRural - nMixta;
  const pct       = datum.pct_rural;
  const color     = colorScale(pct);
  const comunasR  = comunasInfo?.comunas_rurales || [];
  const comunasM  = comunasInfo?.comunas_mixtas || [];
  const previewR  = comunasR.slice(0, 3);
  const previewM  = comunasM.slice(0, 3);
  const remainR   = comunasR.length - previewR.length;
  const remainM   = comunasM.length - previewM.length;

  const ruralList = previewR.map(c =>
    `<span class="tt-comuna">${c}</span>`
  ).join("") + (remainR > 0 ? `<span class="tt-more">+${remainR} más</span>` : "");

  const mixtaList = previewM.map(c =>
    `<span class="tt-comuna tt-mixta">${c}</span>`
  ).join("") + (remainM > 0 ? `<span class="tt-more">+${remainM} más</span>` : "");

  tooltipEl.innerHTML = `
    <div class="tooltip-card">
      <div class="tooltip-title">${name}</div>
      <div class="tt-bar-wrap">
        <div class="tt-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="tooltip-row">
        <span>Comunas rurales</span>
        <strong>${nRural}</strong>
      </div>
      <div class="tooltip-row">
        <span>Comunas mixtas</span>
        <strong>${nMixta}</strong>
      </div>
      <div class="tooltip-row">
        <span>Comunas urbanas</span>
        <strong>${nUrban}</strong>
      </div>
      <div class="tooltip-row">
        <span>Ruralidad</span>
        <strong>${pct}%</strong>
      </div>
      ${comunasR.length ? `<div class="tt-comunas">${ruralList}</div>` : ""}
      ${comunasM.length ? `<div class="tt-comunas">${mixtaList}</div>` : ""}
      <div class="tt-hint">Clic para ver todas las comunas</div>
    </div>
  `;

  const offset = 14;
  const x = event.clientX + offset;
  const y = event.clientY + offset;
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top  = `${y}px`;
  tooltipEl.style.opacity = "1";
}

export function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.style.opacity = "0";
}
