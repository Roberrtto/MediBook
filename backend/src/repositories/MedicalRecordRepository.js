const pool = require('../config/db');

class MedicalRecordRepository {
  async create({ patientId, doctorId, appointmentId, diagnosis, prescription, labResults }) {
    const { rows } = await pool.query(
      `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, prescription, lab_results)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [patientId, doctorId, appointmentId, diagnosis, prescription, labResults]
    );
    return rows[0];
  }

  // Records are read-only once created (FR-05 / NFR-02): no updateRecord method
  // is exposed on purpose, protecting the immutable audit trail.
  async findByPatient(patientId) {
    const { rows } = await pool.query(
      `SELECT r.*, d.name AS doctor_name
       FROM medical_records r JOIN users d ON d.id = r.doctor_id
       WHERE r.patient_id = $1 ORDER BY r.created_at DESC`,
      [patientId]
    );
    return rows;
  }
}

module.exports = new MedicalRecordRepository();
