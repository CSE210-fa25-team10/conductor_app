// frontend/jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  
  // Look for Jest unit tests in src/tests/unit
  testMatch: [
    '**/src/tests/unit/**/*.test.js'
  ],
  
  // Explicitly ignore Playwright E2E tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/tests/e2e/',     // Ignore E2E tests
    '\\.spec\\.js$'        // Ignore .spec.js files (Playwright convention)
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Coverage configuration (optional but useful)
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',       // Don't include test files in coverage
    '!**/node_modules/**',
    '!**/vendor/**'
  ],

  // Transform configuration (if you need to transpile modules)
  transform: {},

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Verbose output
  verbose: true
};