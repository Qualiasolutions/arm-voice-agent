-- Analytics events table for tracking system performance
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  properties JSONB,
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  source VARCHAR(100) DEFAULT 'voice_ai'
);

-- Create indexes
CREATE INDEX analytics_events_event_type_idx ON analytics_events(event_type);
CREATE INDEX analytics_events_timestamp_idx ON analytics_events(timestamp);
CREATE INDEX analytics_events_conversation_id_idx ON analytics_events(conversation_id);
CREATE INDEX analytics_events_properties_idx ON analytics_events USING GIN(properties);
CREATE INDEX analytics_events_source_idx ON analytics_events(source);

-- Common event types: function_call, cache_hit, cache_miss, error, cost_alert, call_started, call_ended

-- Add RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;