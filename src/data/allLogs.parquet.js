import { pipeline } from "node:stream/promises";

const response = await fetch(
  "https://raw.githubusercontent.com/Pnski/TLStatistics/parquetUpload/allLogs.parquet"
);

if (!response.ok) {
  throw new Error(`fetch failed: ${response.status}`);
}

// Stream response → stdout
await pipeline(response.body, process.stdout);