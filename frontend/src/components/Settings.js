import React, { useState } from 'react';
import './Settings.css';

function Settings() {
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:3000');
  const [defaultMerchantCount, setDefaultMerchantCount] = useState(5);
  const [defaultSpeed, setDefaultSpeed] = useState('normal');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('apiBaseUrl', apiBaseUrl);
    localStorage.setItem('defaultMerchantCount', defaultMerchantCount);
    localStorage.setItem('defaultSpeed', defaultSpeed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Configure simulation defaults and API endpoints</p>
      </div>

      <div className="settings-content">
        <div className="setting-group">
          <label>Backend API URL</label>
          <input
            type="text"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder="http://localhost:3000"
          />
          <p className="setting-hint">Base URL for backend API</p>
        </div>

        <div className="setting-group">
          <label>Default Merchant Count</label>
          <input
            type="number"
            min="1"
            max="100"
            value={defaultMerchantCount}
            onChange={(e) => setDefaultMerchantCount(parseInt(e.target.value))}
          />
          <p className="setting-hint">Number of merchants per simulation</p>
        </div>

        <div className="setting-group">
          <label>Default Simulation Speed</label>
          <select value={defaultSpeed} onChange={(e) => setDefaultSpeed(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="accelerated">Accelerated</option>
          </select>
          <p className="setting-hint">Simulation execution speed</p>
        </div>

        <button className="save-button" onClick={handleSave}>
          {saved ? '✅ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default Settings;
