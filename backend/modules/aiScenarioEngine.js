// AI Scenario Engine - Predict impact of product/design changes
const { getSummaryInsights, getInsightsByNetwork, getInsightsByLiteracy } = require('./metrics');
const { detectFrictionPoints, analyzePersonaStruggles } = require('./insightsEngine');
const { isConfigured, predictScenarioImpactAI } = require('./groqAI');

// Analyze scenario change and predict impact (uses Groq AI with rule-based fallback)
async function predictScenarioImpact(scenarioChange, currentInsights) {
  const predictions = {
    changeDescription: scenarioChange.description,
    changeType: scenarioChange.type,
    predictedImpact: {},
    riskAssessment: {},
    personaImpact: [],
    recommendations: []
  };

  // Get current baseline metrics
  const baseline = currentInsights || getSummaryInsights();
  
  // Try AI-powered prediction first
  if (isConfigured()) {
    try {
      const aiPrediction = await predictScenarioImpactAI(scenarioChange, baseline);
      if (aiPrediction) {
        console.log('✨ Using AI-powered scenario prediction');
        predictions.predictedImpact = aiPrediction;
        predictions.riskAssessment = assessRisk(aiPrediction, baseline);
        predictions.personaImpact = aiPrediction.personaImpact || analyzePersonaImpact(scenarioChange, baseline);
        predictions.recommendations = generateScenarioRecommendations(predictions);
        return predictions;
      }
    } catch (error) {
      console.warn('AI prediction failed, using rule-based fallback:', error.message);
    }
  }

  // Fallback to rule-based prediction
  console.log('📋 Using rule-based scenario prediction');
  
  // Analyze based on change type
  switch (scenarioChange.type) {
    case 'remove_step':
      predictions.predictedImpact = predictRemoveStep(scenarioChange, baseline);
      break;
    case 'add_verification':
      predictions.predictedImpact = predictAddVerification(scenarioChange, baseline);
      break;
    case 'reduce_fields':
      predictions.predictedImpact = predictReduceFields(scenarioChange, baseline);
      break;
    case 'change_validation':
      predictions.predictedImpact = predictChangeValidation(scenarioChange, baseline);
      break;
    case 'improve_performance':
      predictions.predictedImpact = predictImprovePerformance(scenarioChange, baseline);
      break;
    case 'add_help_text':
      predictions.predictedImpact = predictAddHelpText(scenarioChange, baseline);
      break;
    case 'simplify_ui':
      predictions.predictedImpact = predictSimplifyUI(scenarioChange, baseline);
      break;
    default:
      predictions.predictedImpact = predictGenericChange(scenarioChange, baseline);
  }

  // Generate risk assessment
  predictions.riskAssessment = assessRisk(predictions.predictedImpact, baseline);

  // Analyze persona-specific impact
  predictions.personaImpact = analyzePersonaImpact(scenarioChange, baseline);

  // Generate recommendations
  predictions.recommendations = generateScenarioRecommendations(predictions);

  return predictions;
}

function predictRemoveStep(change, baseline) {
  const currentCompletionRate = baseline.successRate || 0;
  const currentAvgTime = baseline.averageCompletionTimeMs || 0;

  // Removing a step typically improves completion rate and reduces time
  const completionRateIncrease = 0.08; // +8%
  const timeReduction = 0.15; // -15%

  return {
    completionRate: {
      current: currentCompletionRate,
      predicted: Math.min(1.0, currentCompletionRate + completionRateIncrease),
      change: `+${(completionRateIncrease * 100).toFixed(1)}%`,
      direction: 'positive'
    },
    avgCompletionTime: {
      current: currentAvgTime,
      predicted: Math.round(currentAvgTime * (1 - timeReduction)),
      change: `-${(timeReduction * 100).toFixed(0)}%`,
      direction: 'positive'
    },
    dropOffRate: {
      change: '-12%',
      direction: 'positive'
    },
    confidence: 'high'
  };
}

