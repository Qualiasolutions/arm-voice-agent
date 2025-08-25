-- Conversations table for call tracking and analytics
CREATE TABLE conversations (
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

-- Create indexes
CREATE INDEX conversations_vapi_call_id_idx ON conversations(vapi_call_id);
CREATE INDEX conversations_phone_number_idx ON conversations(phone_number);
CREATE INDEX conversations_started_at_idx ON conversations(started_at);
CREATE INDEX conversations_resolution_status_idx ON conversations(resolution_status);
CREATE INDEX conversations_sentiment_idx ON conversations(sentiment);
CREATE INDEX conversations_cost_idx ON conversations(cost);
CREATE INDEX conversations_language_idx ON conversations(language_detected);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;