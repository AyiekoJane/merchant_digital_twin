import React from 'react';
import './SimulationControls.css';

function SimulationControls({
  merchantCount,
  simulationSpeed,
  networkVariability,
  onMerchantCountChange,
  onSpeedChange,
  onVariabilityChange
}) {
  return (
    <div className="simulation-controls">
      <h3>⚙️ Simulation Controls</h3>
      <div className="controls-grid">
        <div className="control-group">
          <label>Number of Merchants</label>
          <input
            type="number"
            min="1"
            max="100"
            value={merchantCount}
            onChange={(e) => onMerchantCountChange(parseInt(e.target.value))}
            className="control-input"
          />
        </div>

        <div className="control-group">
          <label>Simulation Speed</label>
          <select
            value={simulationSpeed}
            onChange={(e) => onSpeedChange(e.target.value)}
            className="control-select"
          >
            <option value="normal">Normal</option>
            <option value="accelerated">Accelerated</option>
          </select>
        </div>

        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={networkVariability}
              onChange={(e) => onVariabilityChange(e.target.checked)}
            />
            <span>Network Variability</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default SimulationControls;
