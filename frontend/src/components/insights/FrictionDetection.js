import React from 'react';
import './FrictionDetection.css';

function FrictionDetection({ frictionData }) {
  if (!frictionData) {
    return (
      <div className="friction-detection empty">
        <h3 className="friction-title">
          <span className="icon">⚠️</span>
          Friction Detection
        </h3>
        <p className="empty-message">No friction data available</p>
      </div>
    );
  }

  const getSeverityClass = (score) => {
    if (score >= 0.7) return 'critical';
    if (score >= 0.4) return 'high';
    if (score >= 0.2) return 'medium';
    return 'low';
  };

  const getSeverityLabel = (score) => {
    if (score >= 0.7) return 'Critical';
    if (score >= 0.4) return 'High';
    if (score >= 0.2) return 'Medium';
    return 'Low';
  };

  return (
    <div className="friction-detection">
      <h3 className="friction-title">
        <span className="icon">⚠️</span>
        Friction Detection
        <span className="tooltip-icon" title="Identifies problematic steps causing user drop-off">ℹ️</span>
      </h3>

      {frictionData.mostProblematicStep && (
        <div className="problem-highlight">
          <div className="problem-icon">🚨</div>
          <div className="problem-content">
            <div className="problem-label">Most Problematic Step</div>
            <div className="problem-step">{frictionData.mostProblematicStep.name}</div>
            <div className="problem-stats">
              <span className="problem-stat">
                {frictionData.mostProblematicStep.dropOffRate}% drop-off
              </span>
              <span className="problem-stat">
                {frictionData.mostProblematicStep.avgRetries.toFixed(1)} avg retries
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="friction-metrics">
        <div className="friction-card">
          <div className="card-header">
            <span className="card-icon">❌</span>
            <span className="card-title">Validation Errors</span>
          </div>
          <div className="card-value">{frictionData.validationErrors || 0}</div>
          <div className="card-subtitle">Total errors encountered</div>
        </div>

        <div className="friction-card">
          <div className="card-header">
            <span className="card-icon">🔄</span>
            <span className="card-title">Avg Retries</span>
          </div>
          <div className="card-value">{(frictionData.avgRetries || 0).toFixed(1)}</div>
          <div className="card-subtitle">Per merchant</div>
        </div>

        <div className="friction-card">
          <div className="card-header">
            <span className="card-icon">⏱️</span>
            <span className="card-title">Avg Time/Step</span>
          </div>
          <div className="card-value">{(frictionData.avgTimePerStep || 0).toFixed(1)}s</div>
          <div className="card-subtitle">Time spent per step</div>
        </div>

        <div className={`friction-card severity ${getSeverityClass(frictionData.frictionScore || 0)}`}>
          <div className="card-header">
            <span className="card-icon">📊</span>
            <span className="card-title">Friction Score</span>
          </div>
          <div className="card-value">{((frictionData.frictionScore || 0) * 100).toFixed(0)}</div>
          <div className="card-subtitle">{getSeverityLabel(frictionData.frictionScore || 0)} severity</div>
        </div>
      </div>

      {frictionData.topErrors && frictionData.topErrors.length > 0 && (
        <div className="error-breakdown">
          <h4 className="breakdown-title">Top Error Types</h4>
          <div className="error-list">
            {frictionData.topErrors.map((error, index) => (
              <div key={index} className="error-item">
                <div className="error-bar-container">
                  <div className="error-info">
                    <span className="error-type">{error.type}</span>
                    <span className="error-count">{error.count} occurrences</span>
                  </div>
                  <div className="error-bar">
                    <div 
                      className="error-bar-fill" 
                      style={{ width: `${(error.count / frictionData.validationErrors) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FrictionDetection;
