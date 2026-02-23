import React from 'react';
import './LiveLogs.css';

function LiveLogs({ events, eventsEndRef }) {
  const getEventClass = (type) => {
    if (type?.includes('SUCCESS')) return 'success';
    if (type?.includes('FAILURE') || type?.includes('ERROR')) return 'error';
    if (type?.includes('RETRY')) return 'warning';
    if (type?.includes('START')) return 'info';
    return 'default';
  };

  return (
    <div className="live-logs">
      <div className="logs-header">
        <h3>📝 Live Event Log</h3>
        <div className="live-indicator">
          <span className="pulse-dot"></span>
          <span className="live-text">LIVE</span>
        </div>
      </div>
      <div className="log-container">
        {events.length > 0 ? (
          <>
            {events.map((event, index) => (
              <div key={index} className={`log-entry ${getEventClass(event.type)}`}>
                <span className="log-time">{event.timestamp}</span>
                <span className="log-message">{event.message}</span>
              </div>
            ))}
            <div ref={eventsEndRef} />
          </>
        ) : (
          <div className="no-logs">
            <div className="no-logs-icon">📊</div>
            <p>Waiting for simulation events...</p>
            <p className="no-logs-hint">Start a simulation to see live logs</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveLogs;
