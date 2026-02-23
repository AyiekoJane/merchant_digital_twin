import React from 'react';
import './UrlInput.css';

function UrlInput({ portalUrl, onUrlChange }) {
  return (
    <div className="url-input">
      <h3>🔗 Portal Configuration</h3>
      <label>Onboarding Portal URL</label>
      <input
        type="text"
        value={portalUrl}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://m-pesaforbusiness.co.ke/apply"
        className="portal-input"
      />
      <p className="input-hint">URL where agents will attempt onboarding</p>
    </div>
  );
}

export default UrlInput;