function predictAddVerification(change, baseline) {
  const currentCompletionRate = baseline.successRate || 0;
  const currentAvgTime = baseline.averageCompletionTimeMs || 0;

  // Adding verification typically decreases completion rate and increases time
  const completionRateDecrease = 0.05; // -5%
  const timeIncrease = 0.20; // +20%

  return {
    completionRate: {
      current: currentCompletionRate,
      predicted: Math.max(0, currentCompletionRate - completionRateDecrease),
      change: `-${(completionRateDecrease * 100).toFixed(1)}%`,
      direction: 'negative'
    },
    avgCompletionTime: {
      current: currentAvgTime,
      predicted: Math.round(currentAvgTime * (1 + timeIncrease)),
      change: `+${(timeIncrease * 100).toFixed(0)}%`,
      direction: 'negative'
    },
    dropOffRate: {
      change: '+8%',
      direction: 'negative'
    },
    confidence: 'medium'
  };
}

function predictReduceFields(change, baseline) {
  const currentCompletionRate = baseline.successRate || 0;
  const currentAvgTime = baseline.averageCompletionTimeMs || 0;

  const completionRateIncrease = 0.10; // +10%
  const timeReduction = 0.12; // -12%

  return {
    completionRate: {
      current: currentCompletionRate,
      predicted: Math.min(1.0, currentCompletionRate + completionRateIncrease),
      change: `+${(completionRateIncrease * 100).toFixed(1)}%`,
      direction: 'positive'
    },
    avgCompletionTime: {
      current: currentAvgTime,
      predicted: Math.round(currentAvgTime * (1 - timeReduction)),
      change: `-${(timeReduction * 100).toFixed(0)}%`,
      direction: 'positive'
    },
    dropOffRate: {
      change: '-15%',
      direction: 'positive'
    },
    confidence: 'high'
  };
}

function predictChangeValidation(change, baseline) {
  const currentCompletionRate = baseline.successRate || 0;
  const currentRetries = baseline.averageRetries || 0;

  return {
    completionRate: {
      current: currentCompletionRate,
      predicted: Math.min(1.0, currentCompletionRate + 0.06),
      change: '+6%',
      direction: 'positive'
    },
    retryFrequency: {
      current: currentRetries,
      predicted: Math.max(0, currentRetries - 0.5),
      change: '-30%',
      direction: 'positive'
    },
    userFrustration: {
      change: '-25%',
      direction: 'positive'
    },
    confidence: 'medium'
  };
}

function predictImprovePerformance(change, baseline) {
  const currentCompletionRate = baseline.successRate || 0;
  const currentAvgTime = baseline.averageCompletionTimeMs || 0;

  return {
    completionRate: {
      current: currentCompletionRate,
      predicted: Math.min(1.0, currentCompletionRate + 0.12),
      change: '+12%',
      direction: 'positive'
    },
    avgCompletionTime: {
      current: currentAvgTime,
      predicted: Math.round(currentAvgTime * 0.70),
      change: '-30%',
      direction: 'positive'
    },
    abandonmentRate: {
      change: '-20%',
      direction: 'positive'
    },
    confidence: 'high'
  };
}

function predictAddHelpText(change, baseline) {
  const currentCompletionRate = baseline.successRate || 0;

  return {
    completionRate: {
      current: currentCompletionRate,
      predicted: Math.min(1.0, currentCompletionRate + 0.07),
      change: '+7%',
      direction: 'positive'
    },
    confusionRate: {
      change: '-40%',
      direction: 'positive'
    },
    retryFrequency: {
      change: '-20%',
      direction: 'positive'
    },
    confidence: 'medium'
  };
}

