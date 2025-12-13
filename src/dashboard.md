---
toc: false
sql:
    stats: https://raw.githubusercontent.com/Pnski/TLStatistics/parquetUpload/allLogs.parquet
---

# Dashboard

```sql id=[Dragaryle,Radeth,CalanthiaNM,CalanthiaHM]
SELECT
    CASE
        WHEN TargetName IN ('Calanthia der Zerstörung', 'Calanthia of Destruction') THEN 'CalanthiaHM'
        ELSE TargetName
    END AS Target,
    SUM(Damage) AS TotalDamage
FROM stats
WHERE Target IN ('Dragaryle', 'Radeth', 'Calanthia', 'CalanthiaHM')
GROUP BY Target;
```

<div class="grid grid-cols-4">
    <a class="card">
        <div class="text-wrapper">
            <h2>Total Dragaryle Damage</h2>
            <span class="medium">${Dragaryle.TotalDamage[0].toLocaleString()}</span>
        </div>
        <img style="float:right" height="124" src="./static/Image/Raid/Raid_M_Golem_Dragaile_Open_Normal.png" />
    </a>
    <a class="card">
        <div class="text-wrapper">
            <h2>Total Radeth Damage</h2>
            <span class="medium">${Radeth.TotalDamage[0].toLocaleString()}</span>
        </div>
        <img style="float:right" height="124" src="./static/Image/Raid/Raid_M_Dragon_Radeath_Open_Normal.png" />
    </a>
    <a class="card">
        <div class="text-wrapper">
            <h2>Total Calanthia</h2>
            <span class="medium">${CalanthiaNM.TotalDamage[0].toLocaleString()}</span>
        </div>
        <img style="float:right" height="124" src="./static/Image/Raid/Raid_M_AntikingArmy_SlaughtererCalantiha_Open_Normal.png" />
    </a>
    <a class="card">
        <div class="text-wrapper">
            <h2>Total Calanthia's Nightmare Damage</h2>
            <span class="medium">${CalanthiaHM.TotalDamage[0].toLocaleString()}</span>
        </div>
        <img style="float:right" height="124" src="./static/Image/Raid/Raid_M_AntiKingArmy_ChaosCalanthia_Open_Normal.png" />
    </a>
</div>

<style>
.text-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center; /* vertical centering */
    height: 124px;           /* same as image height */
    float: left;             /* text stays on the left of the image */
}
</style>