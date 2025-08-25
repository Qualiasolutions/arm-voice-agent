-- Row Level Security Policies for Armenius Voice Assistant
-- Ensures data protection and proper access control

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Products table policies
-- Allow public read access to products (for inventory checking)
CREATE POLICY "Public read access for products" ON products
  FOR SELECT USING (true);

-- Allow service role to manage products
CREATE POLICY "Service role full access for products" ON products
  FOR ALL USING (auth.role() = 'service_role');

-- Conversations table policies  
-- Only allow service role access (contains sensitive call data)
CREATE POLICY "Service role only for conversations" ON conversations
  FOR ALL USING (auth.role() = 'service_role');

-- Appointments table policies
-- Allow customers to read their own appointments
CREATE POLICY "Customers can read own appointments" ON appointments
  FOR SELECT USING (
    auth.role() = 'service_role' OR 
    customer_phone = current_setting('app.current_user_phone', true)
  );

-- Service role can manage all appointments
CREATE POLICY "Service role full access for appointments" ON appointments
  FOR ALL USING (auth.role() = 'service_role');

-- Analytics events policies
-- Only service role access (contains sensitive analytics)
CREATE POLICY "Service role only for analytics" ON analytics_events
  FOR ALL USING (auth.role() = 'service_role');

-- Create additional security functions
CREATE OR REPLACE FUNCTION check_appointment_access(appointment_id UUID, user_phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user can access this appointment
  RETURN EXISTS (
    SELECT 1 FROM appointments 
    WHERE id = appointment_id 
    AND customer_phone = user_phone
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate phone numbers (Cyprus format)
CREATE OR REPLACE FUNCTION validate_cyprus_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Cyprus phone format: +357XXXXXXXX or 00357XXXXXXXX or local format
  RETURN phone ~ '^(\+357|00357|357)[0-9]{8}$' OR phone ~ '^[0-9]{8}$';
END;
$$ LANGUAGE plpgsql;

-- Function to sanitize and validate product search input
CREATE OR REPLACE FUNCTION sanitize_search_input(search_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove potentially harmful characters, keep alphanumeric, spaces, and common symbols
  RETURN regexp_replace(trim(search_text), '[^a-zA-Z0-9\s\-_αβγδεζηθικλμνξοπρστυφχψωάέήίόύώ]', '', 'g');
END;
$$ LANGUAGE plpgsql;

-- Audit trigger function for sensitive operations
CREATE OR REPLACE FUNCTION audit_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log sensitive operations to analytics
  INSERT INTO analytics_events (event_type, properties)
  VALUES (
    'audit_log',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'user_role', auth.role(),
      'timestamp', NOW(),
      'record_id', COALESCE(NEW.id, OLD.id)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_conversations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION audit_sensitive_operations();

CREATE TRIGGER audit_appointments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION audit_sensitive_operations();

-- Create function to clean old conversation data (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_conversations(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete conversations older than retention period
  DELETE FROM conversations 
  WHERE started_at < NOW() - INTERVAL '1 day' * retention_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  INSERT INTO analytics_events (event_type, properties)
  VALUES (
    'data_cleanup',
    jsonb_build_object(
      'deleted_conversations', deleted_count,
      'retention_days', retention_days,
      'cleanup_date', NOW()
    )
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for secure cost calculation
CREATE OR REPLACE FUNCTION calculate_call_cost(
  vapi_minutes DECIMAL,
  tts_characters INTEGER DEFAULT 0,
  stt_seconds INTEGER DEFAULT 0,
  llm_tokens INTEGER DEFAULT 0
)
RETURNS DECIMAL AS $$
DECLARE
  cost_breakdown JSONB;
  total_cost DECIMAL;
BEGIN
  -- Cost per unit (in EUR)
  cost_breakdown := jsonb_build_object(
    'tts', tts_characters * 0.000018,
    'stt', stt_seconds * 0.0004,
    'llm', llm_tokens * 0.000002,
    'vapi', vapi_minutes * 0.05
  );
  
  total_cost := (cost_breakdown->>'tts')::DECIMAL + 
                (cost_breakdown->>'stt')::DECIMAL + 
                (cost_breakdown->>'llm')::DECIMAL + 
                (cost_breakdown->>'vapi')::DECIMAL;
  
  RETURN ROUND(total_cost, 4);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_conversations_phone_rls ON conversations(customer_phone) 
WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_phone_rls ON appointments(customer_phone);

-- Create function to check business hours
CREATE OR REPLACE FUNCTION is_business_hours(check_time TIMESTAMPTZ DEFAULT NOW())
RETURNS BOOLEAN AS $$
DECLARE
  day_of_week INTEGER;
  hour_of_day INTEGER;
BEGIN
  -- Convert to Cyprus timezone
  check_time := check_time AT TIME ZONE 'Asia/Nicosia';
  
  day_of_week := EXTRACT(DOW FROM check_time); -- 0=Sunday, 6=Saturday
  hour_of_day := EXTRACT(HOUR FROM check_time);
  
  -- Monday to Friday: 9 AM to 7 PM
  IF day_of_week BETWEEN 1 AND 5 THEN
    RETURN hour_of_day BETWEEN 9 AND 18;
  END IF;
  
  -- Saturday: 9 AM to 2 PM
  IF day_of_week = 6 THEN
    RETURN hour_of_day BETWEEN 9 AND 13;
  END IF;
  
  -- Sunday: Closed
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get available appointment slots
CREATE OR REPLACE FUNCTION get_available_appointment_slots(
  start_date DATE DEFAULT CURRENT_DATE,
  days_ahead INTEGER DEFAULT 14,
  service_type TEXT DEFAULT NULL,
  duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  slot_time TIMESTAMPTZ,
  available BOOLEAN,
  service_type_filter TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH time_slots AS (
    SELECT generate_series(
      start_date::TIMESTAMPTZ,
      (start_date + days_ahead * INTERVAL '1 day')::TIMESTAMPTZ,
      INTERVAL '30 minutes'
    ) AS slot_time
  ),
  business_slots AS (
    SELECT 
      ts.slot_time,
      is_business_hours(ts.slot_time) as is_open
    FROM time_slots ts
  ),
  occupied_slots AS (
    SELECT 
      appointment_time,
      appointment_time + INTERVAL '1 minute' * duration_minutes as end_time
    FROM appointments
    WHERE 
      appointment_time >= start_date::TIMESTAMPTZ
      AND appointment_time <= (start_date + days_ahead * INTERVAL '1 day')::TIMESTAMPTZ
      AND status IN ('confirmed', 'pending')
  )
  SELECT 
    bs.slot_time,
    bs.is_open AND NOT EXISTS (
      SELECT 1 FROM occupied_slots os
      WHERE bs.slot_time >= os.appointment_time 
      AND bs.slot_time < os.end_time
    ) as available,
    service_type as service_type_filter
  FROM business_slots bs
  WHERE bs.is_open = TRUE
  ORDER BY bs.slot_time;
END;
$$ LANGUAGE plpgsql;