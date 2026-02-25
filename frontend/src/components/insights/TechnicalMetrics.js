import React from 'react';
import './TechnicalMetrics.css';

function TechnicalMetrics({ technicalData }) {
  if (!technicalData) {
    return (
      <div className="technical-metrics empty">
        <h3 className="tech-title">
          <span className="icon">⚡</span>
          Technical Performance
        </h3>
        <p className="empty-message">No performance data available</p>
      </div>
    );
  }

  const getLatencyClass = (latency) => {
    if (latency < 200) return 'excellent';
    if (latency < 500) return 'good';
    if (latency < 1000) return 'fair';
    return 'poor';
  };

  return (
    <div className="technical-metrics">
      <h3 className="tech-title">
        <span className="icon">⚡</span>
        Technical Performance
        <span className="tooltip-icon" title="Network and system performance metrics">ℹ️</span>
      </h3>

      <div className="tech-grid">
        <div className={`tech-card ${getLatencyClass(technicalData.avgPageLoadTime || 0)}`}>
          <div className="tech-icon">🌐</div>
          <div className="tech-content">
            <div className="tech-label">Page Load Time</div>
            <div className="tech-value">{(technicalData.avgPageLoadTime || 0).toFixed(0)}ms</div>
            <div className="tech-trend">
              {technicalData.pageLoadTrend > 0 ? '↑' : '↓'} 
              {Math.abs(technicalData.pageLoadTrend || 0).toFixed(0)}ms
            </div>
          </div>
        </div>

        <div className={`tech-card ${getLatencyClass(technicalData.avgApiLatency || 0)}`}>
          <div className="tech-icon">🔌</div>
          <div className="tech-content">
            <div className="tech-label">API Latency</div>
            <div className="tech-value">{(technicalData.avgApiLatency || 0).toFixed(0)}ms</div>
            <div className="tech-trend">
              {technicalData.apiLatencyTrend > 0 ? '↑' : '↓'} 
              {Math.abs(technicalData.apiLatencyTrend || 0).toFixed(0)}ms
            </div>
          </div>
        </div>

        <div className={`tech-card ${getLatencyClass(technicalData.avgNetworkDelay || 0)}`}>
          <div className="tech-icon">📡</div>
          <div className="tech-content">
            <div className="tech-label">Network Delay</div>
            <div className="tech-value">{(technicalData.avgNetworkDelay || 0).toFixed(0)}ms</div>
            <div className="tech-subtitle">Simulated latency</div>
          </div>
        </div>

        <div className="tech-card">
          <div className="tech-icon">⏱️</div>
          <div className="tech-content">
            <div className="tech-label">Timeouts</div>
            <div className="tech-value">{technicalData.timeoutCount || 0}</div>
            <div className="tech-subtitle">Total occurrences</div>
          </div>
        </div>
      </div>

      {technicalData.performanceByNetwork && (
        <div className="network-performance">
          <h4 className="section-title">Performance by Network</h4>
          <div className="network-grid">
            {Object.entries(technicalData.performanceByNetwork).map(([network, perf]) => (
              <div key={network} className="network-item">
                <div className="network-header">
                  <span className="network-name">{network}</span>
                  <span className="network-count">{perf.count} merchants</span>
                </div>
                <div className="network-stats">
                  <div className="stat">
                    <span className="stat-label">Avg Latency:</span>
                    <span className={`stat-value ${getLatencyClass(perf.avgLatency)}`}>
                      {perf.avgLatency.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Success Rate:</span>
                    <span className="stat-value">
                      {(perf.successRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="latency-bar">
                  <div 
                    className="latency-fill" 
                    style={{ width: `${Math.min((perf.avgLatency / 2000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TechnicalMetrics;
