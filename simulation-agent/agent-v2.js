// AI Agent V2 - Channel-Based Onboarding Simulation

const { createChannel } = require('./channels');

// Configuration
const INSIGHT_SERVICE_URL = process.env.INSIGHT_SERVICE_URL || 'http://localhost:3000';

// Send event to Insight Service
async function sendEventToInsightService(eventData) {
  try {
    const response = await fetch(`${INSIGHT_SERVICE_URL}/simulation-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    
    if (!response.ok) {
      console.error(`⚠️  Failed to send event to Insight Service: ${response.status}`);
    }
  } catch (error) {
    console.error(`⚠️  Could not reach Insight Service: ${error.message}`);
  }
}

// Parse merchant profile from environment variable
function getMerchantProfile() {
  const profileJson = process.env.MERCHANT_PROFILE;
  
  if (!profileJson) {
    console.error('ERROR: MERCHANT_PROFILE environment variable not set');
    process.exit(1);
  }
  
  try {
    return JSON.parse(profileJson);
  } catch (error) {
    console.error('ERROR: Failed to parse MERCHANT_PROFILE JSON:', error.message);
    process.exit(1);
  }
}

// Main agent simulation logic
async function runChannelBasedSimulation() {
  const merchant = getMerchantProfile();
  
  console.log(`\n🤖 Agent V2 started for merchant: ${merchant.merchantId}`);
  console.log(`📱 Device: ${merchant.deviceType} | 📡 Network: ${merchant.networkProfile}`);
  console.log(`🎯 Channel: ${merchant.channel || 'WEB'}`);
  console.log(`🔗 Portal URL: ${merchant.portalUrl || 'default'}`);
  console.log(`💼 Digital Literacy: ${merchant.digitalLiteracy} | 💰 Income: ${merchant.incomeLevel}`);
  console.log('');
  
  const startTime = Date.now();
  let channel = null;
  
  try {
    // Create channel instance
    const channelType = merchant.channel || 'WEB';
    const channelConfig = {
      deviceType: merchant.deviceType,
      networkProfile: merchant.networkProfile,
      portalUrl: merchant.portalUrl || 'https://m-pesaforbusiness.co.ke/apply'
    };
    
    console.log(`📋 Channel Configuration:`);
    console.log(`   Type: ${channelType}`);
    console.log(`   Portal: ${channelConfig.portalUrl}`);
    console.log(`   Device: ${channelConfig.deviceType}`);
    console.log(`   Network: ${channelConfig.networkProfile}`);
    console.log('');
    
    channel = createChannel(channelType, channelConfig);
    
    // Initialize channel
    console.log(`🔧 Initializing ${channelType} channel...`);
    await channel.initialize();
    console.log(`✅ Channel initialized successfully`);
    console.log('');
    
    // Execute onboarding journey
    console.log(`🚀 Executing onboarding journey...`);
    const result = await channel.executeOnboarding(merchant);
    console.log(`${result.success ? '✅' : '❌'} Onboarding ${result.success ? 'completed' : 'failed'}`);
    
    // Collect all insights from channel
    const insights = channel.getInsights();
    console.log(`📊 Collected ${insights.length} insights from channel`);
    
    // Send all insights to Insight Service
    console.log(`📤 Sending insights to Insight Service...`);
    for (const insight of insights) {
      await sendEventToInsightService({
        ...insight,
        scenarioId: merchant.scenarioId || 'UNKNOWN',
        merchantId: merchant.merchantId
      });
    }
    console.log(`✅ All insights sent successfully`);
    
    // Calculate final metrics
    const completionTimeMs = Date.now() - startTime;
    
    const summary = {
      merchantId: merchant.merchantId,
      scenarioId: merchant.scenarioId || 'UNKNOWN',
      channel: channelType,
      success: result.success,
      completionTimeMs: completionTimeMs,
      stepsCompleted: result.stepsCompleted || 0,
      totalInsights: insights.length,
      digitalLiteracy: merchant.digitalLiteracy,
      networkProfile: merchant.networkProfile,
      deviceType: merchant.deviceType,
      outcome: result.success ? '✅ COMPLETED' : '❌ FAILED'
    };
    
    // Log summary
    console.log('\n' + '─'.repeat(50));
    console.log(JSON.stringify({ summary }, null, 2));
    console.log('─'.repeat(50) + '\n');
    
    // Send summary to Insight Service
    await sendEventToInsightService({
      merchantId: merchant.merchantId,
      scenarioId: merchant.scenarioId || 'UNKNOWN',
      event: 'ONBOARDING_SUMMARY',
      summary: summary,
      timestamp: Date.now()
    });
    
    // Cleanup
    await channel.cleanup();
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Agent error:', error.message);
    
    // Send error event
    await sendEventToInsightService({
      merchantId: merchant.merchantId,
      scenarioId: merchant.scenarioId || 'UNKNOWN',
      event: 'AGENT_ERROR',
      error: error.message,
      timestamp: Date.now()
    });
    
    // Cleanup if channel was initialized
    if (channel) {
      try {
        await channel.cleanup();
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }
    }
    
    process.exit(1);
  }
}

// Run the simulation
runChannelBasedSimulation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
