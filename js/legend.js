/**
 * legend.js — Leyenda de gradiente continuo para ruralidad
 *
 * Barra horizontal con gradiente arena → verde bosque,
 * etiquetas de porcentaje y marcadores por región.
 */

import { colorScale, COLOR_RANGE } from "./choropleth.js";

const W = 180;
const H = 12;

function drawLegend(selector, pctValues) {
  const container = d3.select(selector);
  container.selectAll("*").remove();

  const margin = { top: 8, right: 8, bottom: 32, left: 8 };
  const w = W + margin.left + margin.right;
  const h = H + margin.top + margin.bottom + 24;

  const svg = container.append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("class", "gradient-legend");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title
  g.append("text")
    .attr("x", 0).attr("y", -2)
    .attr("class", "legend-label")
    .text("% RURALIDAD");

  // Gradient bar
  const defs = svg.append("defs");
  const grad = defs.append("linearGradient")
    .attr("id", "rural-grad")
    .attr("x1", "0%").attr("x2", "100%");

  COLOR_RANGE.forEach((c, i) => {
    grad.append("stop")
      .attr("offset", `${(i / (COLOR_RANGE.length - 1)) * 100}%`)
      .attr("stop-color", c);
  });

  g.append("rect")
    .attr("y", 8)
    .attr("width", W)
    .attr("height", H)
    .attr("rx", 3)
    .attr("fill", "url(#rural-grad)");

  // Tick labels
  const ticks = [20, 40, 60, 80, 100];
  const scale = d3.scaleLinear().domain([15, 100]).range([0, W]);

  ticks.forEach(t => {
    const x = scale(t);
    g.append("line")
      .attr("x1", x).attr("x2", x)
      .attr("y1", 8 + H).attr("y2", 8 + H + 4)
      .attr("stroke", "#9a9488").attr("stroke-width", 0.8);
    g.append("text")
      .attr("x", x).attr("y", 8 + H + 14)
      .attr("text-anchor", "middle")
      .attr("class", "legend-tick")
      .text(`${t}%`);
  });

  // No data
  const ndY = 8 + H + 24;
  g.append("rect")
    .attr("x", 0).attr("y", ndY)
    .attr("width", 10).attr("height", 10).attr("rx", 2)
    .attr("fill", "#ddd8ce").attr("stroke", "#cdc8be").attr("stroke-width", 0.5);
  g.append("text")
    .attr("x", 14).attr("y", ndY + 9)
    .attr("class", "legend-tick")
    .text("Sin datos");

  return svg;
}

export { drawLegend };
