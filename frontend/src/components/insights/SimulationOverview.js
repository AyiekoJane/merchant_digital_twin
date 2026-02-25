import React from 'react';
import './SimulationOverview.css';

function SimulationOverview({ summary, activeAgents, progress }) {
  const completedMerchants = summary?.totalMerchants || 0;
  const failedAttempts = completedMerchants > 0 
    ? Math.round(completedMerchants * (1 - (summary?.successRate || 0)))
    : 0;
  const avgDuration = summary?.averageCompletionTimeSec || 0;
  const progressPercent = progress || 0;

  return (
    <div className="simulation-overview">
      <h3 className="overview-title">
        <span className="icon">📊</span>
        Simulation Overview
      </h3>
      
      <div className="overview-grid">
        <div className="overview-card active">
          <div className="card-icon">🤖</div>
          <div className="card-content">
            <div className="card-value">{activeAgents}</div>
            <div className="card-label">Active Agents</div>
          </div>
        </div>

        <div className="overview-card completed">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <div className="card-value">{completedMerchants}</div>
            <div className="card-label">Completed</div>
          </div>
        </div>

        <div className="overview-card failed">
          <div className="card-icon">❌</div>
          <div className="card-content">
            <div className="card-value">{failedAttempts}</div>
            <div className="card-label">Failed Attempts</div>
          </div>
        </div>

        <div className="overview-card duration">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <div className="card-value">{avgDuration.toFixed(1)}s</div>
            <div className="card-label">Avg Duration</div>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Simulation Progress</span>
          <span className="progress-percent">{progressPercent}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default SimulationOverview;
