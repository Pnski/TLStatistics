---
sql:
    stats: https://raw.githubusercontent.com/Pnski/TLStatistics/parquetUpload/allLogs.parquet
---

# Weapon Statistics

This is currently not finished, it will load a realy huge dataset and makes some rly huge stuff, tests currently take between 20s and 1min depending on browsercache!

This is over all logfile, so if you switch weapons it will currently break the logic, also there are some below zero's due to the exploits, might be corrected in future releases.

```js
import { uidToColor } from "./modules/uidToColor.js"


const stream = await FileAttachment("./data/WeaponLookup.json.gz").stream()
const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
const WeaponLookup = await new Response(decompressedStream).json();

const idsToDelete = new Set([
  981417584, // satelliteCopy
  979681846, // satellite
  953398015, // satellite trait 1
  953661231, // satellite copy trait 1
  980577268  // satellite passive
]);
WeaponLookup["Orb"] = WeaponLookup["Orb"].filter(id => !idsToDelete.has(id));

function imgFormat(iconPath) {
    const fileName = iconPath.split("/").pop().split(".").pop().replace("_Sprite","") + ".png";
    return `https://raw.githubusercontent.com/Pnski/TLStatistics/main/src/static/Image/Monster/${fileName}`;
}
```

```js
const weaponCases = Object.entries(WeaponLookup)
  .map(([weapon, ids]) =>
    `WHEN SkillId IN (${ids.join(",")}) THEN '${weapon}'`
  )
  .join("\n");
 const bossData = await sql([`
        WITH fights AS (
            SELECT
                SHA,
                DATE_DIFF(
                    'seconds',
                    MIN(Timestamp),
                    MAX(Timestamp)
                ) AS fightDuration
            FROM stats
            GROUP BY SHA
        ),
        damage_by_weapon AS (
            SELECT
                SHA,
                CASE
                    ${weaponCases}
                    ELSE 'UNKNOWN'
                END AS Weapon,
                SUM(Damage) AS total_damage
            FROM stats
            GROUP BY SHA, Weapon
        ),
        weapon_combo AS (
            SELECT
                SHA,
                STRING_AGG(DISTINCT Weapon, '/' ORDER BY Weapon) AS WeaponCombo,
                SUM(total_damage) AS total_damage
            FROM damage_by_weapon
            WHERE Weapon != 'UNKNOWN'
            GROUP BY SHA
        )
        SELECT
            wc.SHA,
            wc.WeaponCombo,
            wc.total_damage / NULLIF(f.fightDuration, 0) AS DPS
        FROM weapon_combo wc
        JOIN fights f
            ON wc.SHA = f.SHA
        ORDER BY wc.SHA;
    `]);
```

```js
view(Plot.plot({
        x: {
            label: "DPS",
            labelAnchor: "right",
        },
        y: {
            label: null
        },
        marks: [
            Plot.ruleX([0]),
            Plot.boxX(bossData, {
                x: "DPS",
                y: "WeaponCombo",
                fill: d => uidToColor(d.WeaponCombo),
                stroke: d => uidToColor(d.WeaponCombo),
                strokeWidth: 1.5,
                whiskerCap: true,
                r: 2
            })
        ],
        marginLeft: 0.1 * width,
        marginRight: 0.1 * width,
        marginBottom: width / 25,
        width,
        height: width / 2
    })
)
```