import React, { useState, useEffect } from 'react';
import './ScenarioManager.css';

function ScenarioManager() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarios, setSelectedScenarios] = useState(['BASELINE', 'SIMPLIFIED_FLOW']);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const res = await fetch('http://localhost:3000/insights/scenarios');
      const data = await res.json();
      setScenarios(data.scenarios || []);
    } catch (err) {
      console.error('Failed to fetch scenarios:', err);
    }
  };

  const compareScenarios = async () => {
    if (selectedScenarios.length !== 2) return;
    
    setLoading(true);
    try {
      const [scenarioA, scenarioB] = selectedScenarios;
      const res = await fetch(
        `http://localhost:3000/insights/compare?scenarioA=${scenarioA}&scenarioB=${scenarioB}`
      );
      const data = await res.json();
      setComparison(data);
    } catch (err) {
      console.error('Failed to compare scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleScenario = (scenario) => {
    if (selectedScenarios.includes(scenario)) {
      setSelectedScenarios(selectedScenarios.filter(s => s !== scenario));
    } else if (selectedScenarios.length < 2) {
      setSelectedScenarios([...selectedScenarios, scenario]);
    } else {
      setSelectedScenarios([selectedScenarios[1], scenario]);
    }
  };

  if (scenarios.length === 0) {
    return (
      <div className="scenario-empty">
        <div className="empty-icon">🎬</div>
        <h3>No Scenarios Available</h3>
        <p>Run a simulation to generate scenario data</p>
      </div>
    );
  }

  return (
    <div className="scenario-manager fade-in">
      <div className="scenario-header">
        <h2>Scenario Comparison</h2>
        <p>Compare performance across different product flows</p>
      </div>

      {/* Scenario Selection */}
      <div className="scenario-selection">
        <h3>Select Two Scenarios to Compare</h3>
        <div className="scenario-chips">
          {scenarios.map(scenario => (
            <button
              key={scenario}
              className={`scenario-chip ${selectedScenarios.includes(scenario) ? 'selected' : ''}`}
              onClick={() => toggleScenario(scenario)}
            >
              <span className="chip-icon">
                {selectedScenarios.includes(scenario) ? '✓' : '○'}
              </span>
              <span className="chip-label">{scenario}</span>
            </button>
          ))}
        </div>
        
        <button
          className="compare-button"
          onClick={compareScenarios}
          disabled={selectedScenarios.length !== 2 || loading}
        >
          {loading ? 'Comparing...' : `Compare ${selectedScenarios.length}/2 Scenarios`}
        </button>
      </div>

      {/* Comparison Results */}
      {comparison && !comparison.error && (
        <div className="comparison-results">
          <h3>Comparison Results</h3>
          
          {/* Side by Side */}
          <div className="comparison-grid">
            <ScenarioCard scenario={comparison.scenarioA} label="Scenario A" />
            <ScenarioCard scenario={comparison.scenarioB} label="Scenario B" />
          </div>

          {/* Deltas */}
          <div className="comparison-deltas">
            <h4>Performance Differences</h4>
            <div className="delta-grid">
              <DeltaCard
                label="Success Rate"
                value={comparison.comparison.successRateImprovementPercent}
                positive={comparison.comparison.successRateImprovement > 0}
                icon="📈"
              />
              <DeltaCard
                label="Retry Reduction"
                value={comparison.comparison.retryReductionPercent}
                positive={comparison.comparison.retryReduction > 0}
                icon="🔄"
              />
              <DeltaCard
                label="Completion Time"
                value={`${Math.abs(comparison.comparison.completionTimeDeltaSec)}s`}
                positive={comparison.comparison.completionTimeImprovement}
                icon="⏱️"
              />
              <DeltaCard
                label="Experience Score"
                value={comparison.comparison.experienceScoreDelta.toFixed(3)}
                positive={comparison.comparison.experienceScoreDelta > 0}
                icon="⭐"
              />
            </div>
          </div>

          {/* Recommendation */}
          <div className="recommendation-card">
            <div className="recommendation-header">
              <span className="recommendation-icon">🎯</span>
              <h4>Recommendation</h4>
            </div>
            <div className="recommendation-content">
              <div className="recommended-scenario">
                {comparison.recommendation.recommendedScenario}
              </div>
              <div className="recommendation-reason">
                {comparison.recommendation.reason}
              </div>
              <div className="recommendation-confidence">
                <span className="confidence-label">Confidence:</span>
                <span className={`confidence-badge ${comparison.recommendation.confidence.toLowerCase()}`}>
                  {comparison.recommendation.confidence}
                </span>
                <span className="confidence-sample">
                  (n={comparison.recommendation.sampleSize})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {comparison && comparison.error && (
        <div className="comparison-error">
          <p>{comparison.message}</p>
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ scenario, label }) {
  return (
    <div className="scenario-card">
      <div className="scenario-card-header">
        <span className="scenario-label">{label}</span>
        <span className="scenario-id">{scenario.id}</span>
      </div>
      <div className="scenario-stats">
        <StatRow label="Merchants" value={scenario.totalMerchants} />
        <StatRow label="Success Rate" value={scenario.successRatePercent} />
        <StatRow label="Avg Retries" value={scenario.averageRetries.toFixed(1)} />
        <StatRow label="Avg Time" value={`${scenario.averageCompletionTimeSec}s`} />
        <StatRow 
          label="Experience Score" 
          value={scenario.experienceScore.toFixed(2)}
          highlight
        />
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}:</span>
      <span className={`stat-value ${highlight ? 'highlight' : ''}`}>{value}</span>
    </div>
  );
}

function DeltaCard({ label, value, positive, icon }) {
  return (
    <div className={`delta-card ${positive ? 'positive' : 'negative'}`}>
      <div className="delta-icon">{icon}</div>
      <div className="delta-content">
        <div className="delta-label">{label}</div>
        <div className="delta-value">
          {positive ? '+' : ''}{value}
        </div>
      </div>
    </div>
  );
}

export default ScenarioManager;
