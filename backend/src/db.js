import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

pool.on('connect', () => {
  console.log('DB connected');
});

pool.on('error', (err) => {
  console.error('DB error', err);
});

export const query = async (text, params) => {
  return pool.query(text, params);
};
