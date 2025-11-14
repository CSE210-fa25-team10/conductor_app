import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for loaded SQL queries
const queryCache = new Map();

/**
 * Loads a SQL query from a file
 * @param {string} queryName - Name of the SQL file (without .sql extension)
 * @returns {string} The SQL query content
 */
export function loadQuery(queryName) {
  if (queryCache.has(queryName)) {
    return queryCache.get(queryName);
  }

  // Try multiple possible paths to find SQL files
  const possiblePaths = [
    path.resolve(__dirname, '../adapters/out/db/sql', `${queryName}.sql`),
    path.resolve(process.cwd(), 'adapters/out/db/sql', `${queryName}.sql`),
    path.resolve(process.cwd(), 'conductor-server/adapters/out/db/sql', `${queryName}.sql`),
  ];

  let sqlPath = null;
  for (const possiblePath of possiblePaths) {
    try {
      readFileSync(possiblePath, 'utf8'); // Test if file exists
      sqlPath = possiblePath;
      break;
    } catch {
      // Continue to next path
    }
  }

  if (!sqlPath) {
    throw new Error(`SQL query file "${queryName}.sql" not found in any of the expected locations`);
  }

  try {
    const sql = readFileSync(sqlPath, 'utf8');
    queryCache.set(queryName, sql);
    return sql;
  } catch (error) {
    throw new Error(`Failed to load SQL query "${queryName}": ${error.message}`);
  }
}

/**
 * Clears the query cache (useful for development/reloading)
 */
export function clearQueryCache() {
  queryCache.clear();
}