function predictSimplifyUI(change, baseline) {
  const currentCompletionRate = baseline.successRate || 0;
  const currentAvgTime = baseline.averageCompletionTimeMs || 0;

  return {
    completionRate: {
      current: currentCompletionRate,
      predicted: Math.min(1.0, currentCompletionRate + 0.09),
      change: '+9%',
      direction: 'positive'
    },
    avgCompletionTime: {
      current: currentAvgTime,
      predicted: Math.round(currentAvgTime * 0.88),
      change: '-12%',
      direction: 'positive'
    },
    cognitiveLoad: {
      change: '-35%',
      direction: 'positive'
    },
    confidence: 'high'
  };
}

function predictGenericChange(change, baseline) {
  return {
    completionRate: {
      current: baseline.successRate || 0,
      predicted: baseline.successRate || 0,
      change: 'Unknown',
      direction: 'neutral'
    },
    confidence: 'low',
    note: 'Insufficient data to predict impact. Run simulation to measure actual results.'
  };
}

function assessRisk(predictedImpact, baseline) {
  const risks = [];
  let overallRisk = 'low';

  // Check for negative impacts
  if (predictedImpact.completionRate?.direction === 'negative') {
    risks.push({
      type: 'completion_rate_drop',
      severity: 'high',
      description: 'Predicted decrease in completion rate'
    });
    overallRisk = 'high';
  }

  if (predictedImpact.dropOffRate?.direction === 'negative') {
    risks.push({
      type: 'increased_dropoff',
      severity: 'medium',
      description: 'Potential increase in user drop-off'
    });
    if (overallRisk === 'low') overallRisk = 'medium';
  }

  if (predictedImpact.confidence === 'low') {
    risks.push({
      type: 'low_confidence',
      severity: 'medium',
      description: 'Prediction confidence is low - recommend A/B testing'
    });
    if (overallRisk === 'low') overallRisk = 'medium';
  }

  return {
    overallRisk,
    risks,
    recommendation: overallRisk === 'high' ? 
      'High risk change. Consider A/B testing before full rollout.' :
      overallRisk === 'medium' ?
      'Medium risk. Monitor metrics closely after deployment.' :
      'Low risk change. Safe to proceed with deployment.'
  };
}

function analyzePersonaImpact(change, baseline) {
  const personaImpacts = [];

  // Analyze by digital literacy
  const literacyInsights = getInsightsByLiteracy();
  
  if (change.type === 'add_help_text' || change.type === 'simplify_ui') {
    personaImpacts.push({
      persona: 'Basic digital literacy users',
      impact: 'High positive impact',
      expectedImprovement: '+15-20% completion rate',
      confidence: 'high'
    });
  }

  if (change.type === 'improve_performance') {
    personaImpacts.push({
      persona: 'Poor network users',
      impact: 'High positive impact',
      expectedImprovement: '+20-25% completion rate',
      confidence: 'high'
    });
  }

  if (change.type === 'add_verification') {
    personaImpacts.push({
      persona: 'Basic digital literacy users',
      impact: 'Negative impact',
      expectedImprovement: '-10-15% completion rate',
      confidence: 'medium'
    });
  }

  return personaImpacts;
}

function generateScenarioRecommendations(predictions) {
  const recommendations = [];

  if (predictions.riskAssessment.overallRisk === 'high') {
    recommendations.push({
      priority: 'critical',
      title: 'Conduct A/B Testing',
      description: 'High risk change detected. Run A/B test with 10-20% of users before full rollout.'
    });
  }

  if (predictions.predictedImpact.completionRate?.direction === 'positive') {
    recommendations.push({
      priority: 'high',
      title: 'Monitor Key Metrics',
      description: 'Track completion rate, time-to-complete, and drop-off points after deployment.'
    });
  }

  if (predictions.personaImpact.length > 0) {
    recommendations.push({
      priority: 'medium',
      title: 'Segment Analysis',
      description: 'Monitor impact across different user segments, especially those identified as affected.'
    });
  }

  return recommendations;
}

module.exports = {
  predictScenarioImpact
};
