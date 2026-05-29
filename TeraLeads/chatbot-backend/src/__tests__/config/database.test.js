const { types } = require('pg')
require('../../config/database')

describe('database config', () => {
  it('keeps DATE columns as plain YYYY-MM-DD strings', () => {
    expect(types.getTypeParser(1082)('2030-01-10')).toBe('2030-01-10')
  })
})
