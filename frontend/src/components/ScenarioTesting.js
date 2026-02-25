import React, { useState, useEffect } from 'react';
import './ScenarioTesting.css';

function ScenarioTesting() {
  const [scenarios, setScenarios] = useState([]);
  const [baselineScenario, setBaselineScenario] = useState('baseline');
  const [modifiedScenario, setModifiedScenario] = useState({
    name: 'Modified Flow',
    modifications: []
  });
  const [comparisonResults, setComparisonResults] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch('http://localhost:3000/scenarios/list');
      const data = await response.json();
      setScenarios(data.scenarios || []);
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
    }
  };

  const addModification = (type) => {
    const modification = {
      id: Date.now(),
      type: type,
      description: getModificationDescription(type)
    };

    setModifiedScenario(prev => ({
      ...prev,
      modifications: [...prev.modifications, modification]
    }));

    // Auto-predict when modification is added
    predictImpact(type);
  };

  const removeModification = (id) => {
    setModifiedScenario(prev => ({
      ...prev,
      modifications: prev.modifications.filter(m => m.id !== id)
    }));
  };

  const getModificationDescription = (type) => {
    const descriptions = {
      'remove_step': 'Remove onboarding step',
      'add_verification': 'Add verification step',
      'reorder_steps': 'Reorder steps',
      'add_required_field': 'Add required field',
      'simplify_form': 'Simplify form fields',
      'add_help_text': 'Add help text',
      'reduce_fields': 'Reduce required fields',
      'improve_performance': 'Improve page load performance',
      'simplify_ui': 'Simplify user interface'
    };
    return descriptions[type] || type;
  };

  const predictImpact = async (changeType) => {
    setIsPredicting(true);
    
    try {
      const response = await fetch('http://localhost:3000/scenario/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioChange: {
            type: changeType,
            description: getModificationDescription(changeType)
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Failed to predict impact:', error);
    } finally {
      setIsPredicting(false);
    }
  };

  const runComparison = async () => {
    if (modifiedScenario.modifications.length === 0) {
      alert('Please add at least one modification');
      return;
    }

    setIsRunning(true);

    try {
      // Simulate running comparison
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock comparison results
      const mockResults = {
        baseline: {
          completionRate: 0.65,
          avgTime: 45000,
          dropOffRate: 0.35,
          frictionScore: 0.42
        },
        modified: {
          completionRate: 0.78,
          avgTime: 38000,
          dropOffRate: 0.22,
          frictionScore: 0.28
        },
        deltas: {
          completionRate: +0.13,
          avgTime: -7000,
          dropOffRate: -0.13,
          frictionScore: -0.14
        }
      };

      setComparisonResults(mockResults);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="scenario-testing">
      <div className="testing-header">
        <h2>🧪 Scenario Testing</h2>
        <p>Experiment with hypothetical flow modifications</p>
      </div>

      <div className="testing-grid">
        {/* Baseline Selection */}
        <div className="testing-card">
          <h3>📊 Baseline Scenario</h3>
          <select
            value={baselineScenario}
            onChange={(e) => setBaselineScenario(e.target.value)}
            className="scenario-select"
          >
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
          <p className="scenario-desc">
            Current onboarding flow to compare against
          </p>
        </div>

        {/* Modification Builder */}
        <div className="testing-card modifications-card">
          <h3>🔧 Flow Modifications</h3>
          
          <div className="modification-buttons">
            <button onClick={() => addModification('remove_step')} className="mod-btn">
              ➖ Remove Step
            </button>
            <button onClick={() => addModification('add_verification')} className="mod-btn">
              ✅ Add Verification
            </button>
            <button onClick={() => addModification('reduce_fields')} className="mod-btn">
              📝 Reduce Fields
            </button>
            <button onClick={() => addModification('add_help_text')} className="mod-btn">
              💡 Add Help Text
            </button>
            <button onClick={() => addModification('improve_performance')} className="mod-btn">
              ⚡ Improve Performance
            </button>
            <button onClick={() => addModification('simplify_ui')} className="mod-btn">
              ✨ Simplify UI
            </button>
          </div>

          <div className="modifications-list">
            <h4>Applied Modifications:</h4>
            {modifiedScenario.modifications.length > 0 ? (
              modifiedScenario.modifications.map(mod => (
                <div key={mod.id} className="modification-item">
                  <span className="mod-desc">{mod.description}</span>
                  <button
                    onClick={() => removeModification(mod.id)}
                    className="remove-mod-btn"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <p className="no-modifications">No modifications yet</p>
            )}
          </div>

          <button
            onClick={runComparison}
            disabled={isRunning || modifiedScenario.modifications.length === 0}
            className="run-comparison-btn"
          >
            {isRunning ? '⏳ Running...' : '▶️ RUN COMPARISON'}
          </button>
        </div>

        {/* AI Prediction Results */}
        {aiPrediction && (
          <div className="testing-card ai-prediction-card">
            <h3>🔮 AI Impact Prediction</h3>
            {isPredicting ? (
              <div className="prediction-loading">Analyzing...</div>
            ) : (
              <>
                <div className="prediction-metrics">
                  {aiPrediction.predictedImpact.completionRate && (
                    <div className="prediction-metric">
                      <div className="metric-name">Completion Rate</div>
                      <div className="metric-prediction">
                        <span className="current">{(aiPrediction.predictedImpact.completionRate.current * 100).toFixed(1)}%</span>
                        <span className="arrow">→</span>
                        <span className={`predicted ${aiPrediction.predictedImpact.completionRate.direction}`}>
                          {(aiPrediction.predictedImpact.completionRate.predicted * 100).toFixed(1)}%
                        </span>
                        <span className={`change ${aiPrediction.predictedImpact.completionRate.direction}`}>
                          {aiPrediction.predictedImpact.completionRate.change}
                        </span>
                      </div>
                    </div>
                  )}

                  {aiPrediction.predictedImpact.avgCompletionTime && (
                    <div className="prediction-metric">
                      <div className="metric-name">Avg Completion Time</div>
                      <div className="metric-prediction">
                        <span className="current">{(aiPrediction.predictedImpact.avgCompletionTime.current / 1000).toFixed(1)}s</span>
                        <span className="arrow">→</span>
                        <span className={`predicted ${aiPrediction.predictedImpact.avgCompletionTime.direction}`}>
                          {(aiPrediction.predictedImpact.avgCompletionTime.predicted / 1000).toFixed(1)}s
                        </span>
                        <span className={`change ${aiPrediction.predictedImpact.avgCompletionTime.direction}`}>
                          {aiPrediction.predictedImpact.avgCompletionTime.change}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {aiPrediction.riskAssessment && (
                  <div className={`risk-assessment risk-${aiPrediction.riskAssessment.overallRisk}`}>
                    <div className="risk-header">
                      <span className="risk-icon">
                        {aiPrediction.riskAssessment.overallRisk === 'high' ? '🔴' : 
                         aiPrediction.riskAssessment.overallRisk === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <span className="risk-level">{aiPrediction.riskAssessment.overallRisk.toUpperCase()} RISK</span>
                    </div>
                    <p className="risk-recommendation">{aiPrediction.riskAssessment.recommendation}</p>
                  </div>
                )}

                {aiPrediction.personaImpact && aiPrediction.personaImpact.length > 0 && (
                  <div className="persona-impact">
                    <h4>👥 Persona Impact</h4>
                    {aiPrediction.personaImpact.map((impact, idx) => (
                      <div key={idx} className="persona-impact-item">
                        <div className="persona-name">{impact.persona}</div>
                        <div className="impact-desc">{impact.impact}</div>
                        <div className="expected-improvement">{impact.expectedImprovement}</div>
                      </div>
                    ))}
                  </div>
                )}

                {aiPrediction.recommendations && aiPrediction.recommendations.length > 0 && (
                  <div className="ai-recommendations">
                    <h4>💡 Recommendations</h4>
                    {aiPrediction.recommendations.map((rec, idx) => (
                      <div key={idx} className={`recommendation-item priority-${rec.priority}`}>
                        <div className="rec-title">{rec.title}</div>
                        <div className="rec-desc">{rec.description}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="confidence-badge">
                  Confidence: {aiPrediction.predictedImpact.confidence || 'medium'}
                </div>
              </>
            )}
          </div>
        )}

        {/* Comparison Results */}
        {comparisonResults && (
          <div className="testing-card results-card">
            <h3>📈 Comparison Results</h3>
            
            <div className="results-grid">
              <ComparisonMetric
                label="Completion Rate"
                baseline={comparisonResults.baseline.completionRate}
                modified={comparisonResults.modified.completionRate}
                delta={comparisonResults.deltas.completionRate}
                format="percentage"
                higherIsBetter={true}
              />
              
              <ComparisonMetric
                label="Avg Time"
                baseline={comparisonResults.baseline.avgTime}
                modified={comparisonResults.modified.avgTime}
                delta={comparisonResults.deltas.avgTime}
                format="time"
                higherIsBetter={false}
              />
              
              <ComparisonMetric
                label="Drop-off Rate"
                baseline={comparisonResults.baseline.dropOffRate}
                modified={comparisonResults.modified.dropOffRate}
                delta={comparisonResults.deltas.dropOffRate}
                format="percentage"
                higherIsBetter={false}
              />
              
              <ComparisonMetric
                label="Friction Score"
                baseline={comparisonResults.baseline.frictionScore}
                modified={comparisonResults.modified.frictionScore}
                delta={comparisonResults.deltas.frictionScore}
                format="decimal"
                higherIsBetter={false}
              />
            </div>

            <div className="results-summary">
              <h4>Summary</h4>
              <p>
                The modified flow shows{' '}
                <strong>
                  {comparisonResults.deltas.completionRate > 0 ? 'improved' : 'decreased'}
                </strong>{' '}
                completion rate and{' '}
                <strong>
                  {comparisonResults.deltas.frictionScore < 0 ? 'reduced' : 'increased'}
                </strong>{' '}
                friction. Time to completion{' '}
                <strong>
                  {comparisonResults.deltas.avgTime < 0 ? 'decreased' : 'increased'}
                </strong>{' '}
                by {comparisonResults.deltas.avgTime != null ? Math.abs(comparisonResults.deltas.avgTime / 1000).toFixed(1) : '0'}s.
              </p>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="testing-card info-card">
          <h3>ℹ️ How It Works</h3>
          <ul className="info-list">
            <li>Select a baseline scenario to compare against</li>
            <li>Add hypothetical modifications to the flow</li>
            <li>Run virtual simulation with modified flow</li>
            <li>Compare metrics: completion rate, time, friction</li>
            <li>No actual portal changes are made</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ComparisonMetric({ label, baseline, modified, delta, format, higherIsBetter }) {
  const formatValue = (value) => {
    if (value == null) return 'N/A';
    if (format === 'percentage') {
      return `${(value * 100).toFixed(1)}%`;
    } else if (format === 'time') {
      return `${(value / 1000).toFixed(1)}s`;
    } else if (format === 'decimal') {
      return value.toFixed(2);
    }
    return value;
  };

  const formatDelta = (value) => {
    if (value == null) return 'N/A';
    const prefix = value > 0 ? '+' : '';
    if (format === 'percentage') {
      return `${prefix}${(value * 100).toFixed(1)}%`;
    } else if (format === 'time') {
      return `${prefix}${(value / 1000).toFixed(1)}s`;
    } else if (format === 'decimal') {
      return `${prefix}${value.toFixed(2)}`;
    }
    return `${prefix}${value}`;
  };

  const isImprovement = higherIsBetter ? delta > 0 : delta < 0;
  const deltaClass = isImprovement ? 'positive' : 'negative';

  return (
    <div className="comparison-metric">
      <div className="metric-label">{label}</div>
      <div className="metric-values">
        <div className="value-row">
          <span className="value-label">Baseline:</span>
          <span className="value">{formatValue(baseline)}</span>
        </div>
        <div className="value-row">
          <span className="value-label">Modified:</span>
          <span className="value">{formatValue(modified)}</span>
        </div>
      </div>
      <div className={`metric-delta ${deltaClass}`}>
        {isImprovement ? '↑' : '↓'} {formatDelta(delta)}
      </div>
    </div>
  );
}

export default ScenarioTesting;
