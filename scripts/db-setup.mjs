import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL yo'q. .env.local faylini tekshiring.");
  process.exit(1);
}

const sql = neon(url);
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

const statements = schema
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

for (const stmt of statements) {
  try {
    await sql.query(stmt);
    console.log("✓", stmt.split("\n")[0].slice(0, 70));
  } catch (e) {
    console.error("✗", stmt.split("\n")[0].slice(0, 70), "\n  ", e.message);
  }
}

console.log("\nTayyor.");
