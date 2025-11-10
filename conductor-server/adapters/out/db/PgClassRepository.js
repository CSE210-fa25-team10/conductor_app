import { readFileSync } from 'node:fs';
import path from 'node:path';

const sql = readFileSync(path.resolve('./src/adapters/out/db/sql/searchClasses.sql'), 'utf8');

export function makePgClassRepository({ pool }) {
  // implements ClassQueryPort.search
  async function search({ filter, limit }) {
    const res = await pool.query(sql, [ `%${filter}%`, limit ]);
    return res.rows; // raw rows; app layer will map to entities
  }
  return Object.freeze({ search });
}