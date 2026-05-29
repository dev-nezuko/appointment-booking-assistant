-- Sample Data Insertions for Development/Testing

-- Insert sample users
INSERT INTO users (email, password, name) VALUES
    ('john.doe@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqO', 'John Doe'),
    ('jane.smith@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqO', 'Jane Smith'),
    ('admin@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqO', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Insert sample business (multi-tenancy)
INSERT INTO businesses (name, domain) VALUES ('Demo Business', 'demo.example.com')
ON CONFLICT (domain) DO NOTHING;

-- Insert sample appointments (use SELECT to avoid hardcoded IDs)
INSERT INTO appointments (user_id, business_id, date, time, duration_minutes, service_type, status)
SELECT u.id, b.id, '2025-02-15', '10:00:00', 60, 'Consultation', 'confirmed'
FROM users u
CROSS JOIN businesses b
WHERE u.email = 'john.doe@example.com' AND b.domain = 'demo.example.com'
LIMIT 1;

INSERT INTO appointments (user_id, business_id, date, time, duration_minutes, service_type, status)
SELECT u.id, b.id, '2025-02-20', '14:30:00', 30, 'Follow-up', 'pending'
FROM users u
CROSS JOIN businesses b
WHERE u.email = 'john.doe@example.com' AND b.domain = 'demo.example.com'
LIMIT 1;

INSERT INTO appointments (user_id, business_id, date, time, duration_minutes, service_type, status)
SELECT u.id, b.id, '2025-02-18', '09:00:00', 60, 'Initial Consultation', 'confirmed'
FROM users u
CROSS JOIN businesses b
WHERE u.email = 'jane.smith@example.com' AND b.domain = 'demo.example.com'
LIMIT 1;

-- Insert sample chat sessions with appointment link
INSERT INTO chat_sessions (user_id, appointment_id, messages, metadata)
SELECT a.user_id, a.id, '[{"user_message":"Hello","bot_response":"Hi! How can I help you?","timestamp":"2025-02-10T10:00:00Z"}]'::jsonb, '{"session_type":"appointment_booking"}'::jsonb
FROM appointments a
JOIN users u ON a.user_id = u.id
WHERE u.email = 'john.doe@example.com'
ORDER BY a.id DESC
LIMIT 1;

INSERT INTO chat_sessions (user_id, messages, metadata)
SELECT u.id, '[{"user_message":"I need to book an appointment","bot_response":"Sure! What date works for you?","timestamp":"2025-02-11T11:00:00Z"}]'::jsonb, '{"session_type":"appointment_booking"}'::jsonb
FROM users u
WHERE u.email = 'jane.smith@example.com'
LIMIT 1;
