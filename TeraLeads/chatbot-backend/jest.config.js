/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js', '!src/**/__tests__/**'],
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 45,
      statements: 45,
    },
  },
  setupFilesAfterEnv: [],
  testTimeout: 10000,
}
