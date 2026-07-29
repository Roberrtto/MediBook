const { Pool } = require('pg');
require('dotenv').config();

// Single shared connection pool. Every repository goes through this pool,
// which is what lets us run real transactions (BEGIN/COMMIT/ROLLBACK) for
// the double-booking guard in AppointmentRepository.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;
