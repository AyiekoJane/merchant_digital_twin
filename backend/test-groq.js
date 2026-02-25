// Quick test script for Groq AI integration
require('dotenv').config();
const { isConfigured, generateAIRecommendations, generateInsightsSummary } = require('./modules/groqAI');

async function testGroqIntegration() {
  console.log('🧪 Testing Groq AI Integration\n');
  console.log('═'.repeat(60));
  
  // Check configuration
  console.log('\n1. Checking API Key Configuration...');
  if (isConfigured()) {
    console.log('   ✅ Groq API key is configured');
  } else {
    console.log('   ❌ Groq API key NOT configured');
    console.log('   📝 Please add your API key to backend/.env');
    console.log('   Get your key from: https://console.groq.com/keys\n');
    return;
  }
  
  // Test AI Recommendations
  console.log('\n2. Testing AI Recommendations...');
  const mockInsights = {
    operational: {
      completionRate: 65.5,
      avgDuration: 45000,
      dropoffs: 12,
      retryFrequency: 1.8
    },
    frictionPoints: [
      {
        type: 'validation',
        location: 'business_registration',
        description: '8 validation errors on field: business_registration',
        severity: 'high',
        count: 8
      }
    ],
    personaStruggles: [
      {
        persona: 'basic digital literacy',
        failureRate: 72.5,
        count: 15,
        total: 20,
        category: 'literacy'
      }
    ],
    networkImpact: [
      {
        profile: '2G',
        avgLatency: 3500,
        failureRate: 45.2,
        failures: 9,
        totalEvents: 20
      }
    ]
  };
  
  try {
    const recommendations = await generateAIRecommendations(mockInsights);
    
    if (recommendations && recommendations.length > 0) {
      console.log(`   ✅ Received ${recommendations.length} AI recommendations\n`);
      
      console.log('   Sample Recommendations:');
      recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`\n   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`      ${rec.description}`);
        console.log(`      Impact: ${rec.impact}`);
        console.log(`      Effort: ${rec.effort}`);
      });
    } else {
      console.log('   ⚠️  No recommendations received (check API key or connection)');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test Insights Summary
  console.log('\n\n3. Testing Insights Summary...');
  try {
    const summary = await generateInsightsSummary(mockInsights);
    
    if (summary) {
      console.log('   ✅ Generated AI summary:\n');
      console.log(`   "${summary}"\n`);
    } else {
      console.log('   ⚠️  No summary received');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Groq AI integration test complete!\n');
  console.log('Next steps:');
  console.log('  1. Start the backend: npm start');
  console.log('  2. Run a simulation');
  console.log('  3. Check /insights/live for AI recommendations\n');
}

// Run the test
testGroqIntegration().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
