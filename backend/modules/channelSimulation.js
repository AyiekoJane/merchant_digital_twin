const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DOCKER_IMAGE = 'simulation-agent:latest';

// Available channels
const CHANNELS = {
  WEB: { name: 'Web Portal', enabled: true },
  USSD: { name: 'USSD', enabled: false },
  APP: { name: 'Mobile App', enabled: false }
};

// Get available channels
function getAvailableChannels() {
  return Object.entries(CHANNELS).map(([key, value]) => ({
    id: key,
    name: value.name,
    enabled: value.enabled
  }));
}

// Spawn agent container with channel configuration
async function spawnChannelAgent(merchant, channelConfig, progressCallback) {
  const containerName = `agent_${merchant.merchantId}_${Date.now()}`;
  
  // Merge merchant profile with channel config
  const agentProfile = {
    ...merchant,
    channel: channelConfig.channel || 'WEB',
    portalUrl: channelConfig.portalUrl || 'https://m-pesaforbusiness.co.ke/apply',
    scenarioId: channelConfig.scenarioId || 'channel-simulation'
  };
  
  const merchantProfile = JSON.stringify(agentProfile).replace(/"/g, '\\"');
  const insightServiceUrl = process.env.INSIGHT_SERVICE_URL || 'http://host.docker.internal:3000';
  
  const dockerCmd = `docker run --rm --name ${containerName} -e MERCHANT_PROFILE="${merchantProfile}" -e INSIGHT_SERVICE_URL="${insightServiceUrl}" ${DOCKER_IMAGE}`;
  
  if (progressCallback) {
    progressCallback({
      merchantId: merchant.merchantId,
      status: 'starting',
      message: 'Spawning agent container'
    });
  }
  
  try {
    const { stdout, stderr } = await execPromise(dockerCmd);
    
    if (progressCallback) {
      progressCallback({
        merchantId: merchant.merchantId,
        status: 'completed',
        message: 'Agent completed',
        output: stdout
      });
    }
    
    return {
      success: true,
      merchantId: merchant.merchantId,
      output: stdout,
      stderr: stderr
    };
    
  } catch (error) {
    if (progressCallback) {
      progressCallback({
        merchantId: merchant.merchantId,
        status: 'failed',
        message: error.message
      });
    }
    
    return {
      success: false,
      merchantId: merchant.merchantId,
      error: error.message
    };
  }
}

// Run channel-based simulation for multiple merchants
async function runChannelSimulation(merchants, config, progressCallback) {
  const results = [];
  const startTime = Date.now();
  
  console.log(`\n🎯 Starting channel-based simulation`);
  console.log(`📊 Channel: ${config.channel}`);
  console.log(`🔗 Portal: ${config.portalUrl}`);
  console.log(`👥 Merchants: ${merchants.length}`);
  console.log('═'.repeat(60));
  
  // Determine concurrency based on simulation speed
  const concurrent = config.simulationSpeed === 'accelerated' ? 3 : 1;
  
  // Process merchants in batches
  for (let i = 0; i < merchants.length; i += concurrent) {
    const batch = merchants.slice(i, i + concurrent);
    
    const batchPromises = batch.map(merchant => 
      spawnChannelAgent(merchant, config, progressCallback)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Progress update
    if (progressCallback) {
      progressCallback({
        status: 'progress',
        completed: Math.min(i + concurrent, merchants.length),
        total: merchants.length
      });
    }
  }
  
  const completionTime = Date.now() - startTime;
  
  console.log('═'.repeat(60));
  console.log(`✅ Simulation completed in ${completionTime}ms`);
  console.log(`   Success: ${results.filter(r => r.success).length}/${results.length}`);
  
  return {
    success: true,
    totalMerchants: merchants.length,
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length,
    completionTimeMs: completionTime,
    results: results
  };
}

module.exports = {
  getAvailableChannels,
  spawnChannelAgent,
  runChannelSimulation
};
