import React, { useState, useEffect } from 'react';
import './SimulationRunner.css';

function SimulationRunner() {
  const [scenarios, setScenarios] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const fetchScenarios = async () => {
    try {
      const res = await fetch('http://localhost:3000/scenarios');
      const data = await res.json();
      setScenarios(data);
    } catch (err) {
      addLog('error', 'Failed to fetch scenarios');
    }
  };

  const fetchMerchants = async () => {
    try {
      const res = await fetch('http://localhost:3000/merchants');
      const data = await res.json();
      setMerchants(data);
    } catch (err) {
      addLog('error', 'Failed to fetch merchants');
    }
  };

  useEffect(() => {
    fetchScenarios();
    fetchMerchants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { type, message, timestamp }]);
  };

  const runSimulation = async () => {
    if (running) return;
    
    setRunning(true);
    setLogs([]);
    addLog('info', '🎯 Starting multi-scenario simulation...');
    
    const totalSimulations = merchants.length * scenarios.length;
    setProgress({ current: 0, total: totalSimulations });
    
    addLog('info', `📊 ${merchants.length} merchants × ${scenarios.length} scenarios = ${totalSimulations} simulations`);
    
    // Clear previous data
    try {
      await fetch('http://localhost:3000/insights/clear', { method: 'DELETE' });
      addLog('success', '🗑️ Cleared previous simulation data');
    } catch (err) {
      addLog('warning', '⚠️ Could not clear previous data');
    }

    let currentCount = 0;

    // Run simulations for each scenario
    for (const scenario of scenarios) {
      addLog('info', `🎬 Running scenario: ${scenario.scenarioId}`);
      addLog('info', `   ${scenario.description}`);
      
      for (const merchant of merchants) {
        // Simulate agent execution (in real implementation, this would trigger Docker containers)
        await simulateAgent(merchant, scenario);
        currentCount++;
        setProgress({ current: currentCount, total: totalSimulations });
      }
      
      addLog('success', `✅ Completed ${scenario.scenarioId}`);
    }

    addLog('success', '🎉 All simulations completed!');
    addLog('info', '💡 View results in Dashboard or Scenarios tab');
    setRunning(false);
  };

  const simulateAgent = async (merchant, scenario) => {
    // Simulate agent behavior and send event to insight service
    // Enrich merchant with scenario config
    const scenarioConfig = {
      latencyMultiplier: scenario.latencyMultiplier,
      retryBonus: scenario.retryBonus,
      successProbabilityBonus: scenario.successProbabilityBonus
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate mock event
    const event = {
      merchantId: merchant.merchantId,
      scenarioId: scenario.scenarioId,
      eventType: Math.random() > 0.3 ? 'RESOLUTION_SUCCESS' : 'RESOLUTION_FAILURE',
      timestamp: new Date().toISOString(),
      retryCount: Math.floor(Math.random() * 3),
      duration: Math.random() * 5000,
      metadata: {
        networkProfile: merchant.networkProfile,
        digitalLiteracy: merchant.digitalLiteracy,
        incomeLevel: merchant.incomeLevel,
        scenarioConfig
      }
    };

    // Send to insight service
    try {
      await fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (err) {
      // Silently fail for demo purposes
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const progressPercent = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="simulation-runner fade-in">
      <div className="runner-header">
        <div>
          <h2>Simulation Runner</h2>
          <p>Execute multi-scenario simulations and compare outcomes</p>
        </div>
        <button 
          className={`run-button ${running ? 'running' : ''}`}
          onClick={runSimulation}
          disabled={running || scenarios.length === 0 || merchants.length === 0}
        >
          {running ? (
            <>
              <span className="spinner-small"></span>
              Running...
            </>
          ) : (
            <>
              <span>▶️</span>
              Run All Scenarios
            </>
          )}
        </button>
      </div>

      <div className="runner-grid">
        {/* Configuration Panel */}
        <div className="config-panel">
          <h3>Configuration</h3>
          
          <div className="config-section">
            <div className="config-label">Scenarios Loaded</div>
            <div className="config-value">{scenarios.length}</div>
          </div>

          <div className="scenario-list">
            {scenarios.map(scenario => (
              <div key={scenario.scenarioId} className="scenario-item">
                <div className="scenario-name">{scenario.scenarioId}</div>
                <div className="scenario-desc">{scenario.description}</div>
                <div className="scenario-params">
                  <span>Latency: {scenario.latencyMultiplier}x</span>
                  <span>Retry: +{scenario.retryBonus}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="config-section">
            <div className="config-label">Merchants Loaded</div>
            <div className="config-value">{merchants.length}</div>
          </div>

          <div className="config-section">
            <div className="config-label">Total Simulations</div>
            <div className="config-value highlight">
              {merchants.length * scenarios.length}
            </div>
          </div>
        </div>

        {/* Execution Panel */}
        <div className="execution-panel">
          <div className="panel-header">
            <h3>Execution Log</h3>
            <button 
              className="clear-button" 
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              Clear
            </button>
          </div>

          {running && (
            <div className="progress-bar-container">
              <div className="progress-info">
                <span>Progress: {progress.current} / {progress.total}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="log-container">
            {logs.length === 0 ? (
              <div className="log-empty">
                <div className="empty-icon">📋</div>
                <p>No logs yet. Click "Run All Scenarios" to start.</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!running && logs.length > 0 && (
        <div className="next-steps">
          <h3>Next Steps</h3>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">📊</div>
              <div className="step-title">View Dashboard</div>
              <div className="step-desc">Check real-time metrics and insights</div>
            </div>
            <div className="step-card">
              <div className="step-icon">🎬</div>
              <div className="step-title">Compare Scenarios</div>
              <div className="step-desc">Analyze performance differences</div>
            </div>
            <div className="step-card">
              <div className="step-icon">📈</div>
              <div className="step-title">Export Report</div>
              <div className="step-desc">Generate CLI comparison report</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimulationRunner;
