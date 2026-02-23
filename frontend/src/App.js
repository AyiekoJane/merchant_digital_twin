import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ScenarioManager from './components/ScenarioManager';
import MerchantViewer from './components/MerchantViewer';
import SimulationRunner from './components/SimulationRunner';
import ChannelSimulation from './components/ChannelSimulation';
import ScenarioTesting from './components/ScenarioTesting';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [services, setServices] = useState({
    backend: 'checking'
  });

  useEffect(() => {
    const checkServices = async () => {
      try {
        const backendRes = await fetch('http://localhost:3000/health');
        const backendData = await backendRes.json();
        setServices({ backend: backendData.status === 'healthy' ? 'online' : 'offline' });
      } catch {
        setServices({ backend: 'offline' });
      }
    };

    checkServices();
    const interval = setInterval(checkServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'Real-time insights & metrics' },
    { id: 'channel', label: 'Channel Simulation', icon: '🌐', desc: 'Portal-based onboarding' },
    { id: 'testing', label: 'Scenario Testing', icon: '🧪', desc: 'Experiment with flow changes' },
    { id: 'scenarios', label: 'Scenarios', icon: '🎬', desc: 'Manage simulation scenarios' },
    { id: 'merchants', label: 'Merchants', icon: '🏪', desc: 'View merchant profiles' },
    { id: 'runner', label: 'Run Simulation', icon: '▶️', desc: 'Execute multi-scenario tests' }
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">🎯</div>
          <div className="brand-text">
            <h1>Digital Twin Simulation</h1>
            <p>Scenario-Based Experimentation Engine v4.0</p>
          </div>
        </div>

        <div className="header-status">
          <StatusIndicator label="Backend API" status={services.backend} port="3000" />
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <div className="tab-content">
              <span className="tab-label">{tab.label}</span>
              <span className="tab-desc">{tab.desc}</span>
            </div>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'channel' && <ChannelSimulation />}
        {activeTab === 'testing' && <ScenarioTesting />}
        {activeTab === 'scenarios' && <ScenarioManager />}
        {activeTab === 'merchants' && <MerchantViewer />}
        {activeTab === 'runner' && <SimulationRunner />}
      </main>
    </div>
  );
}

function StatusIndicator({ label, status, port }) {
  const colors = {
    online: '#4ade80',
    offline: '#ef4444',
    checking: '#fbbf24'
  };

  return (
    <div className="status-indicator">
      <div 
        className="status-dot" 
        style={{ 
          backgroundColor: colors[status],
          animation: status === 'checking' ? 'pulse 1.5s infinite' : 'none'
        }}
      />
      <div className="status-text">
        <span className="status-label">{label}</span>
        <span className="status-port">:{port}</span>
      </div>
    </div>
  );
}

export default App;
