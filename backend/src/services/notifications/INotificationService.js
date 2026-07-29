/**
 * INotificationService
 * -----------------------------------------------------------------
 * This is the "port" in a ports-and-adapters (hexagonal) style setup.
 * AppointmentService depends ONLY on this interface, never on a concrete
 * SMS/email provider. That's the Dependency Inversion Principle (the "D"
 * in SOLID): high-level business logic (booking appointments) does not
 * depend on low-level details (Twilio, SendGrid) — both depend on this
 * abstraction instead.
 *
 * Swapping providers (or using a fake one in tests) means writing a new
 * class that implements this interface — nothing in AppointmentService
 * has to change. That's also what makes AppointmentService trivially
 * unit-testable (see tests/appointmentService.test.js).
 */
class INotificationService {
  // eslint-disable-next-line no-unused-vars
  async sendBookingConfirmation(appointment, patient, doctor) {
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  async sendCancellationNotice(appointment, patient, doctor) {
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  async sendReminder(appointment, patient, doctor) {
    throw new Error('Not implemented');
  }
}

module.exports = INotificationService;
