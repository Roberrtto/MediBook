require('dotenv').config();
const app = require('./app');
const appointmentService = require('./services/AppointmentService');

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`MediBook API listening on port ${PORT}`);
});

// FR-10: fire reminders 24h ahead of an appointment. In production this
// would run as a scheduled GitHub Actions / cron job hitting a dedicated
// endpoint, but a simple in-process interval is enough for local dev/demo.
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    appointmentService.sendDueReminders().catch((err) => {
      console.error('Failed to send reminders:', err.message);
    });
  }, 60 * 60 * 1000); // hourly
}

module.exports = server;
