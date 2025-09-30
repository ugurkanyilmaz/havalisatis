import argparse
import os
import sys
import json
import pandas as pd
import numpy as np

#!/usr/bin/env python3
# excel_tojson.py
# api_first.xlsx dosyasını JSON'a çevirir. Artık parent kategori yok, sadece child_category ve subchild_category var. Varsayılan olarak tüm sayfaları dönüştürür.


def df_to_records(df):
    # Eksik değerleri normalize et:
    # - pandas NaN -> None
    # - boş stringler kırpılır ve None yapılır
    # - numpy tipleri -> python native
    df = df.where(pd.notnull(df), None)
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
        df[col] = df[col].apply(lambda x: None if x == '' else x)

    records = []
    for row in df.to_dict(orient='records'):
        rec = {}
        for k, v in row.items():
            # numpy tiplerini dönüştür
            if isinstance(v, np.generic):
                val = v.item()
            else:
                val = v

            # img2, img3, img4 alanları eksikse None yap
            if k in ('img2', 'img3', 'img4') and (val is None or (isinstance(val, float) and np.isnan(val))):
                rec[k] = None
            else:
                rec[k] = val
        records.append(rec)
    return records

def excel_to_json(input_path, output_path=None, sheet=None, all_sheets=False):
    if not os.path.exists(input_path):
        print(f"Hata: '{input_path}' bulunamadı.", file=sys.stderr)
        sys.exit(1)

    if sheet:
        df = pd.read_excel(input_path, sheet_name=sheet)
        data = df_to_records(df)
    elif all_sheets:
        sheets = pd.read_excel(input_path, sheet_name=None)
        data = {name: df_to_records(df) for name, df in sheets.items()}
    else:
        df = pd.read_excel(input_path, sheet_name=0)
        data = df_to_records(df)

    if not output_path:
        base = os.path.splitext(input_path)[0]
        output_path = base + '.json'

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)

    print(f"JSON oluşturuldu: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Excel -> JSON (varsayılan: tüm sayfalar)")
    parser.add_argument('input', nargs='?', default='api_first.xlsx', help='Giriş Excel dosyası (varsayılan: api_first.xlsx)')
    parser.add_argument('-o', '--output', help='Çıkış JSON dosyası (varsayılan: aynı isim .json)')
    parser.add_argument('-s', '--sheet', help='Sadece belirtilen sayfayı dönüştür (isim veya 0-tabanlı indeks)')
    parser.add_argument('--all', action='store_true', help='Tüm sayfaları dönüştür')
    args = parser.parse_args()

    excel_to_json(
        input_path=args.input,
        output_path=args.output,
        sheet=args.sheet,
        all_sheets=args.all
    )

if __name__ == '__main__':
    main()