/**
 * choropleth.js — Escala de color secuencial para ruralidad
 *
 * Paleta terrosa: arena cálida → verde bosque profundo
 * Temática "rural" natural, compatible con fondo warm gray.
 */

const COLOR_RANGE = [
  "#e2d4b7",   // arena pálido  — baja ruralidad
  "#c6be8e",   // trigo dorado
  "#8aab7a",   // salvia / verde suave
  "#4d8c5c",   // verde medio
  "#1a5c3a"    // bosque profundo — alta ruralidad
];

/**
 * Crea un interpolador suave entre los colores de la paleta.
 * @param {number} t  Valor normalizado 0..1
 */
function interpolateRural(t) {
  const n = COLOR_RANGE.length - 1;
  const i = Math.min(Math.floor(t * n), n - 1);
  const local = (t * n) - i;
  return d3.interpolateLab(COLOR_RANGE[i], COLOR_RANGE[i + 1])(local);
}

/**
 * Devuelve el color para un porcentaje de ruralidad (0–100).
 */
function colorScale(pct) {
  const t = Math.max(0, Math.min(1, (pct - 15) / 85));   // dominio ~15%–100%
  return interpolateRural(t);
}

export { colorScale, interpolateRural, COLOR_RANGE };
