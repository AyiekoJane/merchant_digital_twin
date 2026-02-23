import React, { useState, useEffect, useRef } from 'react';
import './LiveInsights.css';
import MetricsPanel from './insights/MetricsPanel';
import LiveLogs from './insights/LiveLogs';
import AgentStatusGrid from './insights/AgentStatusGrid';

function LiveInsights() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const eventsEndRef = useRef(null);

  useEffect(() => {
    fetchInsights();
    fetchEvents();
    
    const insightsInterval = setInterval(fetchInsights, 3000);
    const eventsInterval = setInterval(fetchEvents, 2000); // More frequent for live logs
    
    return () => {
      clearInterval(insightsInterval);
      clearInterval(eventsInterval);
    };
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  const fetchInsights = async () => {
    try {
      const res = await fetch('http://localhost:3000/insights/summary');
      const data = await res.json();
      setSummary(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:3000/events/recent?limit=50');
      const data = await res.json();
      
      if (data.events && Array.isArray(data.events)) {
        // Format events for display
        const formattedEvents = data.events.map(event => ({
          timestamp: new Date(event.timestamp).toLocaleTimeString(),
          message: formatEventMessage(event),
          type: event.event || event.eventType,
          merchantId: event.merchantId
        }));
        
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const formatEventMessage = (event) => {
    const merchantId = event.merchantId || 'Unknown';
    const eventType = event.event || event.eventType || 'event';
    
    // Extract additional context
    const network = event.networkProfile ? ` [${event.networkProfile}]` : '';
    const literacy = event.digitalLiteracy ? ` [${event.digitalLiteracy}]` : '';
    const device = event.deviceType ? ` [${event.deviceType}]` : '';
    const latency = event.latency ? ` (${event.latency}ms)` : '';
    const step = event.step ? ` - ${event.step}` : '';
    const url = event.url ? ` at ${event.url}` : '';
    
    switch (eventType) {
      case 'ONBOARDING_SUMMARY':
      case 'SUMMARY':
        const outcome = event.summary?.success ? '✅ SUCCESS' : '❌ FAILED';
        const time = event.summary?.completionTimeMs ? ` in ${event.summary.completionTimeMs}ms` : '';
        const attempts = event.summary?.totalAttempts ? ` (${event.summary.totalAttempts} attempts)` : '';
        return `${outcome} ${merchantId}${time}${attempts}${network}${literacy}`;
        
      case 'PAGE_LOAD':
        return `🌐 ${merchantId} loaded portal${url}${latency}${network}`;
        
      case 'PAGE_LOAD_FAILED':
        return `❌ ${merchantId} failed to load portal${url}: ${event.error || 'unknown'}${network}`;
        
      case 'FIELD_FILLED':
        return `✏️ ${merchantId} filled field: ${event.field || 'unknown'}${latency}${literacy}`;
        
      case 'VALIDATION_ERROR':
        return `⚠️ ${merchantId} validation error on ${event.field || 'field'} - retrying${literacy}`;
        
      case 'DOCUMENT_UPLOAD_CONFUSION':
        return `😕 ${merchantId} experiencing confusion with document upload${literacy}`;
        
      case 'ONBOARDING_COMPLETE':
        return `✅ ${merchantId} completed onboarding${latency}${device}${network}`;
        
      case 'ONBOARDING_FAILED':
        return `❌ ${merchantId} onboarding failed${step}: ${event.error || 'unknown'}${device}`;
        
      case 'ATTEMPT':
        const result = event.result === 'success' ? '✅' : '🔄';
        return `${result} ${merchantId} attempt ${event.attempt || 1}${latency}${network}${literacy}`;
        
      case 'ONBOARDING_ATTEMPT':
        const attemptResult = event.result === 'success' ? '✅' : '🔄';
        return `${attemptResult} ${merchantId} onboarding attempt ${event.attempt || 1}${latency}`;
        
      case 'AGENT_ERROR':
        return `💥 ${merchantId} agent error: ${event.error || 'unknown'}`;
        
      case 'SIMULATION_START':
        return `🚀 ${merchantId} started simulation${device}${network}${literacy}`;
        
      case 'STEP_COMPLETED':
        return `✅ ${merchantId} completed${step}${latency}`;
        
      case 'RETRY_ATTEMPT':
        return `🔄 ${merchantId} retrying (attempt ${event.retryCount || event.attempt || 1})${network}`;
        
      case 'NETWORK_DELAY':
        return `📡 ${merchantId} network delay${latency}${network}`;
        
      case 'TIMEOUT':
        return `⏱️ ${merchantId} timeout${step}${network}`;
        
      default:
        // Generic format with all available context
        const context = [network, literacy, device, latency, step].filter(Boolean).join(' ');
        return `📝 ${merchantId}: ${eventType}${context ? ' ' + context : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="insights-loading">
        <div className="spinner"></div>
        <p>Loading insights...</p>
      </div>
    );
  }

  if (!summary || summary.totalMerchants === 0) {
    return (
      <div className="insights-empty">
        <div className="empty-icon">📊</div>
        <h3>No Simulation Data</h3>
        <p>Run a simulation to see live insights</p>
      </div>
    );
  }

  return (
    <div className="live-insights">
      <div className="insights-header">
        <h2>Live Insights</h2>
        <p>Real-time simulation metrics and agent status</p>
      </div>

      <MetricsPanel summary={summary} />
      
      <div className="insights-grid">
        <AgentStatusGrid summary={summary} />
        <LiveLogs events={events} eventsEndRef={eventsEndRef} />
      </div>
    </div>
  );
}

export default LiveInsights;
