-- Complete Armenius Voice Assistant Database Schema
-- Run this manually in Supabase SQL Editor if MCP has connectivity issues

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Products table with full-text search and vector embeddings
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  specifications JSONB,
  embedding vector(1536), -- For semantic search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add full text search column
ALTER TABLE products ADD COLUMN IF NOT EXISTS fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(category, ''))) STORED;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS products_fts_idx ON products USING GIN(fts);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_brand_idx ON products(brand);  
CREATE INDEX IF NOT EXISTS products_price_idx ON products(price);
CREATE INDEX IF NOT EXISTS products_stock_idx ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_embedding_idx ON products USING ivfflat (embedding vector_cosine_ops);

-- Conversations table for call tracking and analytics
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vapi_call_id VARCHAR(255) UNIQUE,
  phone_number VARCHAR(20),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  transcript JSONB,
  summary TEXT,
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  resolution_status VARCHAR(50) CHECK (resolution_status IN ('resolved', 'escalated', 'incomplete', 'error')),
  cost DECIMAL(10,4),
  metadata JSONB,
  customer_satisfaction INTEGER CHECK (customer_satisfaction BETWEEN 1 AND 5),
  language_detected VARCHAR(10) DEFAULT 'en',
  functions_called TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS conversations_vapi_call_id_idx ON conversations(vapi_call_id);
CREATE INDEX IF NOT EXISTS conversations_phone_number_idx ON conversations(phone_number);
CREATE INDEX IF NOT EXISTS conversations_started_at_idx ON conversations(started_at);
CREATE INDEX IF NOT EXISTS conversations_resolution_status_idx ON conversations(resolution_status);
CREATE INDEX IF NOT EXISTS conversations_sentiment_idx ON conversations(sentiment);
CREATE INDEX IF NOT EXISTS conversations_cost_idx ON conversations(cost);
CREATE INDEX IF NOT EXISTS conversations_language_idx ON conversations(language_detected);

-- Appointments table for service booking
CREATE TABLE IF NOT EXISTS appointments (
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

-- Create indexes for appointments
CREATE INDEX IF NOT EXISTS appointments_customer_phone_idx ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS appointments_appointment_time_idx ON appointments(appointment_time);
CREATE INDEX IF NOT EXISTS appointments_service_type_idx ON appointments(service_type);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);
CREATE INDEX IF NOT EXISTS appointments_created_via_idx ON appointments(created_via);
CREATE INDEX IF NOT EXISTS appointments_conversation_id_idx ON appointments(conversation_id);

-- Prevent double booking (same customer, overlapping time)
CREATE UNIQUE INDEX IF NOT EXISTS appointments_no_double_booking_idx 
ON appointments(customer_phone, appointment_time)
WHERE status IN ('confirmed', 'pending');

-- Analytics events table for tracking system performance
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  properties JSONB,
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  source VARCHAR(100) DEFAULT 'voice_ai'
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS analytics_events_timestamp_idx ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS analytics_events_conversation_id_idx ON analytics_events(conversation_id);
CREATE INDEX IF NOT EXISTS analytics_events_properties_idx ON analytics_events USING GIN(properties);
CREATE INDEX IF NOT EXISTS analytics_events_source_idx ON analytics_events(source);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers
CREATE TRIGGER IF NOT EXISTS update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_appointments_updated_at 
  BEFORE UPDATE ON appointments
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create useful views for analytics and reporting
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
  DATE(started_at) as date,
  COUNT(*) as total_calls,
  AVG(duration_seconds) as avg_duration,
  SUM(cost) as total_cost,
  COUNT(CASE WHEN resolution_status = 'resolved' THEN 1 END) as resolved_calls,
  COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive_calls,
  COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_calls,
  AVG(customer_satisfaction) as avg_satisfaction
FROM conversations
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- View for appointment availability
CREATE OR REPLACE VIEW appointment_slots AS
SELECT 
  generate_series(
    date_trunc('day', CURRENT_DATE),
    date_trunc('day', CURRENT_DATE + INTERVAL '30 days'),
    '30 minutes'::interval
  ) AS slot_time,
  CASE 
    WHEN EXTRACT(dow FROM generate_series) IN (0, 6) THEN false -- Weekend
    WHEN EXTRACT(hour FROM generate_series) < 9 OR EXTRACT(hour FROM generate_series) >= 19 THEN false -- Outside hours
    WHEN EXTRACT(dow FROM generate_series) = 6 AND EXTRACT(hour FROM generate_series) >= 14 THEN false -- Saturday after 2pm
    ELSE true 
  END AS available
FROM generate_series(
  date_trunc('day', CURRENT_DATE),
  date_trunc('day', CURRENT_DATE + INTERVAL '30 days'),
  '30 minutes'::interval
);

-- Function for full-text product search
CREATE OR REPLACE FUNCTION search_products_fts(
  search_query TEXT,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  sku VARCHAR(100),
  name VARCHAR(500),
  category VARCHAR(100),
  brand VARCHAR(100),
  price DECIMAL(10,2),
  stock_quantity INTEGER,
  specifications JSONB,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.sku, p.name, p.category, p.brand, p.price, p.stock_quantity, p.specifications,
    ts_rank(p.fts, plainto_tsquery('english', search_query)) as rank
  FROM products p
  WHERE 
    p.fts @@ plainto_tsquery('english', search_query)
    AND p.stock_quantity > 0
  ORDER BY rank DESC, p.stock_quantity DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;