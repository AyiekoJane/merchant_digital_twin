// Customer Payment Agent
// Simulates customer behavior making installment payments (Lipa Mdogo Mdogo)
// via the mobile app channel using Appium + BrowserStack

const APP_PACKAGE = 'ke.safaricom.mpesa.business.uat';

// Real element IDs from UI inspection
const ELEMENTS = {
  closeButton:      `${APP_PACKAGE}:id/closeButton`,
  navTransact:      `${APP_PACKAGE}:id/bottomNavigationTransactions`,
  navOrganization:  `${APP_PACKAGE}:id/bottomNavigationOrganization`,
  navAccount:       `${APP_PACKAGE}:id/bottomNavigationAccount`,
  navHome:          `${APP_PACKAGE}:id/bottomNavigationHome`,
  clickContainer:   `${APP_PACKAGE}:id/clickContainer`,
  menuTitle:        `${APP_PACKAGE}:id/title`,
};
const BROWSERSTACK_USER   = process.env.BROWSERSTACK_USER;
const BROWSERSTACK_KEY    = process.env.BROWSERSTACK_KEY;
const APP_URL             = process.env.APP_URL;
const USE_LOCAL_APPIUM    = process.env.USE_LOCAL_APPIUM === 'true';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Network latency per profile
const NETWORK_LATENCY = {
  '4G_GOOD':      100,
  '4G_UNSTABLE':  300,
  '3G_POOR':      800,
  '2G_EDGE':     1500
};

// Typing/interaction delays per literacy level
const INTERACTION_DELAYS = {
  basic:        { tap: 2000, read: 3000, pin: 4000 },
  intermediate: { tap: 1000, read: 1500, pin: 2000 },
  advanced:     { tap:  400, read:  800, pin:  800 }
};

// Device name mapping for BrowserStack
const DEVICE_MAP = {
  android_low_end: 'Samsung Galaxy A13',
  android_mid:     'Samsung Galaxy S22',
  ios:             'iPhone 14'
};

const INSIGHT_SERVICE_URL = process.env.INSIGHT_SERVICE_URL;

