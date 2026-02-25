import React from 'react';
import './JourneyFunnel.css';

function JourneyFunnel({ funnelData }) {
  if (!funnelData || funnelData.length === 0) {
    return (
      <div className="journey-funnel empty">
        <h3 className="funnel-title">
          <span className="icon">🔄</span>
          Onboarding Journey
        </h3>
        <p className="empty-message">No journey data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...funnelData.map(step => step.entered));

  return (
    <div className="journey-funnel">
      <h3 className="funnel-title">
        <span className="icon">🔄</span>
        Onboarding Journey
      </h3>
      
      <div className="funnel-container">
        {funnelData.map((step, index) => {
          const widthPercent = (step.entered / maxCount) * 100;
          const completionRate = step.entered > 0 
            ? ((step.completed / step.entered) * 100).toFixed(1)
            : 0;
          const dropOffCount = step.entered - step.completed;
          const dropOffRate = step.entered > 0
            ? ((dropOffCount / step.entered) * 100).toFixed(1)
            : 0;

          return (
            <div key={step.stepId} className="funnel-step">
              <div className="step-header">
                <div className="step-info">
                  <span className="step-number">{index + 1}</span>
                  <span className="step-name">{step.name}</span>
                </div>
                <div className="step-stats">
                  <span className="stat-badge entered">{step.entered} entered</span>
                  <span className="stat-badge completed">{step.completed} completed</span>
                  {dropOffCount > 0 && (
                    <span className="stat-badge dropped">{dropOffCount} dropped</span>
                  )}
                </div>
              </div>
              
              <div className="funnel-bar-container">
                <div 
                  className="funnel-bar" 
                  style={{ width: `${widthPercent}%` }}
                  data-completion={completionRate}
                >
                  <div className="bar-fill" style={{ width: `${completionRate}%` }} />
                </div>
              </div>

              <div className="step-metrics">
                <div className="metric">
                  <span className="metric-label">Completion:</span>
                  <span className="metric-value success">{completionRate}%</span>
                </div>
                {dropOffCount > 0 && (
                  <div className="metric">
                    <span className="metric-label">Drop-off:</span>
                    <span className="metric-value warning">{dropOffRate}%</span>
                  </div>
                )}
                {step.avgRetries > 0 && (
                  <div className="metric">
                    <span className="metric-label">Avg Retries:</span>
                    <span className="metric-value">{step.avgRetries.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {index < funnelData.length - 1 && (
                <div className="funnel-arrow">↓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default JourneyFunnel;
