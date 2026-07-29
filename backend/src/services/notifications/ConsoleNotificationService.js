const INotificationService = require('./INotificationService');

/**
 * Dev/default adapter: logs to the console instead of sending a real SMS/email.
 * Lets the whole team run and demo the app without needing real Twilio/SendGrid
 * API keys. Swap NOTIFICATION_PROVIDER=twilio in .env to use the real one.
 */
class ConsoleNotificationService extends INotificationService {
  async sendBookingConfirmation(appointment, patient, doctor) {
    console.log(
      `[Notification] Booking confirmed for ${patient.name} with Dr. ${doctor.name} ` +
        `at ${appointment.appointment_time}`
    );
    return true;
  }

  async sendCancellationNotice(appointment, patient, doctor) {
    console.log(
      `[Notification] Appointment cancelled for ${patient.name} with Dr. ${doctor.name} ` +
        `(was ${appointment.appointment_time})`
    );
    return true;
  }

  async sendReminder(appointment, patient, doctor) {
    console.log(
      `[Notification] Reminder: ${patient.name}, you have an appointment with ` +
        `Dr. ${doctor.name} at ${appointment.appointment_time}`
    );
    return true;
  }
}

module.exports = ConsoleNotificationService;
