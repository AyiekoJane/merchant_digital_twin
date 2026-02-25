import React from 'react';
import './AIRecommendations.css';

function AIRecommendations({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendations-empty">
        <p>No recommendations available yet. Run a simulation to generate recommendations.</p>
      </div>
    );
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'ux': return '🎨';
      case 'performance': return '⚡';
      case 'accessibility': return '♿';
      case 'technical': return '🔧';
      default: return '💡';
    }
  };

  return (
    <div className="ai-recommendations">
      <div className="recommendations-header">
        <h3>💡 AI Recommendations</h3>
        <span className="rec-count">{recommendations.length} suggestions</span>
      </div>

      <div className="recommendations-list">
        {recommendations.map((rec, idx) => (
          <div key={idx} className={`recommendation-card priority-${rec.priority}`}>
            <div className="rec-header">
              <div className="rec-title-row">
                <span className="priority-icon">{getPriorityIcon(rec.priority)}</span>
                <span className="category-icon">{getCategoryIcon(rec.category)}</span>
                <h4>{rec.title}</h4>
              </div>
              <span className={`priority-badge ${rec.priority}`}>
                {rec.priority}
              </span>
            </div>

            <p className="rec-description">{rec.description}</p>

            <div className="rec-footer">
              <div className="rec-impact">
                <span className="label">Impact:</span>
                <span className="value">{rec.impact}</span>
              </div>
              <div className="rec-effort">
                <span className="label">Effort:</span>
                <span className={`effort-badge ${rec.effort}`}>
                  {rec.effort}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AIRecommendations;
