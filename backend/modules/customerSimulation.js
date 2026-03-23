const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DOCKER_IMAGE = 'customer-agent:latest';

// Spawn one customer agent container
async function spawnCustomerAgent(customer, config, progressCallback) {
  const containerName = `customer_${customer.customer_id}_${Date.now()}`;

  const agentProfile = {
    ...customer,
    scenarioId: config.scenarioId || `customer-sim-${Date.now()}`
  };

  const customerProfile  = JSON.stringify(agentProfile).replace(/"/g, '\\"');
  const insightServiceUrl = process.env.INSIGHT_SERVICE_URL || 'http://host.docker.internal:3000';

  // Pass BrowserStack creds if available
  const bsUser = process.env.BROWSERSTACK_USER || '';
  const bsKey  = process.env.BROWSERSTACK_KEY  || '';
  const appUrl = process.env.APP_URL            || '';

  const dockerCmd = [
    `docker run --rm --name ${containerName}`,
    `-e CUSTOMER_PROFILE="${customerProfile}"`,
    `-e INSIGHT_SERVICE_URL="${insightServiceUrl}"`,
    `-e BROWSERSTACK_USER="${bsUser}"`,
    `-e BROWSERSTACK_KEY="${bsKey}"`,
    `-e APP_URL="${appUrl}"`,
    DOCKER_IMAGE
  ].join(' ');

  console.log(`🐳 Spawning customer container: ${containerName}`);
  console.log(`   Device: ${customer.device_type} | Network: ${customer.network_profile}`);
  console.log(`   Balance: KES ${customer.loan_balance} | Due in: ${customer.days_until_due} days`);

  progressCallback?.({
    customerId: customer.customer_id,
    status: 'starting',
    message: `Spawning agent for ${customer.customer_id}`
  });

  try {
    const { stdout, stderr } = await execPromise(dockerCmd);

    console.log(`✅ Customer agent ${customer.customer_id} completed`);
    progressCallback?.({ customerId: customer.customer_id, status: 'completed' });

    return { success: true, customerId: customer.customer_id, output: stdout };
  } catch (error) {
    console.error(`❌ Customer agent ${customer.customer_id} failed: ${error.message}`);
    progressCallback?.({ customerId: customer.customer_id, status: 'failed', message: error.message });

    return { success: false, customerId: customer.customer_id, error: error.message };
  }
}

// Run simulation for a batch of customers
async function runCustomerSimulation(customers, config, progressCallback) {
  const results   = [];
  const startTime = Date.now();
  const concurrent = config.simulationSpeed === 'accelerated' ? 3 : 1;

  console.log(`\n🎯 Starting business app simulation`);
  console.log(`👥 Customers: ${customers.length}`);
  console.log('═'.repeat(60));

  for (let i = 0; i < customers.length; i += concurrent) {
    const batch = customers.slice(i, i + concurrent);
    const batchResults = await Promise.all(
      batch.map(c => spawnCustomerAgent(c, config, progressCallback))
    );
    results.push(...batchResults);

    progressCallback?.({
      status:    'progress',
      completed: Math.min(i + concurrent, customers.length),
      total:     customers.length
    });
  }

  const completionTime = Date.now() - startTime;
  console.log('═'.repeat(60));
  console.log(`✅ Customer simulation done in ${completionTime}ms`);
  console.log(`   Success: ${results.filter(r => r.success).length}/${results.length}`);

  return {
    success:         true,
    totalCustomers:  customers.length,
    successCount:    results.filter(r => r.success).length,
    failureCount:    results.filter(r => !r.success).length,
    completionTimeMs: completionTime,
    results
  };
}

module.exports = { runCustomerSimulation };
