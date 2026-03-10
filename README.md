# Ruralidad Territorial Chile — Mapa bivariado

Plantilla de visualización bivariada de Chile basada en el proyecto
[chile-bivariate-regional-map](../README.md).

## Estructura

```
ruralidad-territorial-chile/
├── index.html          ← página principal
├── css/style.css       ← estilos (mismos colores y layout)
├── js/
│   ├── main.js         ← ✏️ CONFIG aquí (etiquetas, columnas, unidades)
│   ├── bivariate.js    ← clasificación bivariada 3×3 (teal × magenta)
│   ├── legend.js       ← leyenda matricial
│   └── tooltip.js      ← tooltip configurable
├── data/
│   ├── chile_adm1.topojson  ← mapa ADM1 de Chile
│   └── chile_data.csv       ← ✏️ TU DATASET AQUÍ (placeholder)
└── scripts/                 ← scripts de procesamiento
```

## Cómo adaptar al nuevo dataset

1. **Preparar el CSV** (`data/chile_data.csv`):
   - Debe tener una columna `shapeID` que coincida con el TopoJSON.
   - Debe tener una columna `name` con el nombre de la región.
   - Debe tener columnas `x` (variable A, eje horizontal) e `y` (variable B, eje vertical).
   - Puedes agregar columnas adicionales (el tooltip las puede mostrar).

2. **Editar la configuración** en `js/main.js` → objeto `CONFIG`:
   - `legendLabelA` / `legendLabelB`: etiquetas de los ejes de la leyenda.
   - `tooltipLabelA` / `tooltipLabelB`: etiquetas en el tooltip.
   - `tooltipUnitA` / `tooltipUnitB`: unidades (`%`, `pp`, etc.).
   - `tooltipKeySig`: columna de significancia (o `null` para no mostrar).

3. **Editar textos** en `index.html`:
   - Título y subtítulo (`<h1>`, `.subtitle`).
   - Sección "Cómo leer este mapa".
   - Footer con fuentes.

## Ejecución

Servir con cualquier servidor local:

```bash
npx serve .
# o
python3 -m http.server 8000
```

## Paleta y simbología

Idéntica al proyecto original:
- **Teal** → variable B disminuye (positivo)
- **Magenta** → variable B aumenta (alerta)
- **Intensidad** → nivel de variable A (claro = bajo, oscuro = alto)