async function sendEvent(customer, eventName, extra = {}) {
  if (!INSIGHT_SERVICE_URL) return; // silently skip if not configured
  try {
    await fetch(`${INSIGHT_SERVICE_URL}/simulation-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId:  customer.customer_id,   // reuse merchantId field for pipeline compatibility
        scenarioId:  customer.scenarioId || 'customer-payment-sim',
        event:       eventName,
        channel:     'APP',
        userType:    'customer',
        timestamp:   Date.now(),
        networkProfile:   customer.network_profile,
        digitalLiteracy:  customer.digital_literacy,
        deviceType:       customer.device_type,
        paymentMethod:    customer.payment_method,
        ...extra
      })
    });
  } catch (err) {
    console.error(`⚠️  Could not send event ${eventName}:`, err.message);
  }
}

async function simulateNetworkDelay(networkProfile) {
  const base   = NETWORK_LATENCY[networkProfile] || 500;
  const jitter = base * (Math.random() * 0.4 - 0.2);
  await sleep(Math.round(base + jitter));
  return Math.round(base + jitter);
}

function getDelays(literacy) {
  return INTERACTION_DELAYS[literacy] || INTERACTION_DELAYS.intermediate;
}

function getCustomer() {
  const raw = process.env.CUSTOMER_PROFILE;
  if (!raw) { console.error('ERROR: CUSTOMER_PROFILE not set'); process.exit(1); }
  try { return JSON.parse(raw); }
  catch (e) { console.error('ERROR: Bad CUSTOMER_PROFILE JSON:', e.message); process.exit(1); }
}

// ─── Appium driver (BrowserStack) ────────────────────────────────────────────
async function createDriver(customer) {
  const { remote } = require('webdriverio');

  const isLocal = USE_LOCAL_APPIUM || !BROWSERSTACK_USER || !BROWSERSTACK_KEY;

  if (isLocal) {
    return remote({
      hostname: 'host.docker.internal',
      port: 4723,
      protocol: 'http',
      path: '/',
      connectionRetryTimeout: 60000,
      connectionRetryCount: 1,
      capabilities: {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': process.env.APPIUM_DEVICE_NAME || 'emulator-5554',
        'appium:appPackage': 'ke.safaricom.mpesa.business.uat',
        'appium:appActivity': 'com.mpesa.splash.SplashActivity',
        'appium:noReset': true
      }
    });
  }

  return remote({
    hostname: 'hub.browserstack.com',
    port: 443,
    protocol: 'https',
    path: '/wd/hub',
    connectionRetryTimeout: 60000,
    connectionRetryCount: 1,
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:app': APP_URL,
      'bstack:options': {
        userName:      BROWSERSTACK_USER,
        accessKey:     BROWSERSTACK_KEY,
        deviceName:    DEVICE_MAP[customer.device_type] || 'Samsung Galaxy S22',
        osVersion:     '12.0',
        appiumVersion: '2.0.0',
        sessionName:   `Customer ${customer.customer_id} - Payment Sim`
      }
    }
  });
}


// ─── Simulation steps ─────────────────────────────────────────────────────────
async function runPaymentSimulation(customer, driver) {
  const delays    = getDelays(customer.digital_literacy);
  const startTime = Date.now();
  let   step      = 0;

  // Step 1: App open
  step++;
  console.log(`📱 Step ${step}: Opening app`);
  await simulateNetworkDelay(customer.network_profile);

  // Low-end devices take longer to render
  const appLoadMs = customer.device_type === 'android_low_end'
    ? 3000 + Math.random() * 2000
    : 1000 + Math.random() * 500;
  await sleep(appLoadMs);

  await sendEvent(customer, 'APP_OPEN', { appLoadMs: Math.round(appLoadMs) });
  console.log(`   ✓ App opened (${Math.round(appLoadMs)}ms)`);

  // Step 2: Navigate to payment screen
  step++;
  console.log(`📱 Step ${step}: Navigating to payment screen`);
  await sleep(delays.read);

  if (driver) {
    try {
      // Restart app to ensure we're on the home screen
      try { await driver.terminateApp(APP_PACKAGE); } catch { /* ignore */ }
      await sleep(1500);
      await driver.activateApp(APP_PACKAGE);
      await sleep(3000); // wait for home screen to fully load
      console.log(`   ✓ App restarted to home screen`);
    } catch { /* ignore restart errors */ }

    try {
      // Dismiss any popup/close button first
      try {
        const closeBtn = await driver.$(`id:${ELEMENTS.closeButton}`);
        if (await closeBtn.isDisplayed()) {
          await closeBtn.click();
          await sleep(500);
        }
      } catch { /* no popup */ }

      // Tap the Transact tab in bottom navigation
      const transactTab = await driver.$(`id:${ELEMENTS.navTransact}`);
      await transactTab.click();
      await sleep(delays.tap);
      console.log(`   ✓ Tapped Transact tab`);

      // Tap REQUEST PAYMENT from transact menu (opens the Request Payment screen)
      const requestPaymentBtn = await driver.$(
        `//android.widget.FrameLayout[@clickable="true"][.//android.widget.TextView[@text="REQUEST PAYMENT"]]`
      );
      await requestPaymentBtn.click();
      await sleep(delays.tap);
      console.log(`   ✓ Tapped REQUEST PAYMENT (menu)`);

      // On the Request Payment screen, tap the transactionLayoutContainer row
      // This opens the bottom sheet with options
      const requestRow = await driver.$(`id:${APP_PACKAGE}:id/transactionLayoutContainer`);
      await requestRow.click();
      await sleep(delays.tap);
      console.log(`   ✓ Tapped REQUEST PAYMENT row`);

      // Tap "REQUEST PAYMENT FROM CUSTOMER" from bottom sheet
      const fromCustomerBtn = await driver.$(
        `//android.view.ViewGroup[@clickable="true"][.//android.widget.TextView[@text="REQUEST PAYMENT FROM CUSTOMER"]]`
      );
      await fromCustomerBtn.click();
      await sleep(delays.tap);
      console.log(`   ✓ Tapped REQUEST PAYMENT FROM CUSTOMER`);

      // Enter customer phone number
      const phoneField = await driver.$(`id:${APP_PACKAGE}:id/inputEditText`);
      await phoneField.click();
      await sleep(500);
      await phoneField.setValue('254712510792');
      await sleep(delays.tap);
      console.log(`   ✓ Entered customer phone number`);

      // Tap CONTINUE (phone screen)
      const continueBtn = await driver.$(`id:${APP_PACKAGE}:id/submitButton`);
      await continueBtn.click();
      await sleep(delays.tap);
      console.log(`   ✓ Tapped CONTINUE`);

      // ── Amount entry screen ──────────────────────────────────────────────
      // The app uses a custom numpad (cell0–cell9), not the system keyboard.
      // Enter "50" by tapping cell5 then cell0.
      const amount = String(customer.installment_amount || 50);
      for (const digit of amount) {
        const cell = await driver.$(`id:${APP_PACKAGE}:id/cell${digit}`);
        await cell.click();
        await sleep(300);
      }
      console.log(`   ✓ Entered amount KES ${amount}`);

      // Tap CONTINUE (amount screen) — id is continueButton here
      const amountContinueBtn = await driver.$(`id:${APP_PACKAGE}:id/continueButton`);
      await amountContinueBtn.click();
      await sleep(delays.tap);
      console.log(`   ✓ Tapped CONTINUE on amount screen`);
    } catch (e) {
      console.error(`   ❌ Navigation error: ${e.message}`);
      await sendEvent(customer, 'NAVIGATION_CONFUSION', { step: 'find_payment', error: e.message });
    }
  } else {
    await sleep(delays.tap);
  }

  await sendEvent(customer, 'PAYMENT_SCREEN_REACHED');
  console.log(`   ✓ Payment screen reached`);

  // Step 3: Amount entered, STK push sent to customer
  step++;
  console.log(`📱 Step ${step}: STK push sent to customer phone`);
  await simulateNetworkDelay(customer.network_profile);

  await sendEvent(customer, 'PAYMENT_INITIATED', {
    amount:        customer.installment_amount,
    paymentMethod: customer.payment_method,
    loanBalance:   customer.loan_balance
  });
  console.log(`   ✓ Payment request sent — KES ${customer.installment_amount} to ${customer.network_profile}`);

  // Step 4: Wait for customer to enter PIN on their phone and confirm
  step++;
  console.log(`📱 Step ${step}: Waiting for customer to enter PIN and confirm...`);

  // STK push takes time depending on network
  const stkDelay = (NETWORK_LATENCY[customer.network_profile] || 500) * 2;
  await sleep(stkDelay);

  // 2G users have 25% chance of STK timeout
  const stkTimedOut = customer.network_profile === '2G_EDGE' && Math.random() < 0.25;
  if (stkTimedOut) {
    console.log(`   ⏱️  STK push timed out (2G network)`);
    await sendEvent(customer, 'STK_TIMEOUT', { waitedMs: stkDelay });
    if (customer.patience_score < 0.4) {
      throw new Error('Customer abandoned — STK timeout, low patience');
    }
    console.log(`   🔄 Retrying...`);
    await sendEvent(customer, 'RETRY_ATTEMPTED', { reason: 'stk_timeout' });
    await sleep(stkDelay);
  }

  await sendEvent(customer, 'PAYMENT_PROMPT_RECEIVED', { method: customer.payment_method });
  console.log(`   ✓ Customer PIN entered — awaiting confirmation`);

  // Step 5: Confirmation
  step++;
  console.log(`📱 Step ${step}: Awaiting payment confirmation`);
  await simulateNetworkDelay(customer.network_profile);

  // Overdue customers have higher failure rate (payment might be blocked)
  const failChance = customer.missed_payments >= 2 ? 0.3
    : customer.missed_payments === 1 ? 0.1
    : 0.05;

  if (Math.random() < failChance) {
    throw new Error(`Payment failed — account status issue (${customer.missed_payments} missed payments)`);
  }

  const completionMs = Date.now() - startTime;
  await sendEvent(customer, 'PAYMENT_CONFIRMED', {
    amount:        customer.installment_amount,
    completionMs,
    newBalance:    customer.loan_balance - customer.installment_amount
  });

  console.log(`   ✓ Payment confirmed in ${completionMs}ms`);
  return { success: true, completionMs, step };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const customer = getCustomer();

  console.log(`\n🤖 Customer Agent: ${customer.customer_id}`);
  console.log(`📱 Device: ${customer.device_type} | 📡 Network: ${customer.network_profile}`);
  console.log(`💡 Literacy: ${customer.digital_literacy} | 💳 Method: ${customer.payment_method}`);
  console.log(`💰 Balance: KES ${customer.loan_balance} | Due in: ${customer.days_until_due} days`);
  console.log(`⚠️  Missed payments: ${customer.missed_payments}\n`);

  const startTime = Date.now();
  let driver = null;

  try {
    // Only connect to BrowserStack if credentials are provided
    if (USE_LOCAL_APPIUM || BROWSERSTACK_USER) {
      console.log(USE_LOCAL_APPIUM ? '🔌 Connecting to local Appium...' : '🔌 Connecting to BrowserStack...');
      try {
        driver = await createDriver(customer);
        console.log('✅ Appium session started\n');
      } catch (bsError) {
        console.log(`⚠️  Appium connection failed: ${bsError.message}`);
        console.log('ℹ️  Falling back to behavioral simulation only\n');
        driver = null;
      }
    } else {
      console.log('ℹ️  No BrowserStack credentials — running behavioral simulation only\n');
    }

    const result = await runPaymentSimulation(customer, driver);

    await sendEvent(customer, 'ONBOARDING_SUMMARY', {
      summary: {
        merchantId:      customer.customer_id,
        success:         true,
        completionTimeMs: result.completionMs,
        stepsCompleted:  result.step,
        channel:         'APP',
        userType:        'customer',
        networkProfile:  customer.network_profile,
        digitalLiteracy: customer.digital_literacy,
        deviceType:      customer.device_type,
        paymentMethod:   customer.payment_method,
        missedPayments:  customer.missed_payments,
        outcome:         '✅ PAYMENT COMPLETED'
      }
    });

    console.log(`\n✅ Payment simulation complete for ${customer.customer_id}`);

  } catch (err) {
    const failMs = Date.now() - startTime;
    console.error(`\n❌ Payment failed: ${err.message}`);

    await sendEvent(customer, 'ONBOARDING_SUMMARY', {
      summary: {
        merchantId:       customer.customer_id,
        success:          false,
        error:            err.message,
        timeBeforeFailure: failMs,
        channel:          'APP',
        userType:         'customer',
        networkProfile:   customer.network_profile,
        digitalLiteracy:  customer.digital_literacy,
        deviceType:       customer.device_type,
        paymentMethod:    customer.payment_method,
        missedPayments:   customer.missed_payments,
        outcome:          '❌ PAYMENT FAILED'
      }
    });

  } finally {
    if (driver) {
      await driver.deleteSession();
      console.log('🧹 BrowserStack session closed');
    }
    process.exit(0);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
