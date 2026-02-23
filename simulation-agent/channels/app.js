const BaseChannel = require('./base');

// Mobile App Channel - Placeholder for future implementation
class AppChannel extends BaseChannel {
  constructor(config) {
    super(config);
    this.appSession = null;
  }

  async initialize() {
    console.log('📲 Mobile App Channel - Not yet implemented');
    throw new Error('Mobile App channel is not yet implemented');
  }

  async executeOnboarding(merchantProfile) {
    throw new Error('Mobile App channel is not yet implemented');
  }

  async cleanup() {
    console.log('🧹 App cleanup');
  }
}

module.exports = AppChannel;
