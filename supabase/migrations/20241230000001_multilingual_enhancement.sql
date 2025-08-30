-- Multilingual Enhancement Migration
-- Adds support for Greek language, voice quality monitoring, and semantic search

BEGIN;

-- Enhanced customer profiles with multilingual support
ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS language_preference VARCHAR(5) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS voice_quality_rating INTEGER CHECK (voice_quality_rating >= 1 AND voice_quality_rating <= 5),
ADD COLUMN IF NOT EXISTS cultural_context VARCHAR(50) DEFAULT 'International',
ADD COLUMN IF NOT EXISTS technical_expertise_level VARCHAR(20) DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS preferred_voice_speed DECIMAL(3,1) DEFAULT 1.0 CHECK (preferred_voice_speed >= 0.5 AND preferred_voice_speed <= 2.0),
ADD COLUMN IF NOT EXISTS preferred_voice_gender VARCHAR(10) DEFAULT 'male' CHECK (preferred_voice_gender IN ('male', 'female', 'neutral'));

-- Language interaction tracking
CREATE TABLE IF NOT EXISTS language_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  conversation_id VARCHAR(255) NOT NULL,
  detected_language VARCHAR(5) NOT NULL,
  language_confidence DECIMAL(3,2) CHECK (language_confidence >= 0 AND language_confidence <= 1),
  voice_provider VARCHAR(50) NOT NULL,
  voice_id VARCHAR(100) NOT NULL,
  response_time_ms INTEGER CHECK (response_time_ms >= 0),
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for language interactions
CREATE INDEX IF NOT EXISTS idx_language_interactions_customer ON language_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_language_interactions_conversation ON language_interactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_language_interactions_language ON language_interactions(detected_language);
CREATE INDEX IF NOT EXISTS idx_language_interactions_created ON language_interactions(created_at);

-- Voice quality metrics
CREATE TABLE IF NOT EXISTS voice_quality_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id VARCHAR(255) NOT NULL,
  language VARCHAR(5) NOT NULL,
  clarity_score DECIMAL(3,2) CHECK (clarity_score >= 0 AND clarity_score <= 1),
  consistency_score DECIMAL(3,2) CHECK (consistency_score >= 0 AND consistency_score <= 1),
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  technical_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for voice quality metrics
CREATE INDEX IF NOT EXISTS idx_voice_quality_call ON voice_quality_metrics(call_id);
CREATE INDEX IF NOT EXISTS idx_voice_quality_language ON voice_quality_metrics(language);
CREATE INDEX IF NOT EXISTS idx_voice_quality_created ON voice_quality_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_quality_consistency ON voice_quality_metrics(consistency_score);

-- Multilingual product support
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description_el TEXT,
ADD COLUMN IF NOT EXISTS keywords_el TEXT[],
ADD COLUMN IF NOT EXISTS technical_specs_el JSONB;

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Product search embeddings for semantic search
CREATE TABLE IF NOT EXISTS product_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  embedding_vector vector(1536), -- OpenAI embedding dimensions
  text_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vector similarity index using ivfflat
CREATE INDEX IF NOT EXISTS product_embeddings_vector_idx ON product_embeddings 
USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);

-- Create other indexes for product embeddings
CREATE INDEX IF NOT EXISTS idx_product_embeddings_product ON product_embeddings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_language ON product_embeddings(language);

-- Function to search products by similarity
CREATE OR REPLACE FUNCTION search_products_by_similarity(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.75,
  match_count int DEFAULT 10,
  target_language varchar DEFAULT 'en'
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  brand text,
  model text,
  price decimal,
  stock integer,
  category text,
  similarity float
) 
LANGUAGE sql STABLE
AS $$
  SELECT 
    p.id,
    p.name,
    CASE 
      WHEN target_language = 'el' AND p.description_el IS NOT NULL 
      THEN p.description_el 
      ELSE p.description 
    END as description,
    p.brand,
    p.model,
    p.price,
    p.stock,
    p.category,
    1 - (pe.embedding_vector <=> query_embedding) as similarity
  FROM product_embeddings pe
  JOIN products p ON pe.product_id = p.id
  WHERE 
    pe.language = target_language
    AND 1 - (pe.embedding_vector <=> query_embedding) > similarity_threshold
  ORDER BY pe.embedding_vector <=> query_embedding
  LIMIT match_count;
$$;

-- Function to update product embeddings timestamp
CREATE OR REPLACE FUNCTION update_product_embeddings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update timestamps
CREATE TRIGGER update_product_embeddings_timestamp
  BEFORE UPDATE ON product_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_product_embeddings_timestamp();

