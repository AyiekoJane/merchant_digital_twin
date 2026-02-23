// Channel Factory
const WebChannel = require('./web');
const UssdChannel = require('./ussd');
const AppChannel = require('./app');

const CHANNELS = {
  'WEB': WebChannel,
  'USSD': UssdChannel,
  'APP': AppChannel
};

function createChannel(channelType, config) {
  const ChannelClass = CHANNELS[channelType.toUpperCase()];
  
  if (!ChannelClass) {
    throw new Error(`Unknown channel type: ${channelType}. Available: ${Object.keys(CHANNELS).join(', ')}`);
  }
  
  return new ChannelClass(config);
}

function getAvailableChannels() {
  return Object.keys(CHANNELS);
}

module.exports = {
  createChannel,
  getAvailableChannels,
  WebChannel,
  UssdChannel,
  AppChannel
};
