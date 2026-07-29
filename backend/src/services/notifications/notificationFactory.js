const ConsoleNotificationService = require('./ConsoleNotificationService');
const TwilioSendGridNotificationService = require('./TwilioSendGridNotificationService');

/**
 * Adding a new provider (e.g. WhatsApp) later means adding one more `case`
 * here and a new class that implements INotificationService — nothing that
 * already works has to be touched. That's the Open/Closed Principle: open
 * for extension, closed for modification.
 */
function createNotificationService() {
  const provider = process.env.NOTIFICATION_PROVIDER || 'console';
  switch (provider) {
    case 'twilio':
      return new TwilioSendGridNotificationService();
    case 'console':
    default:
      return new ConsoleNotificationService();
  }
}

module.exports = createNotificationService;
