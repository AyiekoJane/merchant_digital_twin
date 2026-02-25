// Insights Engine - Real-time aggregation and AI-powered analysis
const { events } = require('./metrics');
const { isConfigured, generateAIRecommendations: getAIRecommendations } = require('./groqAI');

// Aggregated insights cache
let cachedInsights = {
  frictionPoints: [],
  failureHotspots: [],
  personaStruggles: [],
  networkImpact: [],
  aiRecommendations: [],
  lastUpdated: null
};

// Compute live operational metrics
function computeOperationalMetrics() {
  if (events.length === 0) {
    return {
      activeAgents: 0,
      completionRate: 0,
      avgDuration: 0,
      dropoffs: 0,
      retryFrequency: 0,
      errorHotspots: []
    };
  }

  const uniqueMerchants = new Set(events.map(e => e.merchantId)).size;
  const summaries = events.filter(e => e.event === 'ONBOARDING_SUMMARY' || e.event === 'SUMMARY');
  const completedCount = summaries.filter(e => e.summary?.success).length;
  const failedCount = summaries.filter(e => !e.summary?.success).length;
  
  const totalDuration = summaries.reduce((sum, e) => 
    sum + (e.summary?.completionTimeMs || e.summary?.timeBeforeFailure || 0), 0
  );
  const avgDuration = summaries.length > 0 ? Math.round(totalDuration / summaries.length) : 0;

  // Count retries
  const retryEvents = events.filter(e => 
    e.event === 'VALIDATION_ERROR' || 
    e.event === 'RETRY_ATTEMPT' ||
    e.retryNeeded
  );
  const retryFrequency = summaries.length > 0 ? 
    parseFloat((retryEvents.length / summaries.length).toFixed(2)) : 0;

  // Error hotspots
  const errorEvents = events.filter(e => 
    e.event === 'VALIDATION_ERROR' || 
    e.event === 'PAGE_LOAD_FAILED' ||
    e.event === 'ONBOARDING_FAILED'
  );
  
  const errorsByStep = {};
  errorEvents.forEach(e => {
    const step = e.step || e.field || 'unknown';
    errorsByStep[step] = (errorsByStep[step] || 0) + 1;
  });

  const errorHotspots = Object.entries(errorsByStep)
    .map(([step, count]) => ({ step, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    activeAgents: uniqueMerchants,
    completionRate: summaries.length > 0 ? 
      parseFloat((completedCount / summaries.length * 100).toFixed(1)) : 0,
    avgDuration,
    dropoffs: failedCount,
    retryFrequency,
    errorHotspots
  };
}

// Detect friction points
function detectFrictionPoints() {
  const frictionPoints = [];

  // Analyze validation errors
  const validationErrors = events.filter(e => e.event === 'VALIDATION_ERROR');
  const errorsByField = {};
  
  validationErrors.forEach(e => {
    const field = e.field || 'unknown';
    errorsByField[field] = (errorsByField[field] || 0) + 1;
  });

  Object.entries(errorsByField).forEach(([field, count]) => {
    if (count >= 3) {
      frictionPoints.push({
        type: 'validation',
        location: field,
        severity: count >= 5 ? 'high' : 'medium',
        count,
        description: `${count} validation errors on field: ${field}`
      });
    }
  });

  // Analyze page load failures
  const pageLoadFailures = events.filter(e => e.event === 'PAGE_LOAD_FAILED');
  if (pageLoadFailures.length >= 2) {
    frictionPoints.push({
      type: 'technical',
      location: 'page_load',
      severity: 'high',
      count: pageLoadFailures.length,
      description: `${pageLoadFailures.length} page load failures detected`
    });
  }

  // Detect confusion patterns
  const confusionEvents = events.filter(e => e.event === 'DOCUMENT_UPLOAD_CONFUSION');
  if (confusionEvents.length >= 2) {
    frictionPoints.push({
      type: 'ux',
      location: 'document_upload',
      severity: 'medium',
      count: confusionEvents.length,
      description: `${confusionEvents.length} users confused by document upload`
    });
  }

  return frictionPoints;
}

// Analyze persona struggles
function analyzePersonaStruggles() {
  const summaries = events.filter(e => e.event === 'ONBOARDING_SUMMARY' || e.event === 'SUMMARY');
  
  if (summaries.length === 0) return [];

  const byLiteracy = {};
  const byNetwork = {};
  const byDevice = {};

  summaries.forEach(e => {
    const literacy = e.summary?.digitalLiteracy || 'unknown';
    const network = e.summary?.networkProfile || 'unknown';
    const device = e.summary?.deviceType || 'unknown';
    const success = e.summary?.success || false;

    if (!byLiteracy[literacy]) byLiteracy[literacy] = { total: 0, failed: 0 };
    if (!byNetwork[network]) byNetwork[network] = { total: 0, failed: 0 };
    if (!byDevice[device]) byDevice[device] = { total: 0, failed: 0 };

    byLiteracy[literacy].total++;
    byNetwork[network].total++;
    byDevice[device].total++;

    if (!success) {
      byLiteracy[literacy].failed++;
      byNetwork[network].failed++;
      byDevice[device].failed++;
    }
  });

  const struggles = [];

  // Check literacy struggles
  Object.entries(byLiteracy).forEach(([level, stats]) => {
    const failureRate = stats.total > 0 ? (stats.failed / stats.total) : 0;
    if (failureRate >= 0.5 && stats.total >= 2) {
      struggles.push({
        persona: `${level} digital literacy`,
        failureRate: parseFloat((failureRate * 100).toFixed(1)),
        count: stats.failed,
        total: stats.total,
        category: 'literacy'
      });
    }
  });

  // Check network struggles
  Object.entries(byNetwork).forEach(([profile, stats]) => {
    const failureRate = stats.total > 0 ? (stats.failed / stats.total) : 0;
    if (failureRate >= 0.5 && stats.total >= 2) {
      struggles.push({
        persona: profile,
        failureRate: parseFloat((failureRate * 100).toFixed(1)),
        count: stats.failed,
        total: stats.total,
        category: 'network'
      });
    }
  });

  return struggles;
}

// Analyze network impact
function analyzeNetworkImpact() {
  const networkEvents = events.filter(e => 
    e.event === 'PAGE_LOAD' || 
    e.event === 'PAGE_LOAD_FAILED' ||
    e.event === 'NETWORK_DELAY' ||
    e.event === 'TIMEOUT'
  );

  if (networkEvents.length === 0) return [];

  const byProfile = {};

  networkEvents.forEach(e => {
    const profile = e.networkProfile || e.summary?.networkProfile || 'unknown';
    if (!byProfile[profile]) {
      byProfile[profile] = {
        totalEvents: 0,
        failures: 0,
        avgLatency: 0,
        latencies: []
      };
    }

    byProfile[profile].totalEvents++;
    
    if (e.event === 'PAGE_LOAD_FAILED' || e.event === 'TIMEOUT') {
      byProfile[profile].failures++;
    }

    if (e.latency) {
      byProfile[profile].latencies.push(e.latency);
    }
  });

  return Object.entries(byProfile).map(([profile, stats]) => {
    const avgLatency = stats.latencies.length > 0 ?
      Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length) : 0;
    
    const failureRate = stats.totalEvents > 0 ? 
      parseFloat((stats.failures / stats.totalEvents * 100).toFixed(1)) : 0;

    return {
      profile,
      avgLatency,
      failureRate,
      failures: stats.failures,
      totalEvents: stats.totalEvents
    };
  }).filter(item => item.totalEvents >= 2);
}

// Generate AI recommendations (uses Groq AI with rule-based fallback)
async function generateAIRecommendations(insights) {
  // Try AI-powered recommendations first
  if (isConfigured()) {
    try {
      const aiRecommendations = await getAIRecommendations(insights);
      if (aiRecommendations && Array.isArray(aiRecommendations) && aiRecommendations.length > 0) {
        console.log('✨ Using AI-powered recommendations');
        return aiRecommendations;
      }
    } catch (error) {
      console.warn('AI recommendations failed, using rule-based fallback:', error.message);
    }
  }

  // Fallback to rule-based recommendations
  console.log('📋 Using rule-based recommendations');
  const recommendations = [];

  // Recommendation based on friction points
  insights.frictionPoints.forEach(friction => {
    if (friction.type === 'validation' && friction.severity === 'high') {
      recommendations.push({
        priority: 'high',
        category: 'ux',
        title: `Improve validation for ${friction.location}`,
        description: `${friction.count} validation errors detected. Consider adding inline help text or examples.`,
        impact: 'Could reduce drop-off rate by 15-25%',
        effort: 'low'
      });
    }

    if (friction.type === 'technical' && friction.location === 'page_load') {
      recommendations.push({
        priority: 'critical',
        category: 'performance',
        title: 'Optimize page load performance',
        description: `${friction.count} page load failures. Check server response times and asset sizes.`,
        impact: 'Could improve completion rate by 20-30%',
        effort: 'medium'
      });
    }

    if (friction.type === 'ux' && friction.location === 'document_upload') {
      recommendations.push({
        priority: 'medium',
        category: 'ux',
        title: 'Simplify document upload flow',
        description: `${friction.count} users confused. Add visual guides or reduce required documents.`,
        impact: 'Could reduce confusion-related drop-offs by 30%',
        effort: 'low'
      });
    }
  });

  // Recommendations based on persona struggles
  insights.personaStruggles.forEach(struggle => {
    if (struggle.category === 'literacy' && struggle.failureRate >= 50) {
      recommendations.push({
        priority: 'high',
        category: 'accessibility',
        title: `Support for ${struggle.persona} users`,
        description: `${struggle.failureRate}% failure rate. Add tooltips, simplified language, or video guides.`,
        impact: 'Could improve success rate for this segment by 40%',
        effort: 'medium'
      });
    }

    if (struggle.category === 'network' && struggle.failureRate >= 50) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: `Optimize for ${struggle.persona}`,
        description: `${struggle.failureRate}% failure rate. Reduce page weight and add offline support.`,
        impact: 'Could improve success rate for this segment by 35%',
        effort: 'high'
      });
    }
  });

  // Recommendations based on network impact
  insights.networkImpact.forEach(impact => {
    if (impact.avgLatency > 2000 && impact.failureRate > 20) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: `Optimize for ${impact.profile} connections`,
        description: `Average latency ${impact.avgLatency}ms with ${impact.failureRate}% failure rate.`,
        impact: 'Could reduce abandonment by 25%',
        effort: 'medium'
      });
    }
  });

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return recommendations.sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  ).slice(0, 8); // Top 8 recommendations
}

// Main insights aggregation function
async function aggregateInsights() {
  const operational = computeOperationalMetrics();
  const frictionPoints = detectFrictionPoints();
  const personaStruggles = analyzePersonaStruggles();
  const networkImpact = analyzeNetworkImpact();

  const insights = {
    operational,
    frictionPoints,
    personaStruggles,
    networkImpact
  };

  const aiRecommendations = await generateAIRecommendations(insights);

  cachedInsights = {
    ...insights,
    aiRecommendations,
    lastUpdated: Date.now()
  };

  return cachedInsights;
}

// Get cached insights (with auto-refresh if stale)
async function getInsights() {
  const now = Date.now();
  const staleThreshold = 5000; // 5 seconds

  if (!cachedInsights.lastUpdated || (now - cachedInsights.lastUpdated) > staleThreshold) {
    return await aggregateInsights();
  }

  return cachedInsights;
}

module.exports = {
  aggregateInsights,
  getInsights,
  computeOperationalMetrics,
  detectFrictionPoints,
  analyzePersonaStruggles,
  analyzeNetworkImpact,
  generateAIRecommendations
};
