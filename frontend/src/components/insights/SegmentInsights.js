import React, { useState } from 'react';
import './SegmentInsights.css';

function SegmentInsights({ segmentData }) {
  const [activeTab, setActiveTab] = useState('network');

  if (!segmentData) {
    return (
      <div className="segment-insights empty">
        <h3 className="segment-title">
          <span className="icon">👥</span>
          Merchant Segment Insights
        </h3>
        <p className="empty-message">No segment data available</p>
      </div>
    );
  }

  const tabs = [
    { id: 'network', label: 'Network', icon: '📡', data: segmentData.byNetwork },
    { id: 'literacy', label: 'Digital Literacy', icon: '📚', data: segmentData.byLiteracy },
    { id: 'device', label: 'Device Type', icon: '📱', data: segmentData.byDevice },
    { id: 'income', label: 'Income Level', icon: '💰', data: segmentData.byIncome }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="segment-insights">
      <h3 className="segment-title">
        <span className="icon">👥</span>
        Merchant Segment Insights
        <span className="tooltip-icon" title="Compare outcomes across merchant attributes">ℹ️</span>
      </h3>

      <div className="segment-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="segment-content">
        {activeTabData && activeTabData.data && Object.keys(activeTabData.data).length > 0 ? (
          <div className="segment-grid">
            {Object.entries(activeTabData.data).map(([key, stats]) => (
              <SegmentCard
                key={key}
                segmentName={key}
                stats={stats}
                icon={activeTabData.icon}
              />
            ))}
          </div>
        ) : (
          <div className="no-data-message">
            <p>No data available for {activeTabData?.label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SegmentCard({ segmentName, stats, icon }) {
  const successRate = (stats.successRate || 0) * 100;
  const dropOffRate = (stats.failureRate || 0) * 100;
  
  const getSuccessClass = (rate) => {
    if (rate >= 80) return 'excellent';
    if (rate >= 60) return 'good';
    if (rate >= 40) return 'fair';
    return 'poor';
  };

  return (
    <div className={`segment-card ${getSuccessClass(successRate)}`}>
      <div className="segment-header">
        <span className="segment-icon">{icon}</span>
        <span className="segment-name">{segmentName}</span>
      </div>

      <div className="segment-metrics">
        <div className="metric-row">
          <span className="metric-label">Merchants:</span>
          <span className="metric-value">{stats.totalMerchants || 0}</span>
        </div>
        
        <div className="metric-row highlight">
          <span className="metric-label">Success Rate:</span>
          <span className={`metric-value ${getSuccessClass(successRate)}`}>
            {successRate.toFixed(1)}%
          </span>
        </div>

        {dropOffRate > 0 && (
          <div className="metric-row">
            <span className="metric-label">Drop-off:</span>
            <span className="metric-value warning">{dropOffRate.toFixed(1)}%</span>
          </div>
        )}

        <div className="metric-row">
          <span className="metric-label">Avg Attempts:</span>
          <span className="metric-value">{(stats.avgAttempts || 0).toFixed(1)}</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Avg Time:</span>
          <span className="metric-value">
            {((stats.avgCompletionTimeMs || 0) / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      <div className="success-bar">
        <div 
          className="success-fill" 
          style={{ width: `${successRate}%` }}
        />
      </div>
    </div>
  );
}

export default SegmentInsights;
