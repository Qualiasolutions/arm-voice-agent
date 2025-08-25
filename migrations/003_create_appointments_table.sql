-- Appointments table for service booking
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(200),
  customer_email VARCHAR(255),
  service_type VARCHAR(100) NOT NULL,
  appointment_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  created_via VARCHAR(50) DEFAULT 'voice_ai',
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  confirmation_sent BOOLEAN DEFAULT FALSE,
  conversation_id UUID REFERENCES conversations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX appointments_customer_phone_idx ON appointments(customer_phone);
CREATE INDEX appointments_appointment_time_idx ON appointments(appointment_time);
CREATE INDEX appointments_service_type_idx ON appointments(service_type);
CREATE INDEX appointments_status_idx ON appointments(status);
CREATE INDEX appointments_created_via_idx ON appointments(created_via);
CREATE INDEX appointments_conversation_id_idx ON appointments(conversation_id);

-- Prevent double booking (same customer, overlapping time)
CREATE UNIQUE INDEX appointments_no_double_booking_idx 
ON appointments(customer_phone, appointment_time)
WHERE status IN ('confirmed', 'pending');

-- Update timestamp trigger
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;