#!/usr/bin/env node

/**
 * Security Scanning Script
 * Validates that no sensitive information is included in the build
 * Checks for exposed API keys, credentials, and security vulnerabilities
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Running security scan...');

// Security scan configuration
const SENSITIVE_PATTERNS = [
  // API Keys and tokens
  /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
  /pk_live_[a-zA-Z0-9]{24}/g, // Stripe live keys
  /pk_test_[a-zA-Z0-9]{24}/g, // Stripe test keys
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub personal access tokens
  /xoxb-[a-zA-Z0-9-]+/g, // Slack bot tokens
  /xoxp-[a-zA-Z0-9-]+/g, // Slack user tokens
  /AIza[0-9A-Za-z\\-_]{35}/g, // Google API keys
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}.*password/gi, // Email/password combinations
  
  // Database and service credentials
  /postgresql:\/\/.*:.*@/g, // PostgreSQL connection strings with credentials
  /mysql:\/\/.*:.*@/g, // MySQL connection strings with credentials
  /mongodb:\/\/.*:.*@/g, // MongoDB connection strings with credentials
  
  // Generic secrets
  /password\s*[:=]\s*["'][^"']+["']/gi,
  /secret\s*[:=]\s*["'][^"']+["']/gi,
  /token\s*[:=]\s*["'][^"']+["']/gi,
  /key\s*[:=]\s*["'][^"']+["']/gi,
  
  // AWS credentials
  /AKIA[0-9A-Z]{16}/g, // AWS access key
  /aws_secret_access_key\s*[:=]/gi,
  
  // Private keys
  /-----BEGIN PRIVATE KEY-----/g,
  /-----BEGIN RSA PRIVATE KEY-----/g,
  /-----BEGIN EC PRIVATE KEY-----/g,
];

// Files and directories to ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /\.env\.example/,
  /security-scan\.js$/, // This file itself
  /\.md$/, // Documentation files (may contain example patterns)
];

// Files that should never be included
const FORBIDDEN_FILES = [
  '.env',
  '.env.local', 
  '.env.production',
  'SUPABASE_SECURITY_GUIDE.md',
  'AI_REMEDIATION_SYSTEM.md',
  '*.key',
  '*.pem',
  '*.p12',
  '*.pfx',
  'config.json', // Raw config without placeholders
  'secrets.json',
  'credentials.json',
];

let scanResults = {
  scannedFiles: 0,
  sensitiveDataFound: [],
  forbiddenFilesFound: [],
  warnings: [],
  errors: []
};

/**
 * Main security scanning function
 */
function runSecurityScan() {
  try {
    console.log('📁 Scanning project directory for security issues...');
    
    // Check for forbidden files
    checkForbiddenFiles('.');
    
    // Scan all files for sensitive patterns
    scanDirectory('.');
    
    // Generate report
    generateSecurityReport();
    
    // Exit with appropriate code
    if (scanResults.errors.length > 0) {
      console.error('❌ Security scan failed with errors');
      process.exit(1);
    } else if (scanResults.warnings.length > 0) {
      console.warn('⚠️ Security scan completed with warnings');
      process.exit(0);
    } else {
      console.log('✅ Security scan completed successfully');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Security scan failed:', error.message);
    process.exit(1);
  }
}

/**
 * Check for forbidden files that should never be committed
 * @param {string} dir - Directory to scan
 */
function checkForbiddenFiles(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Skip ignored directories
      if (!IGNORE_PATTERNS.some(pattern => pattern.test(itemPath))) {
        checkForbiddenFiles(itemPath);
      }
    } else {
      // Check if file matches forbidden patterns
      FORBIDDEN_FILES.forEach(pattern => {
        if (pattern.includes('*')) {
          // Glob pattern matching
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          if (regex.test(item)) {
            scanResults.forbiddenFilesFound.push(itemPath);
          }
        } else {
          // Exact match
          if (item === pattern) {
            scanResults.forbiddenFilesFound.push(itemPath);
          }
        }
      });
    }
  });
}

