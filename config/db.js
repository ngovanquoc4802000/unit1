import { createPool } from 'mysql2/promise';

const DB = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'YOUR_PASSWORD',
  database: 'YOUR_DB'
};

const pool = createPool({
  ...DB,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

export async function getConnection() {
  return pool.getConnection();
}

export default pool;
