import React from 'react';
import './AgentStatusGrid.css';

function AgentStatusGrid({ summary }) {
  const activeAgents = summary.totalMerchants || 0;
  const completedAgents = Math.round(activeAgents * (summary.successRate || 0));
  const failedAgents = activeAgents - completedAgents;

  return (
    <div className="agent-status-grid">
      <h3>🤖 Agent Status</h3>
      <div className="status-cards">
        <div className="status-card active">
          <div className="status-count">{activeAgents}</div>
          <div className="status-label">Active Agents</div>
        </div>
        <div className="status-card completed">
          <div className="status-count">{completedAgents}</div>
          <div className="status-label">Completed</div>
        </div>
        <div className="status-card failed">
          <div className="status-count">{failedAgents}</div>
          <div className="status-label">Failed</div>
        </div>
      </div>
    </div>
  );
}

export default AgentStatusGrid;
