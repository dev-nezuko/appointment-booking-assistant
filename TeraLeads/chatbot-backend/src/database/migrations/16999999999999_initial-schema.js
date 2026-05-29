/* eslint-disable camelcase */
'use strict'

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password: { type: 'varchar(255)', notNull: true },
    name: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  })

  pgm.createTable('businesses', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    domain: { type: 'varchar(255)', unique: true },
    settings: { type: 'jsonb', default: '{}' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  })

  pgm.createTable('appointments', {
    id: 'id',
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'cascade' },
    business_id: { type: 'integer', references: 'businesses', onDelete: 'set null' },
    date: { type: 'date', notNull: true },
    time: { type: 'time', notNull: true },
    duration_minutes: { type: 'integer', default: 60 },
    service_type: { type: 'varchar(100)' },
    status: { type: 'varchar(50)', default: 'pending' },
    notes: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  })

  pgm.addConstraint('appointments', 'valid_status', {
    check: "status IN ('pending', 'confirmed', 'cancelled', 'completed')",
  })

  pgm.createTable('chat_sessions', {
    id: 'id',
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'cascade' },
    appointment_id: { type: 'integer', references: 'appointments', onDelete: 'set null' },
    business_id: { type: 'integer', references: 'businesses', onDelete: 'set null' },
    messages: { type: 'jsonb', default: '[]' },
    metadata: { type: 'jsonb', default: '{}' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  })

  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    `
  )

  pgm.createTrigger('users', 'update_users_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  })
  pgm.createTrigger('businesses', 'update_businesses_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  })
  pgm.createTrigger('appointments', 'update_appointments_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  })
  pgm.createTrigger('chat_sessions', 'update_chat_sessions_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  })

  pgm.createIndex('users', 'email')
  pgm.createIndex('users', 'created_at')
  pgm.createIndex('businesses', 'domain', { where: 'domain IS NOT NULL' })
  pgm.createIndex('appointments', 'user_id')
  pgm.createIndex('appointments', 'business_id', { where: 'business_id IS NOT NULL' })
  pgm.createIndex('appointments', 'date')
  pgm.createIndex('appointments', 'status')
  pgm.createIndex('appointments', ['user_id', 'date'])
  pgm.createIndex('appointments', ['date', 'time'], {
    where: "status IN ('pending', 'confirmed')",
  })
  pgm.createIndex('chat_sessions', 'user_id')
  pgm.createIndex('chat_sessions', 'appointment_id', { where: 'appointment_id IS NOT NULL' })
  pgm.createIndex('chat_sessions', 'business_id', { where: 'business_id IS NOT NULL' })
  pgm.createIndex('chat_sessions', 'created_at')
  pgm.createIndex('chat_sessions', 'messages', { method: 'gin' })
}

exports.down = (pgm) => {
  pgm.dropTable('chat_sessions')
  pgm.dropTable('appointments')
  pgm.dropTable('businesses')
  pgm.dropTable('users')
  pgm.dropFunction('update_updated_at_column', [])
}
