const fs = require('fs');
const path = require('path');
const { storeEvent } = require('./metrics');

// Network latency mapping (milliseconds)
const NETWORK_LATENCY = {
  '4G_GOOD': 100,
  '4G_UNSTABLE': 300,
  '3G_POOR': 800,
  '2G_EDGE': 1500
};

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Load all scenario configurations
function loadScenarios() {
  const scenariosDir = path.join(__dirname, '..', '..', 'scenarios');
  
  if (!fs.existsSync(scenariosDir)) {
    console.warn('⚠️  Scenarios directory not found');
    return [];
  }
  
  const scenarioFiles = fs.readdirSync(scenariosDir).filter(f => f.endsWith('.json'));
  const scenarios = [];
  
  scenarioFiles.forEach(file => {
    const filePath = path.join(scenariosDir, file);
    const scenarioData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    scenarios.push(scenarioData);
  });
  
  return scenarios;
}

// Enrich merchant profile with scenario configuration
function enrichMerchantWithScenario(merchant, scenario) {
  return {
    ...merchant,
    scenarioId: scenario.scenarioId,
    scenarioConfig: {
      latencyMultiplier: scenario.latencyMultiplier,
      retryBonus: scenario.retryBonus,
      successProbabilityBonus: scenario.successProbabilityBonus
    }
  };
}

// Simulate network delay
async function simulateNetworkDelay(networkProfile, scenarioConfig) {
  const baseLatency = NETWORK_LATENCY[networkProfile] || 500;
  const latencyMultiplier = scenarioConfig?.latencyMultiplier || 1.0;
  const adjustedLatency = baseLatency * latencyMultiplier;
  const actualLatency = adjustedLatency + (Math.random() * 0.4 - 0.2) * adjustedLatency;
  await sleep(Math.round(actualLatency));
  return Math.round(actualLatency);
}

// Calculate experience score
function calculateExperienceScore(attempts, success, merchant) {
  if (!success) return 0;
  
  const attemptPenalty = Math.max(0, 1 - (attempts - 1) * 0.2);
  const patienceBonus = merchant.patienceScore;
  const literacyBonus = merchant.digitalLiteracy === 'advanced' ? 0.2 : 
                       merchant.digitalLiteracy === 'intermediate' ? 0.1 : 0;
  const incomeImpact = merchant.incomeLevel === 'high' ? -0.1 : 
                      merchant.incomeLevel === 'low' ? 0.1 : 0;
  const networkPenalty = merchant.networkProfile === '2G_EDGE' ? -0.2 :
                        merchant.networkProfile === '3G_POOR' ? -0.1 : 0;
  
  const score = Math.max(0, Math.min(1, 
    attemptPenalty * patienceBonus + literacyBonus + incomeImpact + networkPenalty
  ));
  
  return parseFloat(score.toFixed(2));
}

