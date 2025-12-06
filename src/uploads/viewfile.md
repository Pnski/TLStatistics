---
theme: dashboard
toc: false
---

# Review File

Notice using the datarangeslider is usefull but depending on your computer and logfile it might be laggy.

Throne and Liberty Damage meter files are stored in:
```
%LOCALAPPDATA%/TL/Saved/CombatLogs
```

```js
import * as Inputs from "npm:@observablehq/inputs";

const logFile = view(Inputs.file({
  label: "Upload Combat Log",
  accept: ".txt",
  required: true
}));
```

```js
import {interval} from "/modules/interval.js";
const filters = view(Inputs.checkbox(["Zeros", "Raid Skill"], {label: "Filter"}));
const filterTime = view(interval([0, 100], {
  step: 1, 
  value: [0, 100],
  label: "Select Datarange",
  format: () => ""
}));
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

const startIndex = Math.floor((filterTime[0] / 100) * data.length);
const endIndex   = Math.ceil((filterTime[1]   / 100) * data.length);

data = data.slice(startIndex, endIndex);
```

<div class="grid grid-cols-4">
    <a class="card">
        <h2>Date of Log</h2>
        <span class="medium">${data.at(0).Timestamp}</span>
    </a>
    <a class="card">
        <h2>Start Time</h2>
        <span class="medium">${data.at(0).Time}</span>
        <span class="muted">seconds</span>
    </a>
    <a class="card">
        <h2>End Time</h2>
        <span class="medium">${data.at(-1).Time}</span>
        <span class="muted">seconds</span>
    </a>
    <a class="card">
        <h2>Total Damage</h2>
        <span class="medium">${d3.sum(data, d => d.Damage).toLocaleString()}</span>
    </a>
</div>



```js
const timeRange = d3.max(data, d => d.Time) - d3.min(data, d => d.Time);
const totalDamageAll = d3.sum(data, d => d.Damage);

const tableData = [
  {
    SkillName: "ALL",
    Damage: totalDamageAll,
    Ratio: 100,
    MaxDamage: d3.max(data, d => d.Damage),
    HitCount: data.length,
    CritChance: Math.round(d3.mean(data, d => d.HitCritical) * 100),
    HeavyChance: Math.round(d3.mean(data, d => d.HitDouble) * 100),
    DPS: Math.round(totalDamageAll / timeRange)
  },
  ...Array.from(d3.group(data, d => d.SkillName), ([SkillName, skillArray]) => {
    const totalDamage = d3.sum(skillArray, d => d.Damage);
    const hitCount = skillArray.length;
    
    return {
      SkillName,
      Damage: totalDamage,
      Ratio: Math.round((totalDamage / totalDamageAll) * 100),
      MaxDamage: d3.max(skillArray, d => d.Damage),
      HitCount: hitCount,
      CritChance: Math.round(d3.mean(skillArray, d => d.HitCritical) * 100),
      HeavyChance: Math.round(d3.mean(skillArray, d => d.HitDouble) * 100),
      DPS: Math.round(totalDamage / timeRange)
    };
  })
];

const viewTableData = Inputs.table(tableData, {
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
    rows: 30,
    select: false
});

```

<div class="card">
    <h2>Skill Table</h2>
    ${view(viewTableData)}
</div>

```js
const maxTime = d3.max(data, d => d.Time);
const timeTicks = d3.range(0, maxTime + 30, 30);
const cumulative = data.map((d, i, arr) => ({
  Time: d.Time,
  CumulativeDamage: arr.slice(0, i + 1).reduce((sum, curr) => sum + curr.Damage, 0)
}));
const _options = {
    marginLeft: 0.1*width,
    marginRight: 0.1*width,
    marginBottom: width/2.5/10,
    width: width,
    height: width/2.5
}

const viewHeatMap = Plot.plot({
        marks: [
            Plot.dot(data, { x: "Time", y: "Damage", r:0.1}),

            () =>
            Plot.plot({
                ..._options,

                marks: [
                Plot.line(cumulative, {
                    x: "Time",
                    y: "CumulativeDamage",
                    stroke: "var(--syntax-constant)",
                })],
                x: {
                    label: "Time in Minutes",
                    tickFormat: d => d / 60,
                    ticks: timeTicks
                },
                y: { axis: "right", nice: true, line: true }
            })
        ],

        ..._options,
        x: {
            label: "Time in Minutes",
            tickFormat: d => d / 60,
            ticks: timeTicks
        },
        y: { axis: "left" }
    });
```

<div class="card">
    <h2>Heat Graph</h2>
    ${view(viewHeatMap)}
</div>

```js
import { sparkbar } from "/modules/sparkbar.js";
let monsterTables = {};

for (const [target, skillsMap] of d3.group(data, d => d.TargetName, d => d.SkillName).entries()) {
  const targetData = [];

  const totalDamage = d3.sum(data.filter(d => d.TargetName === target), d => d.Damage);
  const targetLines = data.filter(d => d.TargetName === target);
  const startTime = d3.min(targetLines, d => d.Time);
  const endTime = d3.max(targetLines, d => d.Time);
  const durationSec = endTime - startTime;

  for (const [skill, skillLines] of skillsMap.entries()) {
    const damage = d3.sum(skillLines, d => d.Damage);

    targetData.push({
      SkillName: skill,
      Damage: damage,
      Ratio: ((damage / totalDamage) * 100).toFixed(1),
      HitCount: skillLines.length,
      CritChance: ((skillLines.filter(d => d.HitCritical === 1).length / skillLines.length) * 100).toFixed(1),
      HeavyChance: ((skillLines.filter(d => d.HitDouble === 1).length / skillLines.length) * 100).toFixed(1),
      DPS: (damage / durationSec).toFixed(2)
    });
  }

  monsterTables[target] = targetData;
}
```

<h2>Detailed Tables per Monster</h2>
${
    Object.entries(await monsterTables).map(([target, targetData]) => html`
        <div class="card">
            <h3>${target}</h3>
            ${Inputs.table(targetData, {
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
                layout: "fixed",
                rows: 30,
                select: false})
            }
        </div>`)
}

## Raw Log

```js
const string = await logFile.text();
view(string.split("\n").slice(1).join('\n'));
```