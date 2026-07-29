const pool = require('../config/db');

/**
 * Repository pattern: this is the ONLY file allowed to write raw SQL
 * for the `users` table. Every other layer (services, controllers) calls
 * these methods instead of touching `pool` directly. That keeps a single
 * responsibility per class and means if we ever swap PostgreSQL for
 * something else, only this file changes.
 */
class UserRepository {
  async create({ name, email, passwordHash, role, specialty = null }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, specialty)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, specialty, created_at`,
      [name, email, passwordHash, role, specialty]
    );
    return rows[0];
  }

  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, specialty, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async findAllDoctors() {
    const { rows } = await pool.query(
      `SELECT id, name, email, specialty FROM users WHERE role = 'doctor' ORDER BY name`
    );
    return rows;
  }
}

module.exports = new UserRepository();
