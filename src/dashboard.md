---
theme: dashboard
toc: false
sql:
    stats: ./data/all_logs2.parquet
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
        <h2>Total Dragaryle Damage</h2>
        <span class="medium">${Dragaryle.TotalDamage[0].toLocaleString()}</span>
    </a>
    <a class="card">
         <h2>Total Radeth Damage</h2>
         <span class="medium">${Radeth.TotalDamage[0].toLocaleString()}</span>
    </a>
    <a class="card">
         <h2>Total Calanthia (1) Damage</h2>
         <span class="medium">${CalanthiaNM.TotalDamage[0].toLocaleString()}</span>
    </a>
    <a class="card">
         <h2>Total Calanthia (2) Damage</h2>
         <span class="medium">${CalanthiaHM.TotalDamage[0].toLocaleString()}</span>
    </a>
</div>