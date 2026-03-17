const fs = require('fs');
const path = require('path');

const MERCHANT_GENERATOR_URL = process.env.MERCHANT_GENERATOR_URL || 'http://merchant-generator:3001/generate-merchants-from-csv';
const INSIGHT_SERVICE_URL    = process.env.INSIGHT_SERVICE_URL    || 'http://insight-service:3000';
const SIMULATION_QUEUE_URL   = process.env.SIMULATION_QUEUE_URL   || 'http://simulation-queue:3005';
const ONBOARDING_URL         = process.env.ONBOARDING_URL         || 'http://mock-portal/index.html';
const MAX_MERCHANTS          = parseInt(process.env.MAX_MERCHANTS  || '0'); // 0 = all

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Load scenario configurations
function loadScenarios() {
  const scenariosDir = process.env.NODE_ENV === 'production' ? '/scenarios' : path.join(__dirname, '..', 'scenarios');
  const scenarioFiles = fs.readdirSync(scenariosDir).filter(f => f.endsWith('.json'));
  const scenarios = scenarioFiles.map(file =>
    JSON.parse(fs.readFileSync(path.join(scenariosDir, file), 'utf8'))
  );
  console.log(`📋 Loaded ${scenarios.length} scenario configurations:`);
  scenarios.forEach(s => console.log(`   - ${s.scenarioId}: ${s.description}`));
  return scenarios;
}

// Fetch merchants with retry
async function fetchMerchants(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(MERCHANT_GENERATOR_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let merchants = await response.json();
      if (MAX_MERCHANTS > 0) {
        merchants = merchants.slice(0, MAX_MERCHANTS);
        console.log(`⚙️  Limiting to ${MAX_MERCHANTS} merchants (MAX_MERCHANTS env)`);
      }
      return merchants;
    } catch (err) {
      console.warn(`⚠️  Merchant generator not ready (attempt ${i+1}/${retries}): ${err.message}`);
      if (i < retries - 1) await sleep(3000);
    }
  }
  throw new Error('Could not reach merchant-generator after retries');
}

// Enqueue batch with retry
async function enqueueMerchants(merchants, scenarioId, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${SIMULATION_QUEUE_URL}/enqueue-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchants, scenarioId, onboardingUrl: ONBOARDING_URL })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn(`⚠️  Queue not ready (attempt ${i+1}/${retries}): ${err.message}`);
      if (i < retries - 1) await sleep(3000);
    }
  }
  throw new Error('Could not reach simulation-queue after retries');
}

function enrichMerchant(merchant, scenario) {
  return {
    ...merchant,
    scenarioId: scenario.scenarioId,
    onboardingUrl: ONBOARDING_URL,
    scenarioConfig: {
      latencyMultiplier: scenario.latencyMultiplier,
      retryBonus: scenario.retryBonus,
      successProbabilityBonus: scenario.successProbabilityBonus
    }
  };
}

// Poll queue until all jobs done
async function waitForQueueDrain(totalJobs, timeoutMs = 600000) {
  const start = Date.now();
  console.log(`\n⏳ Waiting for ${totalJobs} jobs to complete...`);
  while (Date.now() - start < timeoutMs) {
    await sleep(4000);
    try {
      const res  = await fetch(`${SIMULATION_QUEUE_URL}/stats`);
      const stats = await res.json();
      const done  = stats.completed + stats.failed;
      console.log(`   Queue → waiting:${stats.waiting} active:${stats.active} completed:${stats.completed} failed:${stats.failed}`);
      if (stats.waiting === 0 && stats.active === 0) {
        console.log(`✅ All jobs processed`);
        return stats;
      }
    } catch { /* queue briefly unavailable */ }
  }
  console.warn('⚠️  Timed out waiting for queue drain');
}

async function runScenarioSimulations() {
  console.log('🎯 Digital Twin Scenario Experimentation Engine');
  console.log('📊 Queue-based Multi-Scenario Simulation Runner');
  console.log('═'.repeat(70));

  const scenarios = loadScenarios();
  if (!scenarios.length) { console.error('❌ No scenarios found'); process.exit(1); }

  console.log('\n📡 Fetching merchant profiles...');
  const merchants = await fetchMerchants();
  console.log(`✅ Loaded ${merchants.length} merchant profiles`);

  // Clear previous insights
  try {
    await fetch(`${INSIGHT_SERVICE_URL}/insights/clear`, { method: 'DELETE' });
    console.log('✅ Previous data cleared');
  } catch { console.warn('⚠️  Could not clear previous data'); }

  const totalJobs = merchants.length * scenarios.length;
  console.log(`\n🚀 Enqueueing ${totalJobs} jobs (${merchants.length} merchants × ${scenarios.length} scenarios)...`);

  for (const scenario of scenarios) {
    const enriched = merchants.map(m => enrichMerchant(m, scenario));
    const result   = await enqueueMerchants(enriched, scenario.scenarioId);
    console.log(`   ✓ Enqueued ${result.enqueued} jobs for scenario ${scenario.scenarioId}`);
  }

  await waitForQueueDrain(totalJobs);
  console.log('\n💡 View insights: http://localhost:3000/insights/summary');
}

runScenarioSimulations().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
