-- Products table with full-text search and vector embeddings
CREATE TABLE products (
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

-- Create full text search
ALTER TABLE products ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(category, ''))) STORED;

-- Create indexes for performance
CREATE INDEX products_fts_idx ON products USING GIN(fts);
CREATE INDEX products_category_idx ON products(category);
CREATE INDEX products_brand_idx ON products(brand);
CREATE INDEX products_price_idx ON products(price);
CREATE INDEX products_stock_idx ON products(stock_quantity);
CREATE INDEX products_embedding_idx ON products USING ivfflat (embedding vector_cosine_ops);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();