# Review File
```js
import * as Inputs from "npm:@observablehq/inputs";


const logFile = view(Inputs.file({
  label: "Upload Combat Log",
  accept: "TLCombatLog*.txt,",
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
            Damage: +Damage,        // convert to number
            HitCritical: +HitCritical,
            HitDouble: +HitDouble,
            HitType,
            CasterName,
            TargetName
        };
    });

data = data.sort((a, b) => a.Timestamp - b.Timestamp);

data.forEach(d => {
  d.Time = d.Timestamp - data[0].Timestamp;  // relative time in ms
});
```


## View

### Tables

```js
// --- Aggregate per Target and per Skill ---
const grouped = d3.group(data, d => d.TargetName, d => d.SkillName);

const tables = [];

for (const [target, skillsMap] of grouped.entries()) {
    const targetData = [];

    // Total damage for this target
    const totalDamage = d3.sum(data.filter(d => d.TargetName === target), d => d.Damage);

    const targetLines = data.filter(d => d.TargetName === target);
    const startTime = d3.min(targetLines, d => d.Timestamp);
    const endTime = d3.max(targetLines, d => d.Timestamp);
    const durationSec = (endTime - startTime) / 1000;

    for (const [skill, skillLines] of skillsMap.entries()) {
        const damage = d3.sum(skillLines, d => d.Damage);
        const ratio = damage / totalDamage * 100;
        const hitCount = skillLines.length;
        const critCount = skillLines.filter(d => d.HitCritical === 1).length;
        const heavyCount = skillLines.filter(d => d.HitDouble === 1).length;
        const critChance = (critCount / hitCount * 100).toFixed(1) + "%";
        const heavyChance = (heavyCount / hitCount * 100).toFixed(1) + "%";
        const dps = (damage / durationSec).toFixed(2);

        targetData.push({
        SkillName: skill,
        Damage: damage,
        Ratio: ratio.toFixed(1) + "%",
        HitCount: hitCount,
        CritChance: critChance,
        HeavyChance: heavyChance,
        DPS: dps
        });
    }

    targetData.sort((a, b) => b.Damage - a.Damage);
    targetData.forEach((d, i) => d["#"] = i + 1);
    view(target);
    view(Inputs.table(targetData, {
    columns: [
        "#", "SkillName", "Damage", "Ratio", "HitCount", "CritChance", "HeavyChance", "DPS"
    ],
        header: {
        species: "#",
        SkillName: "Skill Name",
        Damage: "Damage",
        Ratio: "Ratio",
        HitCount: "Hit Count",
        CritChance: "Critical Hit Chance",
        HeavyChance: "Heavy Attack Chance",
        DPS: "DPS"
    }
    }))
}
```

### Damage over Time

```js
const width = 800;
const height = 300;
const margin = {top: 20, right: 20, bottom: 30, left: 40};

const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height);

// === Scales ===
const x = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.Time)])
  .range([margin.left, width - margin.right]);

const y = d3.scaleLinear()
  .domain([d3.min(data, d => d.Damage), d3.max(data, d => d.Damage)])
  .range([height - margin.bottom, margin.top])
  .nice();

// === Line generator ===
const line = d3.line()
  .x(d => x(d.Time))
  .y(d => y(d.Damage));

// === Draw line ===
svg.append("path")
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 1.5)
  .attr("d", line);

// === Axes ===
svg.append("g")
  .attr("transform", `translate(0,${height - margin.bottom})`)
  .call(d3.axisBottom(x));

svg.append("g")
  .attr("transform", `translate(${margin.left},0)`)
  .call(d3.axisLeft(y));

view(svg.node());
```

## Raw Log
```js
const string = await logFile.text();
view(string.split("\n").slice(1).join('\n'));
```