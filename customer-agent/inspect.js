// Run this directly on the host (not in Docker) to inspect the M-PESA app UI
// cd customer-agent && node inspect.js

const { remote } = require('webdriverio');
const fs = require('fs');

const PKG = 'ke.safaricom.mpesa.business.uat';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function dumpScreen(driver, label, filename) {
  const src = await driver.getPageSource();
  fs.writeFileSync(filename, src);
  console.log(`\n📄 Saved ${filename}`);

  console.log(`\n--- ${label}: clickable elements ---`);
  const els = await driver.$$('//*[@clickable="true"]');
  for (const el of els) {
    const rid = await el.getAttribute('resource-id');
    const txt = await el.getAttribute('text');
    const hint = await el.getAttribute('hint');
    const cls  = await el.getAttribute('class');
    console.log({ rid, txt, hint, cls });
  }
}

async function inspect() {
  console.log('Connecting to Appium...');
  const driver = await remote({
    hostname: 'localhost',
    port: 4723,
    protocol: 'http',
    path: '/',
    connectionRetryTimeout: 60000,
    connectionRetryCount: 1,
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': '1208937448002025',
      'appium:appPackage': PKG,
      'appium:appActivity': 'com.mpesa.splash.SplashActivity',
      'appium:noReset': true
    }
  });

  console.log('✅ Connected. Restarting app...');
  try { await driver.terminateApp(PKG); } catch { /* ignore */ }
  await sleep(1500);
  await driver.activateApp(PKG);
  await sleep(4000);

  // Dismiss popup if present
  try {
    const closeBtn = await driver.$(`id:${PKG}:id/closeButton`);
    if (await closeBtn.isDisplayed()) {
      await closeBtn.click();
      await sleep(1000);
      console.log('Dismissed popup');
    }
  } catch { /* no popup */ }

  // Tap Transact tab
  const transact = await driver.$(`id:${PKG}:id/bottomNavigationTransactions`);
  await transact.click();
  await sleep(2000);
  console.log('✅ Tapped Transact tab');

  // Tap REQUEST PAYMENT (menu item)
  const requestPayment = await driver.$(
    '//android.widget.FrameLayout[@clickable="true"][.//android.widget.TextView[@text="REQUEST PAYMENT"]]'
  );
  await requestPayment.click();
  await sleep(2000);
  console.log('✅ Tapped REQUEST PAYMENT (menu)');

  // Tap REQUEST PAYMENT row
  const requestRow = await driver.$(`id:${PKG}:id/transactionLayoutContainer`);
  await requestRow.click();
  await sleep(2000);
  console.log('✅ Tapped REQUEST PAYMENT row');

  // Tap REQUEST PAYMENT FROM CUSTOMER (bottom sheet)
  const fromCustomer = await driver.$(
    '//android.view.ViewGroup[@clickable="true"][.//android.widget.TextView[@text="REQUEST PAYMENT FROM CUSTOMER"]]'
  );
  await fromCustomer.click();
  await sleep(2000);
  console.log('✅ Tapped REQUEST PAYMENT FROM CUSTOMER');

  // Enter phone number
  const phoneField = await driver.$(`id:${PKG}:id/inputEditText`);
  await phoneField.click();
  await sleep(500);
  await phoneField.setValue('254712510792');
  await sleep(1000);
  console.log('✅ Entered phone number');

  // Tap CONTINUE (phone screen)
  const phoneSubmit = await driver.$(`id:${PKG}:id/submitButton`);
  await phoneSubmit.click();
  await sleep(3000);
  console.log('✅ Tapped CONTINUE (phone screen) — now on amount screen');

  // ── Amount screen ──────────────────────────────────────────────────────────
  // Enter "50" via custom numpad
  for (const digit of '50') {
    const cell = await driver.$(`id:${PKG}:id/cell${digit}`);
    await cell.click();
    await sleep(300);
  }
  console.log('✅ Entered amount 50');

  // Tap CONTINUE (amount screen)
  const amountContinue = await driver.$(`id:${PKG}:id/continueButton`);
  await amountContinue.click();
  await sleep(3000);
  console.log('✅ Tapped CONTINUE (amount screen) — now on description screen');

  // ── Description screen ─────────────────────────────────────────────────────
  await dumpScreen(driver, 'Description screen', 'ui-description.xml');

  // Enter description using system keyboard
  const descField = await driver.$(`id:${PKG}:id/inputEditText`);
  await descField.click();
  await sleep(500);
  await descField.setValue('request payment');
  await sleep(1000);
  console.log('✅ Entered description: request payment');

  // Tap CONTINUE (description screen)
  const descSubmit = await driver.$(`id:${PKG}:id/submitButton`);
  await descSubmit.click();
  await sleep(3000);
  console.log('✅ Tapped CONTINUE (description screen) — now on confirmation screen');

  // ── Confirmation screen ────────────────────────────────────────────────────
  await dumpScreen(driver, 'Confirmation screen', 'ui-confirmation.xml');

  // Try to find and tap the confirm/continue button
  let confirmed = false;
  for (const btnId of ['submitButton', 'continueButton', 'confirmButton', 'btnConfirm', 'actionButton']) {
    try {
      const btn = await driver.$(`id:${PKG}:id/${btnId}`);
      if (await btn.isDisplayed()) {
        const txt = await btn.getAttribute('text');
        console.log(`\n🔘 Found confirmation button: ${btnId} = "${txt}"`);
        await btn.click();
        await sleep(3000);
        console.log(`✅ Tapped ${btnId} on confirmation screen`);
        confirmed = true;
        break;
      }
    } catch { /* try next */ }
  }
  if (!confirmed) {
    console.log('⚠️  Could not find confirmation button — check ui-confirmation.xml');
    console.log('Trying XPath for any button with CONFIRM/CONTINUE text...');
    try {
      const anyBtn = await driver.$(
        '//*[@clickable="true"][contains(@text,"CONFIRM") or contains(@text,"CONTINUE") or contains(@text,"PROCEED")]'
      );
      const txt = await anyBtn.getAttribute('text');
      const rid = await anyBtn.getAttribute('resource-id');
      console.log(`Found via XPath: rid="${rid}" text="${txt}"`);
      await anyBtn.click();
      await sleep(3000);
      confirmed = true;
    } catch (e) {
      console.log('XPath fallback also failed:', e.message);
    }
  }

  // ── PIN screen ─────────────────────────────────────────────────────────────
  await dumpScreen(driver, 'PIN screen', 'ui-pin.xml');

  await driver.deleteSession();
  console.log('\n✅ Done. Check ui-description.xml, ui-confirmation.xml, ui-pin.xml');
}

inspect().catch(err => { console.error('Error:', err.message); process.exit(1); });
