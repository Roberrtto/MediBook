const pool = require('../config/db');
const AppError = require('../utils/AppError');

class AppointmentRepository {
  /**
   * Books an appointment inside a DB transaction with a row lock
   * (SELECT ... FOR UPDATE) on the doctor's slot. This is what satisfies
   * FR-12 / NFR-04: two receptionists (or a patient + receptionist) clicking
   * "book" for the same doctor+time at the exact same millisecond cannot
   * both succeed — the second request is rejected instead of silently
   * overwriting the first. The UNIQUE constraint on (doctor_id, appointment_time)
   * in schema.sql is the last line of defence even if the lock is bypassed.
   */
  async bookAppointment({ patientId, doctorId, appointmentTime, reason }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock any existing row for this doctor+time so concurrent transactions
      // queue up instead of racing.
      const existing = await client.query(
        `SELECT id, status FROM appointments
         WHERE doctor_id = $1 AND appointment_time = $2
         FOR UPDATE`,
        [doctorId, appointmentTime]
      );

      if (existing.rows.length > 0 && existing.rows[0].status !== 'cancelled') {
        throw new AppError('That time slot is no longer available.', 409);
      }

      const { rows } = await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_time, reason, status)
         VALUES ($1, $2, $3, $4, 'booked')
         RETURNING *`,
        [patientId, doctorId, appointmentTime, reason]
      );

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        // unique_violation from the DB-level constraint (belt-and-braces)
        throw new AppError('That time slot is no longer available.', 409);
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async cancelAppointment(id) {
    const { rows } = await pool.query(
      `UPDATE appointments SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findByPatient(patientId) {
    const { rows } = await pool.query(
      `SELECT a.*, u.name AS doctor_name, u.specialty
       FROM appointments a JOIN users u ON u.id = a.doctor_id
       WHERE a.patient_id = $1 ORDER BY a.appointment_time DESC`,
      [patientId]
    );
    return rows;
  }

  async findByDoctor(doctorId, { date } = {}) {
    const params = [doctorId];
    let query = `SELECT a.*, u.name AS patient_name
                 FROM appointments a JOIN users u ON u.id = a.patient_id
                 WHERE a.doctor_id = $1 AND a.status != 'cancelled'`;
    if (date) {
      params.push(date);
      query += ' AND a.appointment_time::date = $2';
    }
    query += ' ORDER BY a.appointment_time ASC';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  async findAll() {
    const { rows } = await pool.query(
      `SELECT a.*, p.name AS patient_name, d.name AS doctor_name
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       JOIN users d ON d.id = a.doctor_id
       ORDER BY a.appointment_time DESC`
    );
    return rows;
  }

  async findUpcomingWithinWindow(hoursAhead) {
    const { rows } = await pool.query(
      `SELECT a.*, p.name AS patient_name, p.email AS patient_email,
              d.name AS doctor_name
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       JOIN users d ON d.id = a.doctor_id
       WHERE a.status = 'booked'
         AND a.appointment_time BETWEEN NOW() AND NOW() + ($1 || ' hours')::interval`,
      [hoursAhead]
    );
    return rows;
  }
}

module.exports = new AppointmentRepository();
