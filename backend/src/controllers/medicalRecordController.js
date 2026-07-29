const medicalRecordService = require('../services/MedicalRecordService');
const asyncHandler = require('../utils/asyncHandler');

// FR-09: doctor attaches notes after a consultation
exports.addRecord = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, diagnosis, prescription, labResults } = req.body;
  const record = await medicalRecordService.addRecord({
    doctorId: req.user.id,
    patientId,
    appointmentId,
    diagnosis,
    prescription,
    labResults,
  });
  res.status(201).json({ success: true, data: record });
});

// FR-05: patient views their own read-only history
exports.getMyHistory = asyncHandler(async (req, res) => {
  const history = await medicalRecordService.getPatientHistory(req.user.id);
  res.status(200).json({ success: true, data: history });
});
