import React, { useState, useEffect } from 'react';
import './MerchantViewer.css';

function MerchantViewer() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const res = await fetch('http://localhost:3000/merchants');
      const data = await res.json();
      setMerchants(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch merchants. Make sure merchant-generator is running.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="merchant-loading">
        <div className="spinner"></div>
        <p>Loading merchants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="merchant-error">
        <div className="error-icon">⚠️</div>
        <h3>Connection Error</h3>
        <p>{error}</p>
        <button onClick={fetchMerchants} className="retry-button">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="merchant-viewer fade-in">
      <div className="merchant-header">
        <div>
          <h2>Merchant Profiles</h2>
          <p>CSV-driven merchant data for simulations</p>
        </div>
        <div className="merchant-count">
          {merchants.length} merchants loaded
        </div>
      </div>

      <div className="merchant-grid">
        {merchants.map((merchant, index) => (
          <MerchantCard key={merchant.merchantId || index} merchant={merchant} />
        ))}
      </div>
    </div>
  );
}

function MerchantCard({ merchant }) {
  const getNetworkColor = (network) => {
    const colors = {
      '5G': '#4ade80',
      '4G': '#60a5fa',
      '3G': '#fbbf24',
      '2G': '#ef4444'
    };
    return colors[network] || '#64748b';
  };

  const getLiteracyIcon = (literacy) => {
    const icons = {
      'advanced': '🎓',
      'intermediate': '📚',
      'basic': '📖'
    };
    return icons[literacy] || '📄';
  };

  return (
    <div className="merchant-card">
      <div className="merchant-card-header">
        <div className="merchant-id">{merchant.merchantId}</div>
        <div 
          className="network-badge"
          style={{ 
            background: `${getNetworkColor(merchant.networkProfile)}20`,
            color: getNetworkColor(merchant.networkProfile),
            borderColor: `${getNetworkColor(merchant.networkProfile)}40`
          }}
        >
          {merchant.networkProfile}
        </div>
      </div>

      <div className="merchant-info">
        <div className="info-row">
          <span className="info-label">Income:</span>
          <span className="info-value">{merchant.incomeLevel}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Literacy:</span>
          <span className="info-value">
            {getLiteracyIcon(merchant.digitalLiteracy)} {merchant.digitalLiteracy}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Device:</span>
          <span className="info-value">{merchant.deviceType}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Patience:</span>
          <span className="info-value">{merchant.patienceScore.toFixed(2)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Max Retries:</span>
          <span className="info-value">{merchant.retryThreshold}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Issue:</span>
          <span className="info-value issue-type">{merchant.issueType}</span>
        </div>
      </div>
    </div>
  );
}

export default MerchantViewer;
