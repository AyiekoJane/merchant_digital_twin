import React, { useState, useEffect, useRef } from 'react';
import './ComplianceReport.css';

const API = 'http://localhost:3000';

function ComplianceReport() {
  const [summary, setSummary]       = useState(null);
  const [byNetwork, setByNetwork]   = useState({});
  const [byLiteracy, setByLiteracy] = useState({});
  const [scenarios, setScenarios]   = useState([]);
  const [byScenario, setByScenario] = useState({});
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, n, l, sc, bsc] = await Promise.all([
        fetch(`${API}/insights/summary`).then(r => r.json()),
        fetch(`${API}/insights/by-network`).then(r => r.json()),
        fetch(`${API}/insights/by-literacy`).then(r => r.json()),
        fetch(`${API}/insights/scenarios`).then(r => r.json()),
        fetch(`${API}/insights/by-scenario`).then(r => r.json()),
      ]);
      setSummary(s);
      setByNetwork(n || {});
      setByLiteracy(l || {});
      setScenarios(sc.scenarios || []);
      setByScenario(bsc || {});
    } catch (e) {
      console.error('Failed to load report data', e);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const reportId = `MDT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  const dateStr  = now.toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
  const timeStr  = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

  const handlePrint = () => {
    setGenerating(true);
    setTimeout(() => { window.print(); setGenerating(false); }, 300);
  };

  const rateColor = (r) => {
    if (r >= 0.8) return '#4ade80';
    if (r >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const pct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';

  if (loading) return (
    <div className="cr-loading">
      <div className="cr-spinner" />
      <p>Loading simulation data…</p>
    </div>
  );

  if (!summary || summary.totalMerchants === 0) return (
    <div className="cr-empty">
      <div className="cr-empty-icon">📋</div>
      <h3>No simulation data available</h3>
      <p>Run a simulation first, then return here to generate a compliance report.</p>
    </div>
  );

  return (
    <div className="cr-wrap">
      {/* Toolbar */}
      <div className="cr-toolbar no-print">
        <div className="cr-toolbar-left">
          <h2>Compliance Report</h2>
          <span className="cr-report-id">{reportId}</span>
        </div>
        <div className="cr-toolbar-right">
          <button className="cr-refresh-btn" onClick={fetchAll}>↻ Refresh Data</button>
          <button className="cr-print-btn" onClick={handlePrint} disabled={generating}>
            {generating ? 'Preparing…' : '⬇ Download / Print'}
          </button>
        </div>
      </div>

      {/* ── Printable Report ── */}
      <div className="cr-report" ref={reportRef}>

        {/* Cover */}
        <div className="cr-cover">
          <div className="cr-cover-logo">🎯</div>
          <h1 className="cr-cover-title">Merchant Digital Twin</h1>
          <p className="cr-cover-sub">Simulation Compliance Report</p>
          <div className="cr-cover-meta">
            <div className="cr-meta-row"><span>Report ID</span><strong>{reportId}</strong></div>
            <div className="cr-meta-row"><span>Generated</span><strong>{dateStr} at {timeStr}</strong></div>
            <div className="cr-meta-row"><span>Classification</span><strong>INTERNAL — COMPLIANCE USE ONLY</strong></div>
            <div className="cr-meta-row"><span>Platform</span><strong>Merchant Digital Twin v1.0</strong></div>
          </div>
        </div>

        <div className="cr-divider" />

        {/* Executive Summary */}
        <section className="cr-section">
          <h2 className="cr-section-title">1. Executive Summary</h2>
          <p className="cr-section-desc">
            This report summarises the outcomes of merchant onboarding simulations conducted on the
            Merchant Digital Twin platform. It is intended for internal compliance, risk, and product
            teams to assess onboarding channel performance and identify friction points.
          </p>
          <div className="cr-kpi-grid">
            <KPI label="Total Merchants Simulated" value={summary.totalMerchants} icon="🏪" />
            <KPI label="Overall Success Rate"       value={summary.successRatePercent} icon="✅" color={rateColor(summary.successRate)} />
            <KPI label="Drop-off Rate"              value={pct(1 - summary.successRate)} icon="⚠️" color={summary.successRate < 0.8 ? '#ef4444' : '#4ade80'} />
            <KPI label="Scenarios Tested"           value={scenarios.length || '—'} icon="🧩" />
          </div>
        </section>

        <div className="cr-divider" />

        {/* Scenario Breakdown */}
        {Object.keys(byScenario).length > 0 && (
          <section className="cr-section">
            <h2 className="cr-section-title">2. Scenario Performance</h2>
            <p className="cr-section-desc">
              Each scenario represents a distinct onboarding configuration. Results below reflect
              simulated merchant journeys per scenario.
            </p>
            <table className="cr-table">
              <thead>
                <tr>
                  <th>Scenario ID</th>
                  <th>Merchants</th>
                  <th>Success Rate</th>
                  <th>Avg Attempts</th>
                  <th>Exp. Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byScenario).map(([id, d]) => (
                  <tr key={id}>
                    <td><code>{id}</code></td>
                    <td>{d.totalMerchants ?? '—'}</td>
                    <td style={{ color: rateColor(d.successRate) }}>{pct(d.successRate)}</td>
                    <td>{d.avgAttempts != null ? d.avgAttempts.toFixed(1) : '—'}</td>
                    <td>{d.avgExperienceScore != null ? d.avgExperienceScore.toFixed(2) : '—'}</td>
                    <td><StatusBadge rate={d.successRate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div className="cr-divider" />

        {/* Network Breakdown */}
        {Object.keys(byNetwork).length > 0 && (
          <section className="cr-section">
            <h2 className="cr-section-title">3. Performance by Network Condition</h2>
            <p className="cr-section-desc">
              Simulations were run across multiple network profiles to assess resilience under
              varying connectivity conditions.
            </p>
            <table className="cr-table">
              <thead>
                <tr>
                  <th>Network Profile</th>
                  <th>Merchants</th>
                  <th>Success Rate</th>
                  <th>Avg Attempts</th>
                  <th>Exp. Score</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byNetwork).map(([net, d]) => (
                  <tr key={net}>
                    <td>{net}</td>
                    <td>{d.totalMerchants ?? '—'}</td>
                    <td style={{ color: rateColor(d.successRate) }}>{pct(d.successRate)}</td>
                    <td>{d.avgAttempts != null ? d.avgAttempts.toFixed(1) : '—'}</td>
                    <td>{d.avgExperienceScore != null ? d.avgExperienceScore.toFixed(2) : '—'}</td>
                    <td><StatusBadge rate={d.successRate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div className="cr-divider" />

        {/* Literacy Breakdown */}
        {Object.keys(byLiteracy).length > 0 && (
          <section className="cr-section">
            <h2 className="cr-section-title">4. Performance by Digital Literacy</h2>
            <p className="cr-section-desc">
              Merchant personas were segmented by digital literacy level to evaluate inclusivity
              and accessibility of the onboarding flow.
            </p>
            <table className="cr-table">
              <thead>
                <tr>
                  <th>Literacy Level</th>
                  <th>Merchants</th>
                  <th>Success Rate</th>
                  <th>Avg Attempts</th>
                  <th>Exp. Score</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byLiteracy).map(([lit, d]) => (
                  <tr key={lit}>
                    <td style={{ textTransform: 'capitalize' }}>{lit}</td>
                    <td>{d.totalMerchants ?? '—'}</td>
                    <td style={{ color: rateColor(d.successRate) }}>{pct(d.successRate)}</td>
                    <td>{d.avgAttempts != null ? d.avgAttempts.toFixed(1) : '—'}</td>
                    <td>{d.avgExperienceScore != null ? d.avgExperienceScore.toFixed(2) : '—'}</td>
                    <td><StatusBadge rate={d.successRate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div className="cr-divider" />

        {/* Compliance Statement */}
        <section className="cr-section">
          <h2 className="cr-section-title">5. Compliance Statement</h2>
          <div className="cr-statement">
            <p>
              This simulation was conducted using the Merchant Digital Twin platform, a controlled
              synthetic environment. No real merchant data or live production systems were accessed
              during the simulation. All merchant profiles used are synthetically generated.
            </p>
            <p>
              The results contained in this report are intended solely for internal review by
              authorised compliance, product, and risk personnel. Distribution outside of these
              teams requires prior written approval.
            </p>
            <div className="cr-sign-grid">
              <SignBox label="Prepared by" />
              <SignBox label="Reviewed by" />
              <SignBox label="Approved by" />
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="cr-footer">
          <span>Merchant Digital Twin — Simulation Control Platform</span>
          <span>{reportId} · {dateStr}</span>
          <span>INTERNAL USE ONLY</span>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, icon, color = '#00a651' }) {
  return (
    <div className="cr-kpi">
      <div className="cr-kpi-icon">{icon}</div>
      <div className="cr-kpi-value" style={{ color }}>{value}</div>
      <div className="cr-kpi-label">{label}</div>
    </div>
  );
}

function StatusBadge({ rate }) {
  if (rate == null) return <span className="cr-badge cr-badge-na">N/A</span>;
  if (rate >= 0.8)  return <span className="cr-badge cr-badge-pass">PASS</span>;
  if (rate >= 0.6)  return <span className="cr-badge cr-badge-warn">REVIEW</span>;
  return               <span className="cr-badge cr-badge-fail">FAIL</span>;
}

function SignBox({ label }) {
  return (
    <div className="cr-sign-box">
      <div className="cr-sign-label">{label}</div>
      <div className="cr-sign-line" />
      <div className="cr-sign-meta">Name / Date</div>
    </div>
  );
}

export default ComplianceReport;