/**
 * Recursively scan directory for sensitive data patterns
 * @param {string} dir - Directory to scan
 */
function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Skip ignored directories
      if (!IGNORE_PATTERNS.some(pattern => pattern.test(itemPath))) {
        scanDirectory(itemPath);
      }
    } else {
      // Scan file if not ignored
      if (!IGNORE_PATTERNS.some(pattern => pattern.test(itemPath))) {
        scanFile(itemPath);
      }
    }
  });
}

/**
 * Scan individual file for sensitive data patterns
 * @param {string} filePath - Path to file to scan
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    scanResults.scannedFiles++;
    
    SENSITIVE_PATTERNS.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          scanResults.sensitiveDataFound.push({
            file: filePath,
            pattern: pattern.toString(),
            match: match.substring(0, 20) + '...', // Truncate for security
            line: findLineNumber(content, match)
          });
        });
      }
    });
    
  } catch (error) {
    // Skip binary files and files that can't be read
    if (error.code !== 'EISDIR') {
      scanResults.warnings.push(`Could not scan file ${filePath}: ${error.message}`);
    }
  }
}

/**
 * Find line number of a match in file content
 * @param {string} content - File content
 * @param {string} match - Match to find
 * @returns {number} Line number
 */
function findLineNumber(content, match) {
  const lines = content.substring(0, content.indexOf(match)).split('\n');
  return lines.length;
}

/**
 * Generate and display security scan report
 */
function generateSecurityReport() {
  console.log('\n📊 Security Scan Report');
  console.log('========================');
  
  console.log(`Files scanned: ${scanResults.scannedFiles}`);
  
  if (scanResults.forbiddenFilesFound.length > 0) {
    console.error('\n❌ CRITICAL: Forbidden files found:');
    scanResults.forbiddenFilesFound.forEach(file => {
      console.error(`   - ${file}`);
      scanResults.errors.push(`Forbidden file found: ${file}`);
    });
  }
  
  if (scanResults.sensitiveDataFound.length > 0) {
    console.error('\n🚨 CRITICAL: Sensitive data patterns found:');
    scanResults.sensitiveDataFound.forEach(finding => {
      console.error(`   - ${finding.file}:${finding.line} - ${finding.match}`);
      scanResults.errors.push(`Sensitive data in ${finding.file}:${finding.line}`);
    });
  }
  
  if (scanResults.warnings.length > 0) {
    console.warn('\n⚠️ Warnings:');
    scanResults.warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
  }
  
  if (scanResults.errors.length === 0 && scanResults.forbiddenFilesFound.length === 0 && scanResults.sensitiveDataFound.length === 0) {
    console.log('\n✅ No security issues found!');
  }
  
  // Specific checks for this project
  console.log('\n🎓 Project-Specific Security Checks:');
  
  // Check that placeholder values are replaced in production config
  const configPath = path.join(__dirname, '..', 'dist', 'config', 'public-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    if (config.supabase.url.includes('placeholder')) {
      scanResults.warnings.push('Supabase URL still contains placeholder values');
    }
    
    if (config.supabase.anonKey.includes('placeholder')) {
      scanResults.warnings.push('Supabase anonymous key still contains placeholder values');
    }
    
    console.log(`   - Configuration file validated: ${configPath}`);
  } else {
    console.log('   - Production config not found (expected for development)');
  }
  
  // Check gitignore effectiveness
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    const requiredPatterns = ['SUPABASE_SECURITY_GUIDE.md', 'AI_REMEDIATION_SYSTEM.md', '.env'];
    
    requiredPatterns.forEach(pattern => {
      if (!gitignore.includes(pattern)) {
        scanResults.warnings.push(`Gitignore missing pattern: ${pattern}`);
      }
    });
    
    console.log('   - Gitignore security patterns validated');
  }
}

// Run the security scan
runSecurityScan();