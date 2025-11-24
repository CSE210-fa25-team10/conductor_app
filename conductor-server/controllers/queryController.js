import { loadQuery } from '../services/queryLoader.js';

/**
 * QueryService - Executes SQL queries loaded from files
 */
export function makeQueryService({ pool }) {
  /**
   * Execute a SQL query by name with optional parameters
   * @param {string} queryName - Name of the SQL file (without .sql extension)
   * @param {Array} params - Query parameters (for parameterized queries)
   * @returns {Promise<Array>} Query results
   */
  async function executeQuery(queryName, params = []) {
    try {
      const sql = loadQuery(queryName);
      const result = await pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error(`Error executing query "${queryName}":`, error);
      throw error;
    }
  }

  /**
   * Execute a raw SQL query (for dynamic queries)
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async function executeRawQuery(sql, params = []) {
    try {
      const result = await pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Error executing raw query:', error);
      throw error;
    }
  }

  return Object.freeze({
    executeQuery,
    executeRawQuery,
  });
}
