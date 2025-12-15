---
sql:
    stats: https://raw.githubusercontent.com/Pnski/TLStatistics/parquetUpload/allLogs.parquet
---

# Raid Statistics

This is currently not finished, it will load a realy huge dataset and makes some rly huge stuff, tests currently take between 20s and 1min depending on browsercache!

```js
import { uidToColor } from "./modules/uidToColor.js"

const MonsterLookup = {
  TEXT_CONTENTS_RAID_001_NPC_BOSS_DRAGAILE: {
    de: "Dragaryle",
    en: "Dragaryle",
    es: "Dragaryle",
    fr: "Dragaryle",
    pt: "Dragaryle",
    ja: "ドラゲイル",
    ko: null,
    "zh-Hant": null,
    IconPath: "Raid_M_Golem_Dragaile_Open_Normal"
  },
  TEXT_CONTENTS_RAID_001_NPC_BOSS_VULCAN: {
    de: "Vulkan",
    en: "Vulkan",
    es: null,
    fr: null,
    pt: null,
    ja: "ドラゲイル",
    ko: null,
    "zh-Hant": null,
    IconPath: "Raid_M_Dragon_Vulcan_Open_Normal"
  },
  TEXT_CONTENTS_RAID_001_NPC_BOSS_XIROS: {
    de: "Zairos",
    en: "Zairos",
    es: null,
    fr: null,
    pt: null,
    ja: "ザイロス",
    ko: null,
    "zh-Hant": null,
    IconPath: "Raid_M_Dragon_Vulcan_Open_Normal"
  },
  TEXT_CONTENTS_RAID_001_NPC_BOSS_RADEATH: {
    de: "Radeth",
    en: "Radeth",
    es: null,
    fr: null,
    pt: null,
    ja: "ラデス",
    ko:null,
    "zh-Hant":null,
    IconPath: "Raid_M_Dragon_Radeath_Open_Normal"
  },
  TEXT_CONTENTS_RAID_001_NPC_BOSS_CALANTHIA: {
    de: "Calanthia",
    en: "Calanthia",
    es: "Calanthia",
    fr: "Calanthia",
    pt: "Calanthia",
    ja: "カランシア",
    ko:null,
    "zh-Hant": null,
    IconPath: "Raid_M_AntikingArmy_SlaughtererCalantiha_Open_Normal"
  },
  L11_M_AntiKingArmy_ChaosCalanthia_UIName: {
    de: "Calanthia der Zerstörung",
    en: "Calanthia of Destruction",
    es: "Calantia de la destrucción",
    fr: "Calanthia destructrice",
    ja: "破滅のカランシア",
    ko: "파멸의 칼란시아",
    pt: "Calanthia da Destruição",
    "zh-Hant": "破滅的卡蘭希亞",
    IconPath: "Raid_M_AntiKingArmy_ChaosCalanthia_Open_Normal"
  }
};


const stream2 = await FileAttachment("./data/WeaponLookup.json.gz").stream()
const decompressedStream2 = stream2.pipeThrough(new DecompressionStream("gzip"));
const WeaponLookup = await new Response(decompressedStream2).json();
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
    return `https://raw.githubusercontent.com/Pnski/TLStatistics/main/src/static/Image/Raid/${fileName}`;
}
```

```js
const BossListEN = [
    'Dragaryle',
    'Zairos',
    'Vulkan',
    'Radeth',
    'Calanthia',
    "Calanthia of Destruction"
]
```

```js
const bossData = {}

const weaponCases = Object.entries(WeaponLookup)
  .map(([weapon, ids]) =>
    `WHEN SkillId IN (${ids.join(",")}) THEN '${weapon}'`
  )
  .join("\n");
await Promise.all(
  BossListEN.map(async (k) => {
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
            ]
            
            const kQuoted = variants.map(b => `'${b}'`).join(', ');

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
                    WHERE TargetName IN (${kQuoted})
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
                    WHERE TargetName IN (${kQuoted})
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
        }
  })
);
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
        })
    )
}
```