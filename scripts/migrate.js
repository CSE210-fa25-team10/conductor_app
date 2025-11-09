import fs from "node:fs";
import { Pool } from "pg";
import "dotenv/config";

const sql = fs.readFileSync("schema.sql", "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const run = async () => {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query(sql);
    await c.query("COMMIT");
    console.log("Schema applied");
  } catch (e) {
    await c.query("ROLLBACK");
    console.error("Migration failed:", e.message);
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
};
run();
