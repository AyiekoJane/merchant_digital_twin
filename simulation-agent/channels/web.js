const BaseChannel = require('./base');
const { chromium } = require('playwright');

class WebChannel extends BaseChannel {
  constructor(config) {
    super(config);
    this.browser = null;
    this.page = null;
    this.portalUrl = config.portalUrl || 'https://m-pesaforbusiness.co.ke/apply';
  }

  async initialize() {
    console.log('🌐 Initializing Web Channel...');
    
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport based on device type
    const viewports = {
      'ios': { width: 375, height: 812 },
      'android_high': { width: 412, height: 915 },
      'android_mid': { width: 360, height: 740 },
      'android_low': { width: 320, height: 568 }
    };
    
    const viewport = viewports[this.config.deviceType] || viewports['android_mid'];
    await this.page.setViewportSize(viewport);
    
    console.log(`✅ Browser initialized (${this.config.deviceType})`);
  }

  async executeOnboarding(merchantProfile) {
    console.log(`\n🚀 Starting onboarding for ${merchantProfile.merchantId}`);
    console.log(`📱 Device: ${merchantProfile.deviceType} | 📡 Network: ${merchantProfile.networkProfile}`);
    
    const startTime = Date.now();
    let currentStep = 0;
    const maxSteps = 10;
    
    try {
      // Navigate to portal
      currentStep++;
      await this.navigateToPortal(merchantProfile);
      
      // Simulate form filling based on merchant profile
      currentStep++;
      await this.fillBusinessInfo(merchantProfile);
      
      currentStep++;
      await this.fillContactInfo(merchantProfile);
      
      currentStep++;
      await this.fillDocumentation(merchantProfile);
      
      currentStep++;
      await this.submitApplication(merchantProfile);
      
      // Success
      const completionTime = Date.now() - startTime;
      
      this.collectInsight({
        merchantId: merchantProfile.merchantId,
        event: 'ONBOARDING_COMPLETE',
        success: true,
        completionTimeMs: completionTime,
        stepsCompleted: currentStep,
        totalSteps: maxSteps
      });
      
      console.log(`✅ Onboarding completed in ${completionTime}ms`);
      
      return {
        success: true,
        completionTimeMs: completionTime,
        stepsCompleted: currentStep
      };
      
    } catch (error) {
      const failureTime = Date.now() - startTime;
      
      this.collectInsight({
        merchantId: merchantProfile.merchantId,
        event: 'ONBOARDING_FAILED',
        success: false,
        error: error.message,
        failedAtStep: currentStep,
        totalSteps: maxSteps,
        timeBeforeFailure: failureTime
      });
      
      console.error(`❌ Onboarding failed at step ${currentStep}: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        failedAtStep: currentStep,
        timeBeforeFailure: failureTime
      };
    }
  }

  async navigateToPortal(merchantProfile) {
    const stepStart = Date.now();
    
    try {
      // Simulate network delay
      await this.simulateNetworkDelay(merchantProfile.networkProfile);
      
      const response = await this.page.goto(this.portalUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      const loadTime = Date.now() - stepStart;
      
      if (!response || !response.ok()) {
        throw new Error(`Portal returned status ${response?.status()}`);
      }
      
      this.collectInsight({
        merchantId: merchantProfile.merchantId,
        event: 'PAGE_LOAD',
        step: 'portal_landing',
        loadTimeMs: loadTime,
        success: true
      });
      
      console.log(`  ✓ Portal loaded (${loadTime}ms)`);
      
      // Simulate user reading/thinking time
      await this.simulateUserDelay(merchantProfile.digitalLiteracy, 'reading');
      
    } catch (error) {
      const loadTime = Date.now() - stepStart;
      
      this.collectInsight({
        merchantId: merchantProfile.merchantId,
        event: 'PAGE_LOAD_FAILED',
        step: 'portal_landing',
        loadTimeMs: loadTime,
        error: error.message,
        success: false
      });
      
      throw new Error(`Failed to load portal: ${error.message}`);
    }
  }

  async fillBusinessInfo(merchantProfile) {
    console.log('  📝 Filling business information...');
    
    // Simulate finding and filling form fields
    await this.simulateUserDelay(merchantProfile.digitalLiteracy, 'form_interaction');
    
    const fields = [
      { name: 'businessName', value: merchantProfile.businessName || 'Test Business' },
      { name: 'businessType', value: merchantProfile.businessType || 'retail' },
      { name: 'location', value: merchantProfile.location || 'Nairobi' }
    ];
    
    for (const field of fields) {
      await this.fillField(field, merchantProfile);
    }
    
    console.log('  ✓ Business info filled');
  }

  async fillContactInfo(merchantProfile) {
    console.log('  📞 Filling contact information...');
    
    await this.simulateUserDelay(merchantProfile.digitalLiteracy, 'form_interaction');
    
    const fields = [
      { name: 'phone', value: merchantProfile.phone || '+254700000000' },
      { name: 'email', value: merchantProfile.email || 'test@example.com' }
    ];
    
    for (const field of fields) {
      await this.fillField(field, merchantProfile);
    }
    
    console.log('  ✓ Contact info filled');
  }

  async fillDocumentation(merchantProfile) {
    console.log('  📄 Handling documentation...');
    
    await this.simulateUserDelay(merchantProfile.digitalLiteracy, 'document_upload');
    
    // Simulate document upload challenges based on digital literacy
    if (merchantProfile.digitalLiteracy === 'basic') {
      // Basic users may struggle with document upload
      if (Math.random() < 0.3) {
        this.collectInsight({
          merchantId: merchantProfile.merchantId,
          event: 'DOCUMENT_UPLOAD_CONFUSION',
          step: 'documentation',
          digitalLiteracy: merchantProfile.digitalLiteracy
        });
        
        // Extra delay for confusion
        await this.sleep(2000);
      }
    }
    
    console.log('  ✓ Documentation handled');
  }

  async submitApplication(merchantProfile) {
    console.log('  📤 Submitting application...');
    
    await this.simulateUserDelay(merchantProfile.digitalLiteracy, 'submission');
    await this.simulateNetworkDelay(merchantProfile.networkProfile);
    
    // Simulate submission success/failure based on profile
    const successProbability = this.calculateSuccessProbability(merchantProfile);
    
    if (Math.random() > successProbability) {
      throw new Error('Submission failed - validation error');
    }
    
    console.log('  ✓ Application submitted');
  }

  async fillField(field, merchantProfile) {
    const fillStart = Date.now();
    
    try {
      // Simulate typing delay based on digital literacy
      const typingDelay = this.getTypingDelay(merchantProfile.digitalLiteracy);
      await this.sleep(typingDelay);
      
      // Simulate validation
      if (Math.random() < 0.1) {
        // 10% chance of validation error
        this.collectInsight({
          merchantId: merchantProfile.merchantId,
          event: 'VALIDATION_ERROR',
          field: field.name,
          retryNeeded: true
        });
        
        // Retry after delay
        await this.sleep(1000);
      }
      
      const fillTime = Date.now() - fillStart;
      
      this.collectInsight({
        merchantId: merchantProfile.merchantId,
        event: 'FIELD_FILLED',
        field: field.name,
        fillTimeMs: fillTime
      });
      
    } catch (error) {
      this.collectInsight({
        merchantId: merchantProfile.merchantId,
        event: 'FIELD_FILL_FAILED',
        field: field.name,
        error: error.message
      });
      
      throw error;
    }
  }

  calculateSuccessProbability(merchantProfile) {
    let probability = 0.7; // Base 70% success rate
    
    // Digital literacy bonus
    if (merchantProfile.digitalLiteracy === 'advanced') probability += 0.2;
    else if (merchantProfile.digitalLiteracy === 'intermediate') probability += 0.1;
    
    // Network quality impact
    if (merchantProfile.networkProfile === '2G_EDGE') probability -= 0.2;
    else if (merchantProfile.networkProfile === '3G_POOR') probability -= 0.1;
    
    // Device type impact
    if (merchantProfile.deviceType === 'ios') probability += 0.05;
    
    return Math.max(0.3, Math.min(0.95, probability));
  }

  getTypingDelay(digitalLiteracy) {
    const delays = {
      'basic': 3000,
      'intermediate': 1500,
      'advanced': 800
    };
    return delays[digitalLiteracy] || 1500;
  }

  async simulateNetworkDelay(networkProfile) {
    const delays = {
      '4G_GOOD': 100,
      '4G_UNSTABLE': 300,
      '3G_POOR': 800,
      '2G_EDGE': 1500
    };
    
    const baseDelay = delays[networkProfile] || 500;
    const actualDelay = baseDelay + (Math.random() * 0.4 - 0.2) * baseDelay;
    
    await this.sleep(Math.round(actualDelay));
  }

  async simulateUserDelay(digitalLiteracy, action) {
    const delays = {
      'reading': { basic: 3000, intermediate: 2000, advanced: 1000 },
      'form_interaction': { basic: 2000, intermediate: 1000, advanced: 500 },
      'document_upload': { basic: 5000, intermediate: 3000, advanced: 1500 },
      'submission': { basic: 2000, intermediate: 1000, advanced: 500 }
    };
    
    const actionDelays = delays[action] || delays['form_interaction'];
    const baseDelay = actionDelays[digitalLiteracy] || actionDelays['intermediate'];
    const actualDelay = baseDelay + Math.random() * 1000;
    
    await this.sleep(Math.round(actualDelay));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

module.exports = WebChannel;
