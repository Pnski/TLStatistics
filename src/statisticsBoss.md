---
toc: false
sql:
    stats: https://raw.githubusercontent.com/Pnski/TLStatistics/parquetUpload/allLogs.parquet
---

# Boss Statistics

```js
const stream = await FileAttachment("./data/MonsterLookup.json.gz").stream()
const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));

// Convert stream to text
const text = await new Response(decompressedStream).text();

// Parse JSON
const db = JSON.parse(text);

function imgFormat(str) {
    return str.replace("Game","_file/static").split(".")[0].replace("_Sprite","")+".png"
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
BossListEN.forEach(async (k) => {
    const bossObject = Object.values(db).find(v => v.en === k);
    
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

        const total = (await sql([`
            SELECT SUM(Damage) AS TotalDamage
            FROM stats
            WHERE TargetName IN (${kQuoted})
        `])).toArray()[0]; 
        const imgString = imgFormat(bossObject.IconPath);
        view(html`<img src=${imgString} title="${k} - ${variants.join(', ')}">`);
        view((total.TotalDamage ? total.TotalDamage[0] : 0).toLocaleString());
    }
})
```