import React from 'react';
import './RunSimulationButton.css';

function RunSimulationButton({ isRunning, disabled, onClick }) {
  return (
    <div className="run-simulation-button">
      <button
        className={`run-btn ${isRunning ? 'running' : ''}`}
        onClick={onClick}
        disabled={isRunning || disabled}
      >
        {isRunning ? (
          <>
            <span className="spinner"></span>
            <span>Running Simulation...</span>
          </>
        ) : (
          <>
            <span className="play-icon">▶️</span>
            <span>RUN SIMULATION</span>
          </>
        )}
      </button>
      {disabled && !isRunning && (
        <p className="button-hint">Upload merchant data CSV to enable</p>
      )}
    </div>
  );
}

export default RunSimulationButton;