// Run simulation for a single merchant
async function runMerchantSimulation(merchant) {
  const scenarioConfig = merchant.scenarioConfig || {};
  const retryBonus = scenarioConfig.retryBonus || 0;
  const maxAttempts = merchant.retryThreshold + retryBonus;
  
  let attempts = 0;
  let success = false;
  let totalLatency = 0;
  const startTime = Date.now();
  
  // Initial delay
  const initialDelay = merchant.digitalLiteracy === 'basic' ? 2000 :
                      merchant.digitalLiteracy === 'intermediate' ? 1500 : 1000;
  await sleep(initialDelay + Math.random() * 1000);
  
  // Attempt loop
  while (attempts < maxAttempts && !success) {
    attempts++;
    
    const latency = await simulateNetworkDelay(merchant.networkProfile, scenarioConfig);
    totalLatency += latency;
    
    // Calculate success probability
    const literacyBonus = merchant.digitalLiteracy === 'advanced' ? 0.3 : 
                         merchant.digitalLiteracy === 'intermediate' ? 0.15 : 0;
    const incomeBonus = merchant.incomeLevel === 'high' ? 0.1 :
                       merchant.incomeLevel === 'medium' ? 0.05 : 0;
    const deviceBonus = merchant.deviceType === 'ios' ? 0.1 :
                       merchant.deviceType === 'android_mid' ? 0.05 : 0;
    const scenarioBonus = scenarioConfig.successProbabilityBonus || 0;
    
    const successProbability = 0.35 + literacyBonus + incomeBonus + deviceBonus + (merchant.patienceScore * 0.2) + scenarioBonus;
    success = Math.random() < successProbability;
    
    // Store attempt event
    storeEvent({
      merchantId: merchant.merchantId,
      scenarioId: merchant.scenarioId || 'UNKNOWN',
      scenario: merchant.issueType.toUpperCase(),
      networkProfile: merchant.networkProfile,
      digitalLiteracy: merchant.digitalLiteracy,
      incomeLevel: merchant.incomeLevel,
      deviceType: merchant.deviceType,
      event: 'ATTEMPT',
      attempt: attempts,
      latency: latency,
      result: success ? 'success' : 'retry',
      timestamp: Date.now()
    });
    
    // Wait before retry
    if (!success && attempts < maxAttempts) {
      const retryDelay = 1000 * (1 - merchant.patienceScore * 0.5);
      await sleep(retryDelay);
    }
  }
  
  // Calculate final metrics
  const completionTimeMs = Date.now() - startTime;
  const experienceScore = calculateExperienceScore(attempts, success, merchant);
  const failures = attempts - (success ? 1 : 0);
  
  const summaryData = {
    totalAttempts: attempts,
    failures: failures,
    success: success,
    experienceScore: experienceScore,
    completionTimeMs: completionTimeMs,
    avgLatencyMs: Math.round(totalLatency / attempts),
    issueType: merchant.issueType,
    networkProfile: merchant.networkProfile,
    digitalLiteracy: merchant.digitalLiteracy,
    incomeLevel: merchant.incomeLevel,
    deviceType: merchant.deviceType,
    outcome: success ? '✅ RESOLVED' : '❌ ABANDONED'
  };
  
  // Store summary event
  storeEvent({
    merchantId: merchant.merchantId,
    scenarioId: merchant.scenarioId || 'UNKNOWN',
    event: 'SUMMARY',
    summary: summaryData,
    timestamp: Date.now()
  });
  
  return { success, merchantId: merchant.merchantId };
}

// Run simulations for a single scenario
async function runScenarioSimulation(scenario, merchants, onProgress) {
  console.log(`\n🎬 Running Scenario: ${scenario.scenarioId}`);
  console.log(`   ${scenario.description}`);
  
  const enrichedMerchants = merchants.map(m => enrichMerchantWithScenario(m, scenario));
  const results = [];
  
  for (let i = 0; i < enrichedMerchants.length; i++) {
    const merchant = enrichedMerchants[i];
    const result = await runMerchantSimulation(merchant);
    results.push(result);
    
    if (onProgress) {
      onProgress({
        scenarioId: scenario.scenarioId,
        current: i + 1,
        total: enrichedMerchants.length,
        merchantId: merchant.merchantId,
        success: result.success
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  
  return {
    scenarioId: scenario.scenarioId,
    totalAgents: results.length,
    successful: successCount,
    failed: results.length - successCount
  };
}

// Run all scenario simulations
async function runAllScenarios(merchants, onProgress) {
  const scenarios = loadScenarios();
  
  if (scenarios.length === 0) {
    throw new Error('No scenarios found');
  }
  
  console.log(`\n📋 Loaded ${scenarios.length} scenarios`);
  console.log(`🚀 Starting simulations: ${merchants.length} merchants × ${scenarios.length} scenarios`);
  
  const scenarioResults = [];
  
  for (const scenario of scenarios) {
    const result = await runScenarioSimulation(scenario, merchants, onProgress);
    scenarioResults.push(result);
  }
  
  return scenarioResults;
}

module.exports = {
  loadScenarios,
  runScenarioSimulation,
  runAllScenarios
};
