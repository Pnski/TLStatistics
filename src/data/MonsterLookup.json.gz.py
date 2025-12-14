import os
import sys
import gzip
import json
import ijson

# -------------------------
# Config
# -------------------------
LANGS = ['de','en','fr','ja','ko','pt','zh-Hant','es-419']
LOCA_PATH = "src/static/Locres/"
TABL_PATH = "src/static/Tables/"

# -------------------------
# Load localization tables
# -------------------------
localizations = { lang: {} for lang in LANGS }
for lang in LANGS:
    path = f"{LOCA_PATH}{lang}-Game.json.gz"
    print(f"Loading localization: {path}", file=sys.stderr)
    with gzip.open(path, "rb") as f:
        for key, val in ijson.kvitems(f, "TLNpcRace"):
            localizations[lang][key] = val
    with gzip.open(path, "rb") as f:
        for key, val in ijson.kvitems(f, "TLStringContents"):
            localizations[lang][key] = val
    with gzip.open(path, "rb") as f:
        for key, val in ijson.kvitems(f, "TLMapIcon"):
            localizations[lang][key] = val

# -------------------------
# Build row map
# -------------------------
row_map = {}

with gzip.open(f"{TABL_PATH}TLNpcRace.gz", "rb") as f:
    parser = ijson.kvitems(f, "item.Rows")
    for rowname, rowdata in parser:
        
        key = rowdata.get("NpcName",{}).get("Key")
        if key in row_map or key is None:
            continue

        icon = rowdata.get("NpcPortrait", {}).get("AssetPathName")

        # Build the row dict
        row = {
            "key": key,
            "IconPath": icon
        }

        # Add localizations
        for lang in LANGS:
            row[lang] = localizations[lang].get(key, None)

        row_map[key] = row

# -------------------------
# Write compressed JSON to stdout
# -------------------------
#sys.stdout.buffer.write(json.dumps(row_map, ensure_ascii=False).encode("utf-8")) #Non Compressed for views
with gzip.GzipFile(fileobj=sys.stdout.buffer, mode="w") as f:
    f.write(json.dumps(row_map, ensure_ascii=False).encode("utf-8"))

print(f"Total rows: {len(row_map)}", file=sys.stderr)