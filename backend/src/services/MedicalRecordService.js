const medicalRecordRepository = require('../repositories/MedicalRecordRepository');
const auditRepository = require('../repositories/AuditRepository');
const AppError = require('../utils/AppError');

class MedicalRecordService {
  constructor(repo = medicalRecordRepository, auditRepo = auditRepository) {
    this.repo = repo;
    this.auditRepo = auditRepo;
  }

  // FR-09: doctors attach private clinical notes after a consultation.
  async addRecord({ doctorId, patientId, appointmentId, diagnosis, prescription, labResults }) {
    if (!diagnosis) {
      throw new AppError('Diagnosis is required.', 400);
    }
    const record = await this.repo.create({
      patientId,
      doctorId,
      appointmentId,
      diagnosis,
      prescription,
      labResults,
    });
    await this.auditRepo.log({
      userId: doctorId,
      action: 'CREATE',
      entity: 'medical_record',
      entityId: record.id,
    });
    return record;
  }

  // FR-05: read-only viewing for the patient themself.
  async getPatientHistory(patientId) {
    return this.repo.findByPatient(patientId);
  }
}

module.exports = new MedicalRecordService();
module.exports.MedicalRecordService = MedicalRecordService;
