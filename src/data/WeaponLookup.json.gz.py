import os
import sys
import gzip
import json
import ijson

# -------------------------
# Config
# -------------------------
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
    weaponName = skillList.split(".")[0].split("_")[-1]
    with gzip.open(path, "rb") as f:
        row_map[weaponName] = []
        parser = ijson.kvitems(f, "item.Rows")
        for rowname, rowdata in parser:

            uid = dbUID.get(rowname)
            if uid is None:
                continue

            row_map[weaponName].append(uid)

# -------------------------
# Write compressed JSON to stdout
# -------------------------
#sys.stdout.buffer.write(json.dumps(row_map, ensure_ascii=False).encode("utf-8")) #Non Compressed for views
with gzip.GzipFile(fileobj=sys.stdout.buffer, mode="w") as f:
    f.write(json.dumps(row_map, ensure_ascii=False).encode("utf-8"))