-- Enhanced conversation tracking with language context
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS detected_language VARCHAR(5),
ADD COLUMN IF NOT EXISTS language_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS voice_switches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2);

-- Update existing conversations to have default language
UPDATE conversations 
SET detected_language = 'en', language_confidence = 0.5 
WHERE detected_language IS NULL;

-- Voice quality analytics view
CREATE OR REPLACE VIEW voice_quality_analytics AS
SELECT 
  language,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_calls,
  AVG(clarity_score) as avg_clarity,
  AVG(consistency_score) as avg_consistency,
  AVG(customer_rating) as avg_rating,
  COUNT(CASE WHEN consistency_score < 0.8 THEN 1 END) as poor_consistency_calls,
  COUNT(CASE WHEN technical_metrics->>'voice_switched' = 'true' THEN 1 END) as voice_switched_calls
FROM voice_quality_metrics
GROUP BY language, DATE_TRUNC('day', created_at)
ORDER BY date DESC, language;

-- Language usage analytics view
CREATE OR REPLACE VIEW language_usage_analytics AS
SELECT 
  detected_language,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_interactions,
  AVG(language_confidence) as avg_confidence,
  AVG(quality_score) as avg_quality,
  AVG(response_time_ms) as avg_response_time,
  COUNT(DISTINCT customer_id) as unique_customers
FROM language_interactions
GROUP BY detected_language, DATE_TRUNC('day', created_at)
ORDER BY date DESC, detected_language;

-- Seed some Greek product descriptions for testing
UPDATE products 
SET 
  description_el = CASE 
    WHEN category = 'Graphics Cards' THEN 'Κάρτα γραφικών υψηλής απόδοσης για gaming και επαγγελματική χρήση'
    WHEN category = 'Processors' THEN 'Επεξεργαστής υψηλής ταχύτητας για gaming και εργασία'
    WHEN category = 'Memory' THEN 'Μνήμη RAM για βελτίωση της απόδοσης του υπολογιστή'
    WHEN category = 'Storage' THEN 'Αποθηκευτικός χώρος για αρχεία και προγράμματα'
    ELSE description
  END,
  keywords_el = CASE 
    WHEN category = 'Graphics Cards' THEN ARRAY['κάρτα γραφικών', 'gaming', 'RTX', 'GeForce']
    WHEN category = 'Processors' THEN ARRAY['επεξεργαστής', 'CPU', 'AMD', 'Intel']
    WHEN category = 'Memory' THEN ARRAY['μνήμη', 'RAM', 'DDR4', 'DDR5']
    WHEN category = 'Storage' THEN ARRAY['δίσκος', 'SSD', 'αποθήκευση']
    ELSE ARRAY[name]
  END
WHERE description_el IS NULL AND category IN ('Graphics Cards', 'Processors', 'Memory', 'Storage');

-- Row Level Security (RLS) policies for new tables

-- Language interactions RLS
ALTER TABLE language_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own language interactions" ON language_interactions
  FOR SELECT USING (true); -- Allow read access for analytics

CREATE POLICY "System can insert language interactions" ON language_interactions
  FOR INSERT WITH CHECK (true); -- Allow system inserts

-- Voice quality metrics RLS
ALTER TABLE voice_quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view voice quality metrics" ON voice_quality_metrics
  FOR SELECT USING (true); -- Allow read access for analytics

CREATE POLICY "System can insert voice quality metrics" ON voice_quality_metrics
  FOR INSERT WITH CHECK (true); -- Allow system inserts

-- Product embeddings RLS
ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product embeddings" ON product_embeddings
  FOR SELECT USING (true); -- Allow read access for search

CREATE POLICY "System can manage product embeddings" ON product_embeddings
  FOR ALL USING (true); -- Allow full access for system operations

-- Create helpful comments
COMMENT ON TABLE language_interactions IS 'Tracks language detection and voice quality for each customer interaction';
COMMENT ON TABLE voice_quality_metrics IS 'Stores detailed voice quality metrics for monitoring and improvement';
COMMENT ON TABLE product_embeddings IS 'Contains vector embeddings for semantic product search capabilities';
COMMENT ON FUNCTION search_products_by_similarity IS 'Performs semantic similarity search using vector embeddings';
COMMENT ON VIEW voice_quality_analytics IS 'Aggregated voice quality metrics for dashboard and monitoring';
COMMENT ON VIEW language_usage_analytics IS 'Language usage statistics and performance metrics';

COMMIT;