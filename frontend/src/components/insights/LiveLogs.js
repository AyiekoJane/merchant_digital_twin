import React, { useState, useMemo } from 'react';
import './LiveLogs.css';

function LiveLogs({ events, eventsEndRef, eventsContainerRef, autoScroll, setAutoScroll, onScroll }) {
  const [filterMerchant, setFilterMerchant] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  const getEventClass = (type) => {
    if (type?.includes('SUCCESS') || type?.includes('COMPLETE')) return 'success';
    if (type?.includes('FAILURE') || type?.includes('ERROR') || type?.includes('FAILED')) return 'error';
    if (type?.includes('RETRY') || type?.includes('VALIDATION')) return 'warning';
    if (type?.includes('START')) return 'info';
    return 'default';
  };

  const getSeverity = (type) => {
    if (type?.includes('FAILURE') || type?.includes('ERROR') || type?.includes('FAILED')) return 'error';
    if (type?.includes('VALIDATION') || type?.includes('RETRY')) return 'warning';
    if (type?.includes('SUCCESS') || type?.includes('COMPLETE')) return 'success';
    return 'info';
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filterMerchant && !event.merchantId?.includes(filterMerchant)) {
        return false;
      }
      if (filterType !== 'all' && event.type !== filterType) {
        return false;
      }
      if (showErrorsOnly && getSeverity(event.type) !== 'error') {
        return false;
      }
      return true;
    });
  }, [events, filterMerchant, filterType, showErrorsOnly]);

  const uniqueEventTypes = useMemo(() => {
    const types = new Set(events.map(e => e.type).filter(Boolean));
    return ['all', ...Array.from(types)];
  }, [events]);

  return (
    <div className="live-logs">
      <div className="logs-header">
        <h3>📝 Live Event Stream</h3>
        <div className="logs-header-controls">
          <label className="auto-scroll-toggle">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <span>Auto-scroll</span>
          </label>
          <div className="live-indicator">
            <span className="pulse-dot"></span>
            <span className="live-text">LIVE</span>
          </div>
        </div>
      </div>

      <div className="logs-filters">
        <input
          type="text"
          placeholder="Filter by merchant ID..."
          value={filterMerchant}
          onChange={(e) => setFilterMerchant(e.target.value)}
          className="filter-input"
        />
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          {uniqueEventTypes.map(type => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Events' : type}
            </option>
          ))}
        </select>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showErrorsOnly}
            onChange={(e) => setShowErrorsOnly(e.target.checked)}
          />
          <span>Errors Only</span>
        </label>

        <div className="event-count">
          {filteredEvents.length} / {events.length} events
        </div>
      </div>

      <div className="log-container" ref={eventsContainerRef} onScroll={onScroll}>
        {filteredEvents.length > 0 ? (
          <>
            {filteredEvents.map((event, index) => {
              const severity = getSeverity(event.type);
              return (
                <div key={index} className={`log-entry ${getEventClass(event.type)}`}>
                  <span className="log-time">{event.timestamp}</span>
                  <span className="log-merchant">{event.merchantId}</span>
                  <span className={`log-severity ${severity}`}>
                    {severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : severity === 'success' ? '✅' : 'ℹ️'}
                  </span>
                  <span className="log-type">{event.type}</span>
                  <span className="log-message">{event.message}</span>
                </div>
              );
            })}
            <div ref={eventsEndRef} />
          </>
        ) : (
          <div className="no-logs">
            <div className="no-logs-icon">📊</div>
            {events.length === 0 ? (
              <>
                <p>Waiting for simulation events...</p>
                <p className="no-logs-hint">Start a simulation to see live logs</p>
              </>
            ) : (
              <>
                <p>No events match your filters</p>
                <p className="no-logs-hint">Try adjusting your filter criteria</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveLogs;
