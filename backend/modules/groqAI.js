// Groq AI Integration Module
// Free, fast AI-powered insights using Groq's API

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile'; // Latest fast and capable model

// Check if API key is configured
function isConfigured() {
  return GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here';
}

// Call Groq AI API
async function callGroqAPI(messages, options = {}) {
  if (!isConfigured()) {
    console.warn('⚠️  Groq API key not configured. Using fallback rule-based AI.');
    return null;
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || MODEL,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1500,
        top_p: options.topP || 1,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return null;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Failed to call Groq API:', error.message);
    return null;
  }
}

// Generate AI-powered recommendations from insights
async function generateAIRecommendations(insights) {
  const prompt = `You are an expert UX analyst for merchant onboarding systems. Analyze the following simulation data and provide actionable recommendations.

OPERATIONAL METRICS:
- Completion Rate: ${insights.operational.completionRate}%
- Average Duration: ${insights.operational.avgDuration}ms
- Drop-offs: ${insights.operational.dropoffs}
- Retry Frequency: ${insights.operational.retryFrequency}

FRICTION POINTS:
${insights.frictionPoints.map(fp => `- ${fp.type} at ${fp.location}: ${fp.description} (severity: ${fp.severity})`).join('\n') || 'None detected'}

PERSONA STRUGGLES:
${insights.personaStruggles.map(ps => `- ${ps.persona}: ${ps.failureRate}% failure rate (${ps.count}/${ps.total})`).join('\n') || 'None detected'}

NETWORK IMPACT:
${insights.networkImpact.map(ni => `- ${ni.profile}: ${ni.avgLatency}ms latency, ${ni.failureRate}% failure rate`).join('\n') || 'None detected'}

Provide 5-8 prioritized recommendations in JSON format:
[
  {
    "priority": "critical|high|medium|low",
    "category": "ux|performance|accessibility|technical",
    "title": "Brief title",
    "description": "Detailed recommendation",
    "impact": "Expected impact statement",
    "effort": "low|medium|high"
  }
]

Focus on actionable, specific improvements. Consider both quick wins and strategic changes.`;

  const messages = [
    {
      role: 'system',
      content: 'You are a UX optimization expert specializing in merchant onboarding flows. Provide data-driven, actionable recommendations in valid JSON format only.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callGroqAPI(messages, { temperature: 0.5, maxTokens: 2000 });
  
  if (!response) {
    return null; // Fallback to rule-based recommendations
  }

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse AI recommendations:', error.message);
    return null;
  }
}

// Predict scenario impact using AI
async function predictScenarioImpactAI(scenarioChange, currentInsights) {
  const prompt = `You are a product analytics expert. Predict the impact of the following change to a merchant onboarding flow.

CURRENT METRICS:
- Success Rate: ${(currentInsights.successRate * 100).toFixed(1)}%
- Average Completion Time: ${currentInsights.averageCompletionTimeMs}ms
- Drop-off Rate: ${((1 - currentInsights.successRate) * 100).toFixed(1)}%

PROPOSED CHANGE:
Type: ${scenarioChange.type}
Description: ${scenarioChange.description}

Based on UX research and industry benchmarks, predict:
1. New completion rate (as percentage)
2. New average completion time (in ms)
3. Change in drop-off rate (as percentage change)
4. Confidence level (low/medium/high)
5. Key risks
6. Persona-specific impacts

Respond in JSON format:
{
  "completionRate": {"current": X, "predicted": Y, "change": "+/-Z%", "direction": "positive|negative|neutral"},
  "avgCompletionTime": {"current": X, "predicted": Y, "change": "+/-Z%", "direction": "positive|negative|neutral"},
  "dropOffRate": {"change": "+/-Z%", "direction": "positive|negative|neutral"},
  "confidence": "low|medium|high",
  "risks": ["risk1", "risk2"],
  "personaImpact": [{"persona": "name", "impact": "description", "expectedImprovement": "X%"}]
}`;

  const messages = [
    {
      role: 'system',
      content: 'You are a UX analytics expert. Provide realistic predictions based on industry research. Return valid JSON only.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callGroqAPI(messages, { temperature: 0.3, maxTokens: 1500 });
  
  if (!response) {
    return null; // Fallback to rule-based prediction
  }

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse AI prediction:', error.message);
    return null;
  }
}

// Generate natural language insights summary
async function generateInsightsSummary(insights) {
  const prompt = `Summarize the following merchant onboarding simulation results in 2-3 concise sentences for a product manager:

- ${insights.operational.activeAgents} merchants simulated
- ${insights.operational.completionRate}% completion rate
- ${insights.operational.avgDuration}ms average duration
- ${insights.frictionPoints.length} friction points detected
- ${insights.personaStruggles.length} persona segments struggling

Focus on the most critical findings and their business impact.`;

  const messages = [
    {
      role: 'system',
      content: 'You are a concise business analyst. Provide clear, actionable summaries.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await callGroqAPI(messages, { temperature: 0.6, maxTokens: 300 });
  return response || 'Simulation completed. Review detailed metrics for insights.';
}

module.exports = {
  isConfigured,
  generateAIRecommendations,
  predictScenarioImpactAI,
  generateInsightsSummary,
  callGroqAPI
};
