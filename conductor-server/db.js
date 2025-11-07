import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
    // For RDS with TLS later, you may need:
    // ssl: { rejectUnauthorized: false }
});

export async function dbHealth() {
    const { rows } = await pool.query('SELECT 1 AS ok');
    return rows[0]?.ok === 1;
}

export { pool };
