/**
 * web-ext configuration for Firefox add-on development and signing
 * https://extensionworkshop.com/documentation/develop/web-ext-command-reference/
 */

export default {
  // Source directory for the extension
  sourceDir: './build-firefox/',
  
  // Artifacts directory for built/signed extensions
  artifactsDir: './dist/',
  
  // Ignore files when building
  ignoreFiles: [
    'web-ext-config.mjs',
    'package.json',
    'package-lock.json',
    'node_modules',
    '.git',
    '.DS_Store',
    '*.log'
  ],
  
  // Build configuration
  build: {
    overwriteDest: true
  },
  
  // Run configuration (for testing)
  run: {
    firefox: 'firefoxdeveloperedition', // Use Firefox Developer Edition
    startUrl: ['about:debugging#/runtime/this-firefox'],
    browserConsole: true
    // Note: xpinstall.signatures.required cannot be set here (Firefox restriction)
    // Firefox Developer Edition allows unsigned extensions by default
  },
  
  // Sign configuration
  // You'll need to set these as environment variables:
  // WEB_EXT_API_KEY=your-api-key
  // WEB_EXT_API_SECRET=your-api-secret
  sign: {
    // Get API credentials from: https://addons.mozilla.org/developers/addon/api/key/
    // apiKey: process.env.WEB_EXT_API_KEY,
    // apiSecret: process.env.WEB_EXT_API_SECRET,
    
    // Distribution channel: 'listed' (AMO) or 'unlisted' (self-distribution)
    channel: 'unlisted'
  },
  
  // Lint configuration
  lint: {
    selfHosted: true, // Set to true if self-distributing
    warningsAsErrors: false
  }
};

