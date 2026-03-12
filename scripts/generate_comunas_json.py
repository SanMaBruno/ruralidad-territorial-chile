#!/usr/bin/env python3
"""
Genera chile_comunas.json y chile_data_agg.csv con comunas agrupadas por región,
separando Rural, Mixta y Urbana.
"""
import csv, json, os
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

REGION_TO_SHAPEID = {
    "Región de Arica y Parinacota": "47653553B1207481020383",
    "Región de Tarapacá": "47653553B97418467345315",
    "Región de Antofagasta": "47653553B40993810137393",
    "Región de Atacama": "47653553B71653813080592",
    "Región de Coquimbo": "47653553B91907313612474",
    "Región de Valparaíso": "47653553B5611469222723",
    "Región Metropolitana de Santiago": "47653553B78904739401519",
    "Región del Libertador General Bernardo O\u2019Higgins": "47653553B66141875659978",
    "Región del Maule": "47653553B65340542415201",
    "Región de Ñuble": "47653553B32293817275864",
    "Región del Biobío": "47653553B66835736668351",
    "Región de La Araucanía": "47653553B84299910343297",
    "Región de Los Ríos": "47653553B67595840047202",
    "Región de Los Lagos": "47653553B69224850096491",
    "Región de Aysén del General Carlos Ibáñez del Campo": "47653553B77266651052380",
    "Región de Magallanes y de la Antártica Chilena": "47653553B86325292267162",
}

SHORT_NAMES = {
    "Región de Arica y Parinacota": "Arica y Parinacota",
    "Región de Tarapacá": "Tarapacá",
    "Región de Antofagasta": "Antofagasta",
    "Región de Atacama": "Atacama",
    "Región de Coquimbo": "Coquimbo",
    "Región de Valparaíso": "Valparaíso",
    "Región Metropolitana de Santiago": "Metropolitana",
    "Región del Libertador General Bernardo O\u2019Higgins": "O'Higgins",
    "Región del Maule": "Maule",
    "Región de Ñuble": "Ñuble",
    "Región del Biobío": "Biobío",
    "Región de La Araucanía": "La Araucanía",
    "Región de Los Ríos": "Los Ríos",
    "Región de Los Lagos": "Los Lagos",
    "Región de Aysén del General Carlos Ibáñez del Campo": "Aysén",
    "Región de Magallanes y de la Antártica Chilena": "Magallanes",
}

TOTAL_COMUNAS = {
    "Región de Arica y Parinacota": 4,
    "Región de Tarapacá": 7,
    "Región de Antofagasta": 9,
    "Región de Atacama": 9,
    "Región de Coquimbo": 15,
    "Región de Valparaíso": 38,
    "Región Metropolitana de Santiago": 52,
    "Región del Libertador General Bernardo O\u2019Higgins": 33,
    "Región del Maule": 30,
    "Región de Ñuble": 21,
    "Región del Biobío": 33,
    "Región de La Araucanía": 32,
    "Región de Los Ríos": 12,
    "Región de Los Lagos": 30,
    "Región de Aysén del General Carlos Ibáñez del Campo": 10,
    "Región de Magallanes y de la Antártica Chilena": 11,
}

def main():
    src = os.path.join(DATA_DIR, 'chile_data.csv')
    with open(src, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Group communes by region and tipologia
    rurales = defaultdict(list)
    mixtas = defaultdict(list)
    for r in rows:
        region = r['region']
        comuna = r['comuna']
        tip = r['tipologia'].strip()
        if tip == 'Rural':
            rurales[region].append(comuna)
        elif tip == 'Mixta':
            mixtas[region].append(comuna)

    result = {}
    agg_rows = []
    for region, sid in REGION_TO_SHAPEID.items():
        total = TOTAL_COMUNAS[region]
        cr = sorted(rurales.get(region, []))
        cm = sorted(mixtas.get(region, []))
        n_rural = len(cr)
        n_mixta = len(cm)
        n_urban = total - n_rural - n_mixta
        pct_rural = round(100 * n_rural / total, 1)
        pct_rural_mixta = round(100 * (n_rural + n_mixta) / total, 1)

        result[sid] = {
            "name": SHORT_NAMES[region],
            "region_full": region,
            "comunas_rurales": cr,
            "comunas_mixtas": cm,
            "n_rural": n_rural,
            "n_mixta": n_mixta,
            "n_total": total,
            "n_urban": n_urban,
            "pct_rural": pct_rural,
            "pct_rural_mixta": pct_rural_mixta,
        }

        agg_rows.append({
            "shapeID": sid,
            "name": SHORT_NAMES[region],
            "comunas_rurales": n_rural,
            "comunas_mixtas": n_mixta,
            "comunas_totales": total,
            "pct_rural": pct_rural,
            "pct_rural_mixta": pct_rural_mixta,
        })

    # Write JSON
    out_json = os.path.join(DATA_DIR, 'chile_comunas.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    # Write aggregated CSV
    out_csv = os.path.join(DATA_DIR, 'chile_data_agg.csv')
    with open(out_csv, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=["shapeID", "name", "comunas_rurales", "comunas_mixtas", "comunas_totales", "pct_rural", "pct_rural_mixta"])
        w.writeheader()
        w.writerows(agg_rows)

    total_rural = sum(v['n_rural'] for v in result.values())
    total_mixta = sum(v['n_mixta'] for v in result.values())
    total_all = sum(v['n_total'] for v in result.values())
    print(f"✅ Generado: {out_json}")
    print(f"   {len(result)} regiones, {total_rural} rurales, {total_mixta} mixtas, {total_all - total_rural - total_mixta} urbanas, {total_all} totales")
    print(f"✅ Generado: {out_csv}")

if __name__ == '__main__':
    main()
