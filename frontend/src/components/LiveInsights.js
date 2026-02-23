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
    
    switch (eventType) {
      case 'SIMULATION_START':
        return `🚀 Agent ${merchantId} started onboarding simulation`;
      case 'STEP_COMPLETED':
        return `✅ Agent ${merchantId} completed step: ${event.step || 'unknown'}`;
      case 'VALIDATION_ERROR':
        return `⚠️ Agent ${merchantId} encountered validation error: ${event.error || 'unknown'}`;
      case 'RETRY_ATTEMPT':
        return `🔄 Agent ${merchantId} retrying (attempt ${event.retryCount || 1})`;
      case 'RESOLUTION_SUCCESS':
        return `✅ Agent ${merchantId} completed onboarding successfully`;
      case 'RESOLUTION_FAILURE':
        return `❌ Agent ${merchantId} failed onboarding: ${event.reason || 'unknown'}`;
      case 'NETWORK_DELAY':
        return `📡 Agent ${merchantId} experiencing network delay (${event.latency || 0}ms)`;
      case 'TIMEOUT':
        return `⏱️ Agent ${merchantId} timed out on step: ${event.step || 'unknown'}`;
      default:
        return `📝 Agent ${merchantId}: ${eventType}`;
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
