const BaseChannel = require('./base');

// USSD Channel - Placeholder for future implementation
class UssdChannel extends BaseChannel {
  constructor(config) {
    super(config);
    this.sessionId = null;
  }

  async initialize() {
    console.log('📱 USSD Channel - Not yet implemented');
    throw new Error('USSD channel is not yet implemented');
  }

  async executeOnboarding(merchantProfile) {
    throw new Error('USSD channel is not yet implemented');
  }

  async cleanup() {
    console.log('🧹 USSD cleanup');
  }
}

module.exports = UssdChannel;
