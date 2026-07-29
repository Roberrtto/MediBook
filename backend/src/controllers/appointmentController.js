const appointmentService = require('../services/AppointmentService');
const asyncHandler = require('../utils/asyncHandler');

// FR-03: patients (or receptionists on their behalf) book a slot
exports.bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentTime, reason, patientId } = req.body;
  const effectivePatientId = req.user.role === 'receptionist' && patientId ? patientId : req.user.id;

  const appointment = await appointmentService.bookAppointment({
    patientId: effectivePatientId,
    doctorId,
    appointmentTime,
    reason,
  });
  res.status(201).json({ success: true, data: appointment });
});

// FR-04
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.cancelAppointment(req.params.id, req.user);
  res.status(200).json({ success: true, data: appointment });
});

// Patient's own appointments
exports.getMyAppointments = asyncHandler(async (req, res) => {
  const appointments = await appointmentService.getPatientAppointments(req.user.id);
  res.status(200).json({ success: true, data: appointments });
});

// FR-08: doctor's daily schedule
exports.getDoctorSchedule = asyncHandler(async (req, res) => {
  const doctorId = req.user.role === 'doctor' ? req.user.id : req.query.doctorId;
  const schedule = await appointmentService.getDoctorSchedule(doctorId, req.query.date);
  res.status(200).json({ success: true, data: schedule });
});

// FR-06: receptionist's centralized calendar view
exports.getAllAppointments = asyncHandler(async (req, res) => {
  const appointments = await appointmentService.getAllAppointments();
  res.status(200).json({ success: true, data: appointments });
});
