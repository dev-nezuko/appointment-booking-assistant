const { test } = require('node:test')
const assert = require('node:assert/strict')
const { getJwtSecret } = require('../src/utils/jwtSecret')
test('production rejects missing, short, and documented fallback secrets', () => {
  for (const secret of [undefined, 'short', 'your-secret-key-change-in-production']) {
    assert.throws(() => getJwtSecret({NODE_ENV: 'production', JWT_SECRET: secret}), /Production requires/)
  }
})
test('production accepts a separately supplied long value', () => {
  const value = 'synthetic-unit-test-value-only-123456789'
  assert.equal(getJwtSecret({NODE_ENV: 'production', JWT_SECRET: value}), value)
})
test('development remains usable without a configured secret', () => {
  assert.ok(getJwtSecret({NODE_ENV: 'development'}))
})
