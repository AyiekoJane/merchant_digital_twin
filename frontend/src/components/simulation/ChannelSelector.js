import React, { useState, useEffect } from 'react';
import './ChannelSelector.css';

function ChannelSelector({ selectedChannel, onChannelSelect }) {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch('http://localhost:3000/channels');
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  return (
    <div className="channel-selector">
      <h3>📡 Channel Selection</h3>
      <div className="channel-grid">
        {channels.map(channel => (
          <button
            key={channel.id}
            className={`channel-btn ${selectedChannel === channel.id ? 'active' : ''} ${!channel.enabled ? 'disabled' : ''}`}
            onClick={() => channel.enabled && onChannelSelect(channel.id)}
            disabled={!channel.enabled}
          >
            <span className="channel-icon">
              {channel.id === 'WEB' ? '🌐' : channel.id === 'USSD' ? '📱' : '📲'}
            </span>
            <span className="channel-name">{channel.name}</span>
            {!channel.enabled && <span className="channel-badge">Coming Soon</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ChannelSelector;
