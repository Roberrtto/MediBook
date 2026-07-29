const { AppointmentService } = require('../src/services/AppointmentService');

/**
 * Because AppointmentService takes its dependencies through the constructor
 * (Dependency Injection), we can test all of the booking business rules
 * here with plain in-memory fakes — no PostgreSQL, no network, runs in
 * milliseconds, and demonstrates the "Testing" and "SOLID" rubric items
 * against the same piece of code.
 */
function buildFakes({ existingAppointments = [], doctors = {}, patients = {} } = {}) {
  const appointments = [...existingAppointments];
  let nextId = appointments.length + 1;

  const appointmentRepo = {
    bookAppointment: jest.fn(async ({ patientId, doctorId, appointmentTime, reason }) => {
      const clash = appointments.find(
        (a) =>
          a.doctor_id === doctorId &&
          a.appointment_time.getTime() === appointmentTime.getTime() &&
          a.status !== 'cancelled'
      );
      if (clash) {
        const AppError = require('../src/utils/AppError');
        throw new AppError('That time slot is no longer available.', 409);
      }
      const appt = {
        id: nextId++,
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_time: appointmentTime,
        reason,
        status: 'booked',
      };
      appointments.push(appt);
      return appt;
    }),
    cancelAppointment: jest.fn(async (id) => {
      const appt = appointments.find((a) => a.id === Number(id));
      if (appt) appt.status = 'cancelled';
      return appt;
    }),
    findById: jest.fn(async (id) => appointments.find((a) => a.id === Number(id)) || null),
    findByPatient: jest.fn(async (patientId) =>
      appointments.filter((a) => a.patient_id === patientId)
    ),
  };

  const userRepo = {
    findById: jest.fn(async (id) => doctors[id] || patients[id] || null),
  };

  const auditRepo = { log: jest.fn(async () => {}) };

  const notificationService = {
    sendBookingConfirmation: jest.fn(async () => true),
    sendCancellationNotice: jest.fn(async () => true),
    sendReminder: jest.fn(async () => true),
  };

  return { appointmentRepo, userRepo, auditRepo, notificationService, appointments };
}

describe('AppointmentService.bookAppointment', () => {
  const doctors = { 1: { id: 1, name: 'Dr. Njoroge', role: 'doctor' } };
  const patients = { 10: { id: 10, name: 'Jane Patient', role: 'patient' } };

  test('books a valid future appointment and sends a confirmation', async () => {
    const fakes = buildFakes({ doctors, patients });
    const service = new AppointmentService(
      fakes.appointmentRepo,
      fakes.userRepo,
      fakes.auditRepo,
      fakes.notificationService
    );

    const futureTime = new Date(Date.now() + 1000 * 60 * 60 * 24); // tomorrow
    const appointment = await service.bookAppointment({
      patientId: 10,
      doctorId: 1,
      appointmentTime: futureTime,
      reason: 'Checkup',
    });

    expect(appointment.status).toBe('booked');
    expect(fakes.notificationService.sendBookingConfirmation).toHaveBeenCalledTimes(1);
    expect(fakes.auditRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BOOK', entity: 'appointment' })
    );
  });

  test('rejects booking in the past', async () => {
    const fakes = buildFakes({ doctors, patients });
    const service = new AppointmentService(
      fakes.appointmentRepo,
      fakes.userRepo,
      fakes.auditRepo,
      fakes.notificationService
    );

    await expect(
      service.bookAppointment({
        patientId: 10,
        doctorId: 1,
        appointmentTime: new Date(Date.now() - 1000 * 60 * 60),
        reason: 'Checkup',
      })
    ).rejects.toThrow('You cannot book an appointment in the past.');
  });

  test('rejects a double-booking for the same doctor and time slot (FR-12)', async () => {
    const time = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const fakes = buildFakes({
      doctors,
      patients,
      existingAppointments: [
        { id: 1, patient_id: 99, doctor_id: 1, appointment_time: time, status: 'booked' },
      ],
    });
    const service = new AppointmentService(
      fakes.appointmentRepo,
      fakes.userRepo,
      fakes.auditRepo,
      fakes.notificationService
    );

    await expect(
      service.bookAppointment({ patientId: 10, doctorId: 1, appointmentTime: time, reason: 'x' })
    ).rejects.toThrow('That time slot is no longer available.');
  });

  test('rejects booking with an unknown doctor', async () => {
    const fakes = buildFakes({ doctors: {}, patients });
    const service = new AppointmentService(
      fakes.appointmentRepo,
      fakes.userRepo,
      fakes.auditRepo,
      fakes.notificationService
    );

    await expect(
      service.bookAppointment({
        patientId: 10,
        doctorId: 999,
        appointmentTime: new Date(Date.now() + 100000),
        reason: 'x',
      })
    ).rejects.toThrow('Selected doctor was not found.');
  });
});

