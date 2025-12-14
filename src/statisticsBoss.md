---
sql:
    stats: https://raw.githubusercontent.com/Pnski/TLStatistics/parquetUpload/allLogs.parquet
---

# Boss Statistics

This is currently not finished, it will load a realy huge dataset and makes some rly huge stuff, tests currently take between 20s and 1min depending on browsercache!

```js
import { uidToColor } from "./modules/uidToColor.js"

let stream = await FileAttachment("./data/MonsterLookup.json.gz").stream()
let decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
const MonsterLookup = await new Response(decompressedStream).json();
stream = await FileAttachment("./data/WeaponLookup.json.gz").stream()
decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
const WeaponLookup = await new Response(decompressedStream).json();

//view(WeaponLookup)
function imgFormat(iconPath) {
    const fileName = iconPath.split("/").pop().split(".").pop().replace("_Sprite","") + ".png";
    return `https://raw.githubusercontent.com/Pnski/TLStatistics/main/src/static/Image/Monster/${fileName}`;
}
```

```js
const BossListEN = [
    'Daigon',
    'Leviathan',
    'Pakilo Naru',
    'Manticus Brothers',
    'Ascended Minezerok',
    'Ascended Grand Aelon',
    'Ascended Cornelius',
    'Ascended Kowazan',
    'Ascended Morokai',
    'Ascended Chernobog',
    'Ascended Ahzreil',
    'Ascended Adentus',
    'Ascended Elder Aridus',
    'Ascended Excavator-9',
    'Ascended Junobote',
    'Ascended Malakar',
    'Ascended Talus',
    "Queen Bellandir",
    "Ascended Queen Bellandir",
    "Tevent",
    "Ascended Tevent",
    "Giant Cordy",
    "Ascended Giant Cordy",
    "Deluzhnoa",
    "Ascended Deluzhnoa"
]
```

```js
const bossData = {}

const weaponCases = Object.entries(WeaponLookup)
  .map(([weapon, ids]) =>
    `WHEN SkillId IN (${ids.join(",")}) THEN '${weapon}'`
  )
  .join("\n");

BossListEN.forEach(async (k) => {
    const bossObject = Object.values(MonsterLookup).find(v => v.en === k);
    
    if (bossObject) {
        const variants = [
            bossObject.de,
            bossObject.en,
            bossObject.es-419,
            bossObject.fr,
            bossObject.ja,
            bossObject.ko,
            bossObject.pt,
            bossObject['zh-Hant']
        ].filter(name => name && name.trim() !== "");
        
        const kQuoted = variants.map(b => `'${b}'`).join(', ');

        /* const total = (await sql([`
            SELECT SUM(Damage) AS TotalDamage
            FROM stats
            WHERE TargetName IN (${kQuoted})
        `])).toArray()[0];  */

        bossData[k] = await sql([`
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

        /* bossData[k] = await sql([`
            WITH fights AS (
            SELECT
                SHA,
                MIN(Timestamp) AS start_time,
                MAX(Timestamp) AS end_time,
                DATE_DIFF('seconds', MIN(Timestamp), MAX(Timestamp)) AS fightDuration
            FROM stats
            WHERE TargetName IN (${kQuoted})
            GROUP BY SHA
        ),
        DmgPerID AS (
            SELECT
                SHA,
                SkillId,
                SUM(Damage) AS total_damage
            FROM stats
            WHERE TargetName IN (${kQuoted})
            GROUP BY SHA, SkillId
        )
        SELECT
            d.SHA,
            d.SkillId,
            d.total_damage / NULLIF(f.fightDuration, 0) AS DPS
        FROM DmgPerID d
        JOIN fights f
            ON d.SHA = f.SHA
        ORDER BY d.SHA, d.SkillId;
        `]); */

        /* const debug = await sql([`
            WITH fights AS (
                SELECT
                    SHA,
                    MIN(Timestamp) AS start_time,
                    MAX(Timestamp) AS end_time,
                    DATE_DIFF('second', MIN(Timestamp), MAX(Timestamp)) AS fight_seconds
                FROM stats
                WHERE TargetName IN (${kQuoted})
                GROUP BY SHA
            ),
            damage_per_uid AS (
                SELECT
                    SHA,
                    SkillId,
                    SUM(Damage) AS total_damage
                FROM stats
                WHERE TargetName IN (${kQuoted})
                GROUP BY SHA, SkillId
            )
            SELECT
                d.SkillId,
                d.total_damage,
                f.fight_seconds,
                d.total_damage / f.fight_seconds AS fight_dps
            FROM damage_per_uid d
            JOIN fights f ON d.SHA = f.SHA
            WHERE d.SkillId = 950004896
            ORDER BY fight_dps DESC
        `]);
        view(Inputs.table(debug))*/
        //view(Inputs.table(dpsResults))


        //view((total.TotalDamage ? total.TotalDamage[0] : 0).toLocaleString());
    }
})
```

```js
for (const [name, data] of Object.entries(bossData)) {
    const bossObject = Object.values(MonsterLookup).find(v => v.en === name);
    view(name)
    const imgString = imgFormat(bossObject.IconPath);
    view(html`<img src=${imgString}>`);
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
                Plot.boxX(data, {
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
            height: width / 2.5
        }))
    
}
```