---
sql:
  gaia: ./data/all_logs.parquet
toc: false
theme: dashboard
---

# Player Report

```sql id=asdf
SELECT *
FROM gaia
ORDER BY Damage DESC
LIMIT 20
```

<div class="card">
    ${view(Inputs.table(asdf), {layout: "fixed"})}
</div>