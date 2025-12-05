# Review File

Throne and Liberty Damage meter files are stored in:
> %LOCALAPPDATA%/TL/Saved/CombatLogs

```js
import * as Inputs from "npm:@observablehq/inputs";

const logFile = view(Inputs.file({
  label: "Upload Combat Log",
  accept: ".txt",
  required: true
}));
```

```js
const filters = view(Inputs.checkbox(["Zeros", "Raid Skill"], {label: "Filter"}));
```

```js
const rawText = await logFile.text();
const lines = rawText.split(/\r?\n/).slice(1); // remove first line

let data = lines
    .filter(line => line.trim())
    .map(line => {
        const [
            Timestamp,
            LogType,
            SkillName,
            SkillId,
            Damage,
            HitCritical,
            HitDouble,
            HitType,
            CasterName,
            TargetName
        ] = line.split(",");

        return {
            Timestamp: d3.timeParse("%Y%m%d-%H:%M:%S:%L")(Timestamp),
            LogType,
            SkillName,
            SkillId: +SkillId,
            Damage: +Damage,
            HitCritical: +HitCritical,
            HitDouble: +HitDouble,
            HitType,
            CasterName,
            TargetName
        };
    });
if (filters.includes("Zeros")) {
    data = data.filter(d => d.Damage !== 0);
}
if (filters.includes("Raid Skill")) {
    data = data.filter(d => d.SkillId !== 940574531);
}

data = data.sort((a, b) => a.Timestamp - b.Timestamp);

data.forEach(d => {
  d.Time = (d.Timestamp - data[0].Timestamp) / 1000;
});

```

## View

### Tables

```js
import { sparkbar } from "/modules/sparkbar.js";

const grouped = d3.group(data, d => d.TargetName, d => d.SkillName);

for (const [target, skillsMap] of grouped.entries()) {
    const targetData = [];

    const totalDamage = d3.sum(data.filter(d => d.TargetName === target), d => d.Damage);

    const targetLines = data.filter(d => d.TargetName === target);
    const startTime = d3.min(targetLines, d => d.Time);
    const endTime = d3.max(targetLines, d => d.Time);
    const durationSec = (endTime - startTime);

    for (const [skill, skillLines] of skillsMap.entries()) {
        const damage = d3.sum(skillLines, d => d.Damage);
        const ratio = damage / totalDamage * 100;
        const hitCount = skillLines.length;
        const critCount = skillLines.filter(d => d.HitCritical === 1).length;
        const heavyCount = skillLines.filter(d => d.HitDouble === 1).length;
        const critChance = (critCount / hitCount * 100).toFixed(1);
        const heavyChance = (heavyCount / hitCount * 100).toFixed(1);
        const dps = (damage / durationSec).toFixed(2);

        targetData.push({
        SkillName: skill,
        Damage: damage,
        Ratio: ratio.toFixed(1),
        HitCount: hitCount,
        CritChance: critChance,
        HeavyChance: heavyChance,
        DPS: dps
        });
    }

    view(target);

    view(Inputs.table(targetData, {
        columns: [
            "SkillName", "Damage", "Ratio", "HitCount", "CritChance", "HeavyChance", "DPS"
        ],
        header: {
            SkillName: "Skill Name",
            Damage: "Damage",
            Ratio: "Ratio",
            HitCount: "Hit Count",
            CritChance: "Critical Hit Chance",
            HeavyChance: "Heavy Attack Chance",
            DPS: "DPS"
        },
        format: {
            Damage: sparkbar(d3.max(targetData, d => d.Damage)),
            Ratio: (x) => x + "%",
            CritChance: (x) => x + "%",
            HeavyChance: (x) => x + "%",
        },
        sort: "Damage",
        reverse: true,
        layout: "fixed" || "auto",
        rows: 30
    }))
}
```

### Skill Table

```js
const fullData = d3.group(data, d => d.SkillName);

let tableData = Array.from(fullData, ([SkillName, skillArray]) => {
  const totalDamage = d3.sum(skillArray, d => d.Damage);
  const hitCount = skillArray.length;
  const critCount = skillArray.filter(d => d.HitCritical === 1).length;
  const heavyCount = skillArray.filter(d => d.HitDouble === 1).length;

  const totalDamageAllSkills = d3.sum(data, d => d.Damage);

  return {
    SkillName,
    Damage: totalDamage,
    Ratio: Math.round((totalDamage / totalDamageAllSkills) * 100),
    MaxDamage: d3.max(skillArray, d => d.Damage),
    HitCount: hitCount,
    CritChance: Math.round((critCount / hitCount) * 100),
    HeavyChance: Math.round((heavyCount / hitCount) * 100),
    DPS: Math.round(totalDamage / (d3.max(skillArray, d => d.Time) - d3.min(skillArray, d => d.Time)))
  };
});

const ALL = {
  SkillName: "ALL",
  Damage: d3.sum(data, d => d.Damage),
  Ratio: 100,
  MaxDamage: d3.max(data, d => d.Damage),
  HitCount: data.length,
  CritChance: Math.round(d3.sum(data, d => d.HitCritical) / data.length * 100),
  HeavyChance: Math.round(d3.sum(data, d => d.HitDouble) / data.length * 100),
  DPS: Math.round(d3.sum(data, d => d.Damage) / (d3.max(data, d => d.Time) - d3.min(data, d => d.Time)))
};

tableData = [ALL, ...tableData];

view(Inputs.table(tableData, {
    columns: [
        "SkillName", "Damage", "Ratio", "MaxDamage","HitCount", "CritChance", "HeavyChance", "DPS"
    ],
    header: {
        SkillName: "Skill Name",
        Damage: "Damage",
        Ratio: "Ratio",
        MaxDamage: "Max Hit",
        HitCount: "Hit Count",
        CritChance: "Critical Hit Chance",
        HeavyChance: "Heavy Attack Chance",
        DPS: "DPS"
    },
    format: {
        Damage: sparkbar(d3.max(tableData, d => d.Damage)),
        Ratio: x => x + "%",
        CritChance: x => x + "%",
        HeavyChance: x => x + "%",
    },
    sort: "Damage",
    reverse: true,
    layout: "auto",
    rows: 30
}));
```

### Damage over Time

```js

let sum = 0;
const cumulative = data.map(d => ({
  Time: d.Time,
  CumulativeDamage: (sum += d.Damage)
}));

view(
    Plot.plot({
        marks: [
            Plot.dot(data, { x: "Time", y: "Damage", r:0.1}),

            () =>
            Plot.plot({
                marginLeft: 70,
                marginRight: 75,
                marginBottom: 50,
                width: width,
                height: 400,

                marks: [
                Plot.line(cumulative, {
                    x: "Time",
                    y: "CumulativeDamage",
                    stroke: "steelblue",
                })],
                x: {
                    label: "Time in Minutes",
                    tickFormat: d => d / 60,
                    ticks: d3.range(0, d3.max(data, d => d.Time) + 30, 30)
                },
                y: { axis: "right", nice: true, line: true }
            })
        ],

        marginLeft: 70,
        marginRight: 75,
        marginBottom: 50,
        width: width,
        height: 400,
        x: {
            label: "Time in Minutes",
            tickFormat: d => d / 60,
            ticks: d3.range(0, d3.max(data, d => d.Time) + 30, 30)
        },
        y: { axis: "left" }
    })
);
```

## Raw Log
```js
const string = await logFile.text();
view(string.split("\n").slice(1).join('\n'));
```