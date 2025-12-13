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
# Load TLSkill → UID lookup
# -------------------------
dbUID = {}
with gzip.open(TABL_PATH+"TLSkill.gz", "rb") as f:
    parser = ijson.kvitems(f, "item.Rows")
    for key, value in parser:
        dbUID[key] = value["UID"]

# -------------------------
# Load localization tables
# -------------------------
localizations = { lang: {} for lang in LANGS }
for lang in LANGS:
    path = f"{LOCA_PATH}{lang}-Game.json.gz"
    print(f"Loading localization: {path}", file=sys.stderr)
    with gzip.open(path, "rb") as f:
        for key, val in ijson.kvitems(f, "TLStringSkillDesc"):
            localizations[lang][key] = val

# -------------------------
# Build row map
# -------------------------
row_map = {}

# Weapon skill DBs
databases = [
    name for name in os.listdir(TABL_PATH)
    if name.startswith("TLSkillPcLooks_Weapon_")
]

for skillList in databases:
    path = f"{TABL_PATH}{skillList}"
    with gzip.open(path, "rb") as f:
        parser = ijson.kvitems(f, "item.Rows")
        for rowname, rowdata in parser:
            icon = rowdata.get("IconPath")
            if icon is None:
                continue

            uid = dbUID.get(rowname)
            if uid is None:
                continue

            key = rowdata["UIName"].get("Key")
            if key is None:
                continue

            # Build the row dict
            row = {
                "key": key,
                "IconPath": icon["AssetPathName"]
            }

            # Add localizations
            for lang in LANGS:
                row[lang] = localizations[lang].get(key, None)

            row_map[uid] = row

print(f"Total rows: {len(row_map)}", file=sys.stderr)

# -------------------------
# Write compressed JSON to stdout
# -------------------------
#sys.stdout.buffer.write(json.dumps(row_map, ensure_ascii=False).encode("utf-8")) #Non Compressed for views
with gzip.GzipFile(fileobj=sys.stdout.buffer, mode="w") as f:
    f.write(json.dumps(row_map, ensure_ascii=False).encode("utf-8"))
