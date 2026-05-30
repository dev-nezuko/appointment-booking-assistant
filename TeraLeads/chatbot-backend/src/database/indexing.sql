-- Indexing Strategy for Performance Optimization

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Businesses table indexes
CREATE INDEX IF NOT EXISTS idx_businesses_domain ON businesses(domain) WHERE domain IS NOT NULL;

-- Appointments table indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time_status ON appointments(date, time) WHERE status IN ('pending', 'confirmed');

-- Chat sessions table indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_appointment_id ON chat_sessions(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_business_id ON chat_sessions(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_messages_gin ON chat_sessions USING GIN (messages);
