const pool = require('../config/db');

class AuditRepository {
  async log({ userId, action, entity, entityId }) {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)`,
      [userId, action, entity, entityId]
    );
  }
}

module.exports = new AuditRepository();
