import React, { useState, useEffect } from 'react';
import './ChannelSimulation.css';

function ChannelSimulation() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('WEB');
  const [portalUrl, setPortalUrl] = useState('https://m-pesaforbusiness.co.ke/apply');
  const [merchantCount, setMerchantCount] = useState(5);
  const [simulationSpeed, setSimulationSpeed] = useState('normal');
  const [networkVariability, setNetworkVariability] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    merchants: null,
    network: null,
    bio: null
  });
  const [insights, setInsights] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    fetchChannels();
    fetchInsights();
    
    // Poll for insights every 5 seconds
    const interval = setInterval(fetchInsights, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch('http://localhost:3000/channels');
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch('http://localhost:3000/insights/summary');
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  const handleFileUpload = async (fileType, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch('http://localhost:3000/merchants/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(prev => ({ ...prev, [fileType]: file.name }));
        addLiveEvent(`✅ Uploaded ${file.name} - ${data.merchantCount} merchants loaded`);
      } else {
        addLiveEvent(`❌ Failed to upload ${file.name}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      addLiveEvent(`❌ Upload error: ${error.message}`);
    }
  };

  const handleRunSimulation = async () => {
    if (!uploadedFiles.merchants) {
      alert('Please upload merchant data CSV first');
      return;
    }

    setIsRunning(true);
    addLiveEvent(`🚀 Starting simulation with ${merchantCount} merchants on ${selectedChannel} channel`);

    try {
      const response = await fetch('http://localhost:3000/simulate/channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          merchantCount,
          channel: selectedChannel,
          portalUrl,
          simulationSpeed,
          networkVariability
        })
      });

      const data = await response.json();
      
      if (data.success) {
        addLiveEvent(`✅ Simulation started - ${data.merchantCount} agents spawned`);
      } else {
        addLiveEvent(`❌ Simulation failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      addLiveEvent(`❌ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const addLiveEvent = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLiveEvents(prev => [{ timestamp, message }, ...prev].slice(0, 50));
  };

  return (
    <div className="channel-simulation">
      <div className="simulation-header">
        <h2>🎯 Merchant Simulation Console</h2>
        <p>Channel-based onboarding simulation with real-time insights</p>
      </div>

      <div className="simulation-grid">
        {/* CSV Upload Section */}
        <div className="simulation-card">
          <h3>📁 CSV Upload</h3>
          <div className="upload-area">
            <FileUploadBox
              label="Merchant Onboarding Data"
              fileType="merchants"
              uploadedFile={uploadedFiles.merchants}
              onUpload={(file) => handleFileUpload('merchants', file)}
              required
            />
            <FileUploadBox
              label="Network Metrics CSV"
              fileType="network"
              uploadedFile={uploadedFiles.network}
              onUpload={(file) => handleFileUpload('network', file)}
            />
            <FileUploadBox
              label="Merchant Bio/Profile CSV"
              fileType="bio"
              uploadedFile={uploadedFiles.bio}
              onUpload={(file) => handleFileUpload('bio', file)}
            />
          </div>
        </div>

        {/* Channel Selection */}
        <div className="simulation-card">
          <h3>📡 Channel Selection</h3>
          <div className="channel-selector">
            {channels.map(channel => (
              <button
                key={channel.id}
                className={`channel-btn ${selectedChannel === channel.id ? 'active' : ''} ${!channel.enabled ? 'disabled' : ''}`}
                onClick={() => channel.enabled && setSelectedChannel(channel.id)}
                disabled={!channel.enabled}
              >
                <span className="channel-icon">
                  {channel.id === 'WEB' ? '🌐' : channel.id === 'USSD' ? '📱' : '📲'}
                </span>
                <span className="channel-name">{channel.name}</span>
                {!channel.enabled && <span className="channel-badge">Coming Soon</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Portal URL Input */}
        <div className="simulation-card">
          <h3>🔗 Portal Configuration</h3>
          <div className="portal-config">
            <label>Onboarding Portal URL</label>
            <input
              type="text"
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
              placeholder="https://m-pesaforbusiness.co.ke/apply"
              className="portal-input"
            />
            <p className="input-hint">URL where agents will attempt onboarding</p>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="simulation-card">
          <h3>⚙️ Simulation Controls</h3>
          <div className="controls-grid">
            <div className="control-group">
              <label>Number of Merchants</label>
              <input
                type="number"
                min="1"
                max="100"
                value={merchantCount}
                onChange={(e) => setMerchantCount(parseInt(e.target.value))}
                className="control-input"
              />
            </div>

            <div className="control-group">
              <label>Simulation Speed</label>
              <select
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(e.target.value)}
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
                  onChange={(e) => setNetworkVariability(e.target.checked)}
                />
                <span>Network Variability</span>
              </label>
            </div>
          </div>

          <button
            className="run-simulation-btn"
            onClick={handleRunSimulation}
            disabled={isRunning || !uploadedFiles.merchants}
          >
            {isRunning ? '⏳ Running...' : '▶️ RUN SIMULATION'}
          </button>
        </div>

        {/* Real-Time Insights */}
        <div className="simulation-card insights-card">
          <h3>📊 Real-Time Insights</h3>
          {insights ? (
            <div className="insights-grid">
              <InsightMetric
                label="Active Agents"
                value={insights.totalMerchants || 0}
                icon="🤖"
              />
              <InsightMetric
                label="Completion Rate"
                value={`${((insights.successRate || 0) * 100).toFixed(1)}%`}
                icon="✅"
              />
              <InsightMetric
                label="Avg Duration"
                value={`${((insights.avgCompletionTime || 0) / 1000).toFixed(1)}s`}
                icon="⏱️"
              />
              <InsightMetric
                label="Drop-offs"
                value={insights.totalFailures || 0}
                icon="❌"
              />
            </div>
          ) : (
            <p className="no-data">No simulation data yet</p>
          )}
        </div>

        {/* Live Event Log */}
        <div className="simulation-card events-card">
          <h3>📝 Live Event Log</h3>
          <div className="event-log">
            {liveEvents.length > 0 ? (
              liveEvents.map((event, index) => (
                <div key={index} className="event-item">
                  <span className="event-time">{event.timestamp}</span>
                  <span className="event-message">{event.message}</span>
                </div>
              ))
            ) : (
              <p className="no-events">No events yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileUploadBox({ label, fileType, uploadedFile, onUpload, required }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="file-upload-box">
      <label className="upload-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <div className="upload-input-wrapper">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="file-input"
          id={`upload-${fileType}`}
        />
        <label htmlFor={`upload-${fileType}`} className="file-input-label">
          {uploadedFile ? (
            <>
              <span className="file-icon">✅</span>
              <span className="file-name">{uploadedFile}</span>
            </>
          ) : (
            <>
              <span className="file-icon">📄</span>
              <span className="file-placeholder">Choose CSV file...</span>
            </>
          )}
        </label>
      </div>
    </div>
  );
}

function InsightMetric({ label, value, icon }) {
  return (
    <div className="insight-metric">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
      </div>
    </div>
  );
}

export default ChannelSimulation;
