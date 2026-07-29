const appointmentRepository = require('../repositories/AppointmentRepository');
const userRepository = require('../repositories/UserRepository');
const auditRepository = require('../repositories/AuditRepository');
const createNotificationService = require('./notifications/notificationFactory');
const AppError = require('../utils/AppError');

const CANCELLATION_WINDOW_HOURS = 2;

/**
 * All dependencies are passed into the constructor rather than required
 * directly inside methods. That's Dependency Injection: it's what lets
 * tests/appointmentService.test.js swap in fake repositories/notifiers
 * and test the booking rules with zero real database or network calls.
 */
class AppointmentService {
  constructor(
    appointmentRepo = appointmentRepository,
    userRepo = userRepository,
    auditRepo = auditRepository,
    notificationService = createNotificationService()
  ) {
    this.appointmentRepo = appointmentRepo;
    this.userRepo = userRepo;
    this.auditRepo = auditRepo;
    this.notificationService = notificationService;
  }

  async bookAppointment({ patientId, doctorId, appointmentTime, reason }) {
    const time = new Date(appointmentTime);
    if (Number.isNaN(time.getTime())) {
      throw new AppError('appointmentTime must be a valid date.', 400);
    }
    if (time.getTime() <= Date.now()) {
      throw new AppError('You cannot book an appointment in the past.', 400);
    }

    const doctor = await this.userRepo.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      throw new AppError('Selected doctor was not found.', 404);
    }

    const appointment = await this.appointmentRepo.bookAppointment({
      patientId,
      doctorId,
      appointmentTime: time,
      reason,
    });

    const patient = await this.userRepo.findById(patientId);
    await this.notificationService.sendBookingConfirmation(appointment, patient, doctor);
    await this.auditRepo.log({
      userId: patientId,
      action: 'BOOK',
      entity: 'appointment',
      entityId: appointment.id,
    });

    return appointment;
  }

  /**
   * FR-04: cancellation/rescheduling permitted up to 2 hours before the session.
   * requestingUser lets receptionists/patients cancel, but only their own
   * appointment unless they're a receptionist.
   */
  async cancelAppointment(appointmentId, requestingUser) {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const isOwner = appointment.patient_id === requestingUser.id;
    const isStaff = requestingUser.role === 'receptionist';
    if (!isOwner && !isStaff) {
      throw new AppError('You are not authorized to cancel this appointment.', 403);
    }

    const hoursUntil = (new Date(appointment.appointment_time) - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < CANCELLATION_WINDOW_HOURS && !isStaff) {
      throw new AppError(
        `Appointments can only be cancelled at least ${CANCELLATION_WINDOW_HOURS} hours in advance.`,
        400
      );
    }

    const updated = await this.appointmentRepo.cancelAppointment(appointmentId);

    const [patient, doctor] = await Promise.all([
      this.userRepo.findById(appointment.patient_id),
      this.userRepo.findById(appointment.doctor_id),
    ]);
    await this.notificationService.sendCancellationNotice(updated, patient, doctor);
    await this.auditRepo.log({
      userId: requestingUser.id,
      action: 'CANCEL',
      entity: 'appointment',
      entityId: appointmentId,
    });

    return updated;
  }

  async getPatientAppointments(patientId) {
    return this.appointmentRepo.findByPatient(patientId);
  }

  async getDoctorSchedule(doctorId, date) {
    return this.appointmentRepo.findByDoctor(doctorId, { date });
  }

  async getAllAppointments() {
    return this.appointmentRepo.findAll();
  }

  /**
   * FR-10: send reminders exactly 24h before an appointment.
   * Intended to be triggered by a scheduled job (see cron in server.js).
   */
  async sendDueReminders() {
    const due = await this.appointmentRepo.findUpcomingWithinWindow(24);
    for (const appt of due) {
      await this.notificationService.sendReminder(
        appt,
        { name: appt.patient_name, email: appt.patient_email },
        { name: appt.doctor_name }
      );
    }
    return due.length;
  }
}

module.exports = new AppointmentService();
module.exports.AppointmentService = AppointmentService;
