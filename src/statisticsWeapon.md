---
sql:
    weapons: https://raw.githubusercontent.com/Pnski/TLStatistics/parquetUpload/allLogs.parquet
---

# Weapon Statistics

```js
const stream = await FileAttachment("./data/SkillLookup.json.gz").stream();
const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));

// Convert stream to text
const text = await new Response(decompressedStream).text();

// Parse JSON
const db = JSON.parse(text);
view(db);
```

<div class="card">

<div>