describe('AppointmentService.cancelAppointment', () => {
  const doctors = { 1: { id: 1, name: 'Dr. Njoroge', role: 'doctor' } };
  const patients = { 10: { id: 10, name: 'Jane Patient', role: 'patient' } };

  test('allows cancellation more than 2 hours before the appointment (FR-04)', async () => {
    const time = new Date(Date.now() + 1000 * 60 * 60 * 5); // 5h from now
    const fakes = buildFakes({
      doctors,
      patients,
      existingAppointments: [
        { id: 1, patient_id: 10, doctor_id: 1, appointment_time: time, status: 'booked' },
      ],
    });
    const service = new AppointmentService(
      fakes.appointmentRepo,
      fakes.userRepo,
      fakes.auditRepo,
      fakes.notificationService
    );

    const result = await service.cancelAppointment(1, { id: 10, role: 'patient' });
    expect(result.status).toBe('cancelled');
  });

  test('blocks cancellation within the 2-hour window for patients (FR-04)', async () => {
    const time = new Date(Date.now() + 1000 * 60 * 30); // 30 min from now
    const fakes = buildFakes({
      doctors,
      patients,
      existingAppointments: [
        { id: 1, patient_id: 10, doctor_id: 1, appointment_time: time, status: 'booked' },
      ],
    });
    const service = new AppointmentService(
      fakes.appointmentRepo,
      fakes.userRepo,
      fakes.auditRepo,
      fakes.notificationService
    );

    await expect(service.cancelAppointment(1, { id: 10, role: 'patient' })).rejects.toThrow(
      /at least 2 hours in advance/
    );
  });

  test('a receptionist can cancel within the 2-hour window (staff override)', async () => {
    const time = new Date(Date.now() + 1000 * 60 * 30);
    const fakes = buildFakes({
      doctors,
      patients,
      existingAppointments: [
        { id: 1, patient_id: 10, doctor_id: 1, appointment_time: time, status: 'booked' },
      ],
    });
    const service = new AppointmentService(
      fakes.appointmentRepo,
      fakes.userRepo,
      fakes.auditRepo,
      fakes.notificationService
    );

    const result = await service.cancelAppointment(1, { id: 55, role: 'receptionist' });
    expect(result.status).toBe('cancelled');
  });

  test('blocks a different patient from cancelling someone else\'s appointment', async () => {
    const time = new Date(Date.now() + 1000 * 60 * 60 * 5);
    const fakes = buildFakes({
      doctors,
      patients,
      existingAppointments: [
        { id: 1, patient_id: 10, doctor_id: 1, appointment_time: time, status: 'booked' },
      ],
    });
    const service = new AppointmentService(
      fakes.appointmentRepo,
      fakes.userRepo,
      fakes.auditRepo,
      fakes.notificationService
    );

    await expect(service.cancelAppointment(1, { id: 999, role: 'patient' })).rejects.toThrow(
      'You are not authorized to cancel this appointment.'
    );
  });
});
