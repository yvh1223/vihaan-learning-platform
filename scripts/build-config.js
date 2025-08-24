#!/usr/bin/env node

/**
 * Build Configuration Script
 * Processes configuration files for production deployment
 * Injects environment variables and validates settings
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Processing configuration for production build...');

// Configuration file paths
const configDir = path.join(__dirname, '..', 'config');
const publicConfigPath = path.join(configDir, 'public-config.json');
const distConfigPath = path.join(__dirname, '..', 'dist', 'config', 'public-config.json');

try {
  // Ensure dist config directory exists
  const distConfigDir = path.dirname(distConfigPath);
  if (!fs.existsSync(distConfigDir)) {
    fs.mkdirSync(distConfigDir, { recursive: true });
  }

  // Read the base configuration
  if (!fs.existsSync(publicConfigPath)) {
    console.error('❌ Base configuration file not found:', publicConfigPath);
    process.exit(1);
  }

  const baseConfig = JSON.parse(fs.readFileSync(publicConfigPath, 'utf8'));
  console.log('📖 Loaded base configuration');

  // Create production configuration
  const productionConfig = {
    ...baseConfig,
    environment: 'production',
    version: process.env.GITHUB_SHA || baseConfig.version,
    buildTime: new Date().toISOString()
  };

  // Inject production environment variables
  if (process.env.SUPABASE_URL) {
    productionConfig.supabase.url = process.env.SUPABASE_URL;
    console.log('✅ Injected Supabase URL');
  } else {
    console.warn('⚠️ SUPABASE_URL not found in environment variables');
  }

  if (process.env.SUPABASE_ANON_KEY) {
    productionConfig.supabase.anonKey = process.env.SUPABASE_ANON_KEY;
    console.log('✅ Injected Supabase Anonymous Key');
  } else {
    console.warn('⚠️ SUPABASE_ANON_KEY not found in environment variables');
  }

  // Update OpenAI configuration if provided
  if (process.env.OPENAI_API_ENDPOINT) {
    productionConfig.openai.endpoint = process.env.OPENAI_API_ENDPOINT;
    console.log('✅ Updated OpenAI endpoint');
  }

  // Enable production optimizations
  productionConfig.performance = {
    ...productionConfig.performance,
    compressionLevel: 85,
    cacheStrategy: 'cache-first',
    enableServiceWorker: true
  };

  productionConfig.security = {
    ...productionConfig.security,
    httpsOnly: true,
    contentSecurityPolicy: true,
    strictTransportSecurity: true
  };

  // Validate configuration
  const validationErrors = validateConfiguration(productionConfig);
  if (validationErrors.length > 0) {
    console.error('❌ Configuration validation failed:');
    validationErrors.forEach(error => console.error('  -', error));
    process.exit(1);
  }

  // Write production configuration
  fs.writeFileSync(distConfigPath, JSON.stringify(productionConfig, null, 2));
  console.log('✅ Production configuration written to:', distConfigPath);

  // Generate configuration summary
  generateConfigSummary(productionConfig);

  console.log('🎉 Configuration processing completed successfully!');

} catch (error) {
  console.error('❌ Error processing configuration:', error.message);
  process.exit(1);
}

/**
 * Validate production configuration
 * @param {Object} config - Configuration object to validate
 * @returns {Array} Array of validation errors
 */
function validateConfiguration(config) {
  const errors = [];

  // Check required fields
  if (!config.version) {
    errors.push('Version is required');
  }

  if (!config.buildTime) {
    errors.push('Build time is required');
  }

  // Validate Supabase configuration
  if (!config.supabase.url || config.supabase.url.includes('placeholder')) {
    errors.push('Valid Supabase URL is required for production');
  }

  if (!config.supabase.anonKey || config.supabase.anonKey.includes('placeholder')) {
    errors.push('Valid Supabase anonymous key is required for production');
  }

  // Validate security settings
  if (config.environment === 'production') {
    if (!config.security.httpsOnly) {
      errors.push('HTTPS must be enabled in production');
    }

    if (!config.security.contentSecurityPolicy) {
      errors.push('Content Security Policy must be enabled in production');
    }
  }

  // Validate feature flags
  const requiredFeatures = ['progressTracking', 'visualLearning', 'assessmentMode'];
  requiredFeatures.forEach(feature => {
    if (!config.features[feature]) {
      errors.push(`Feature '${feature}' must be enabled`);
    }
  });

  return errors;
}

/**
 * Generate configuration summary for deployment logs
 * @param {Object} config - Configuration object
 */
function generateConfigSummary(config) {
  console.log('\n📋 Configuration Summary:');
  console.log(`   Environment: ${config.environment}`);
  console.log(`   Version: ${config.version}`);
  console.log(`   Build Time: ${config.buildTime}`);
  console.log(`   Supabase URL: ${config.supabase.url.substring(0, 30)}...`);
  console.log(`   OpenAI Model: ${config.openai.model}`);
  console.log(`   Features Enabled: ${Object.keys(config.features).filter(k => config.features[k]).length}`);
  console.log(`   Security: HTTPS(${config.security.httpsOnly}), CSP(${config.security.contentSecurityPolicy})`);
  console.log(`   PWA: ServiceWorker(${config.performance.enableServiceWorker}), Offline(${config.features.offlineMode})`);
}