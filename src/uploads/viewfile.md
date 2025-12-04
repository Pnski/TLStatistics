# Review File

```js
import * as Inputs from "npm:@observablehq/inputs";

const logFile = view(Inputs.file({
  label: "Upload Combat Log",
  accept: ".txt",
  required: true
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
    }).filter(d => d.SkillId !== 940574531);

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

### Damage over Time

```js
import * as Plot from "npm:@observablehq/plot";
view(
    Plot.plot({
        width: 800,
        x: {
            label: "Time in Minutes",
            tickFormat: d => d / 60,
            ticks: d3.range(0, d3.max(data, d => d.Time) + 30, 30)
        },
        marks: [
            Plot.ruleY([1]),
            Plot.line(data,
                {
                    x: "Time", 
                    y: (d) => d.Damage,
                    stroke: "var(--syntax-string)"
                }
            )
        ]
    })
);
```

## Raw Log
```js
const string = await logFile.text();
view(string.split("\n").slice(1).join('\n'));
```