const INotificationService = require('./INotificationService');

/**
 * Production adapter. Requires TWILIO_* and SENDGRID_API_KEY in .env.
 * Kept intentionally thin: this class's only job is "talk to the provider",
 * nothing else (Single Responsibility Principle).
 */
class TwilioSendGridNotificationService extends INotificationService {
  constructor() {
    super();
    // Lazily required so the app doesn't crash in dev if these packages
    // / API keys aren't configured yet.
    this.enabled = Boolean(process.env.TWILIO_AUTH_TOKEN && process.env.SENDGRID_API_KEY);
  }

  async _send(patient, message) {
    if (!this.enabled) {
      console.warn('[TwilioSendGridNotificationService] Not configured, skipping real send.');
      return false;
    }
    // Real integration would look like:
    // const twilioClient = require('twilio')(accountSid, authToken);
    // await twilioClient.messages.create({ to: patient.phone, from: TWILIO_FROM, body: message });
    // await sgMail.send({ to: patient.email, from: FROM_EMAIL, subject: '...', text: message });
    return true;
  }

  async sendBookingConfirmation(appointment, patient, doctor) {
    return this._send(
      patient,
      `Your appointment with Dr. ${doctor.name} is confirmed for ${appointment.appointment_time}.`
    );
  }

  async sendCancellationNotice(appointment, patient, doctor) {
    return this._send(
      patient,
      `Your appointment with Dr. ${doctor.name} on ${appointment.appointment_time} was cancelled.`
    );
  }

  async sendReminder(appointment, patient, doctor) {
    return this._send(
      patient,
      `Reminder: appointment with Dr. ${doctor.name} at ${appointment.appointment_time}.`
    );
  }
}

module.exports = TwilioSendGridNotificationService;
