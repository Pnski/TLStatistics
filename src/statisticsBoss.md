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
    'Ascended Talus'
]

for (const boss of BossListEN) {
    const bossObject = Object.values(db)
        .find(v => v.en === boss)
    const imgString = imgFormat(bossObject.IconPath)
    view(html`<img src=${imgString}>`)
}
```