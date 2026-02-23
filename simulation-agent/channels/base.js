// Base Channel Interface
// All channels must implement these methods

class BaseChannel {
  constructor(config) {
    this.config = config;
    this.insights = [];
  }

  // Initialize channel (setup browser, connection, etc.)
  async initialize() {
    throw new Error('initialize() must be implemented by channel');
  }

  // Execute onboarding journey
  async executeOnboarding(merchantProfile) {
    throw new Error('executeOnboarding() must be implemented by channel');
  }

  // Cleanup resources
  async cleanup() {
    throw new Error('cleanup() must be implemented by channel');
  }

  // Collect insight
  collectInsight(insight) {
    this.insights.push({
      ...insight,
      timestamp: Date.now(),
      channel: this.constructor.name
    });
  }

  // Get all collected insights
  getInsights() {
    return this.insights;
  }
}

module.exports = BaseChannel;
