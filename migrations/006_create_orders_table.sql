-- Orders/Clients table with comprehensive order tracking
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  products JSONB NOT NULL, -- Array of products with quantities and prices
  shipping_method VARCHAR(100) NOT NULL,
  payment_method VARCHAR(100) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  ship_to_city VARCHAR(100) NOT NULL,
  ship_to_address TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
  tracking_number VARCHAR(100),
  order_notes TEXT,
  last_message TEXT,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  shipped_date TIMESTAMPTZ,
  delivered_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS orders_reference_number_idx ON orders(reference_number);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders(customer_email);
CREATE INDEX IF NOT EXISTS orders_phone_number_idx ON orders(phone_number);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_order_date_idx ON orders(order_date);
CREATE INDEX IF NOT EXISTS orders_ship_to_city_idx ON orders(ship_to_city);
CREATE INDEX IF NOT EXISTS orders_tracking_number_idx ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS orders_products_idx ON orders USING GIN(products);

-- Create trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert 10 sample client records with Cypriot names
INSERT INTO orders (
  reference_number, customer_name, customer_email, phone_number, 
  products, shipping_method, payment_method, subtotal, shipping_cost, total,
  ship_to_city, ship_to_address, status, tracking_number, order_notes, last_message, order_date
) VALUES 
(
  'ORD-2024-001',
  'Maria Constantinou',
  'maria.constantinou@email.com',
  '+357-99-123456',
  '[{"name": "Wireless Headphones", "sku": "WH-001", "quantity": 1, "price": 99.99}, {"name": "Phone Case", "sku": "PC-001", "quantity": 2, "price": 24.99}]',
  'Standard Shipping',
  'Credit Card',
  149.97,
  12.99,
  162.96,
  'Nicosia',
  '123 Makarios Avenue, Apt 4B, Nicosia, Cyprus 1065',
  'delivered',
  'TRK123456789',
  'Customer requested expedited processing',
  'Package delivered successfully. Customer very satisfied with products.',
  '2024-01-15 10:30:00'
),
(
  'ORD-2024-002',
  'Andreas Georgiou',
  'andreas.georgiou@techcorp.com',
  '+357-99-234567',
  '[{"name": "Laptop Stand", "sku": "LS-001", "quantity": 1, "price": 79.99}, {"name": "Wireless Mouse", "sku": "WM-001", "quantity": 1, "price": 45.99}]',
  'Express Shipping',
  'PayPal',
  125.98,
  19.99,
  145.97,
  'Limassol',
  '456 Anexartisias Street, Suite 200, Limassol, Cyprus 3036',
  'shipped',
  'TRK234567890',
  'Corporate order - invoice required',
  'Shipment dispatched. Expected delivery in 2-3 business days.',
  '2024-01-18 14:22:00'
),
(
  'ORD-2024-003',
  'Elena Papadopoulos',
  'elena.papadopoulos@gmail.com',
  '+357-99-345678',
  '[{"name": "Smart Watch", "sku": "SW-001", "quantity": 1, "price": 299.99}]',
  'Overnight Shipping',
  'Apple Pay',
  299.99,
  29.99,
  329.98,
  'Larnaca',
  '789 Zenon Kitieos Street, Larnaca, Cyprus 6023',
  'processing',
  NULL,
  'Birthday gift - please include gift wrapping',
  'Order confirmed. Processing for overnight delivery.',
  '2024-01-20 09:15:00'
),
(
  'ORD-2024-004',
  'Dimitris Charalambous',
  'dimitris.charalambous@outlook.com',
  '+357-99-456789',
  '[{"name": "Gaming Keyboard", "sku": "GK-001", "quantity": 1, "price": 159.99}, {"name": "Gaming Mouse", "sku": "GM-001", "quantity": 1, "price": 89.99}, {"name": "Mouse Pad", "sku": "MP-001", "quantity": 1, "price": 29.99}]',
  'Standard Shipping',
  'Debit Card',
  279.97,
  15.99,
  295.96,
  'Paphos',
  '321 Apostolou Pavlou Avenue, Paphos, Cyprus 8046',
  'pending',
  NULL,
  'First time customer - gaming setup',
  'Order received. Payment processing.',
  '2024-01-22 16:45:00'
),
(
  'ORD-2024-005',
  'Sophia Christodoulou',
  'sophia.christodoulou@university.ac.cy',
  '+357-99-567890',
  '[{"name": "Study Lamp", "sku": "SL-001", "quantity": 1, "price": 49.99}, {"name": "Notebook Set", "sku": "NS-001", "quantity": 3, "price": 19.99}]',
  'Economy Shipping',
  'Student Discount Card',
  109.96,
  8.99,
  118.95,
  'Nicosia',
  '654 University Avenue, Student Dorm 205, Nicosia, Cyprus 1678',
  'delivered',
  'TRK345678901',
  'Student discount applied - 10% off',
  'Delivered to university mailroom. Student notified.',
  '2024-01-12 11:20:00'
),
(
  'ORD-2024-006',
  'Panagiotis Ioannou',
  'panagiotis.ioannou@company.com',
  '+357-99-678901',
  '[{"name": "Office Chair", "sku": "OC-001", "quantity": 1, "price": 249.99}, {"name": "Desk Organizer", "sku": "DO-001", "quantity": 2, "price": 34.99}]',
  'White Glove Delivery',
  'Company Credit',
  319.97,
  49.99,
  369.96,
  'Limassol',
  '987 Business Center, Floor 15, Limassol, Cyprus 4003',
  'shipped',
  'TRK456789012',
  'Assembly required - customer has tools',
  'White glove delivery scheduled for tomorrow 10-12 PM.',
  '2024-01-19 13:30:00'
),
(
  'ORD-2024-007',
  'Christina Stavrou',
  'christina.stavrou@homemail.com',
  '+357-99-789012',
  '[{"name": "Kitchen Scale", "sku": "KS-001", "quantity": 1, "price": 39.99}, {"name": "Measuring Cups", "sku": "MC-001", "quantity": 1, "price": 24.99}, {"name": "Recipe Book", "sku": "RB-001", "quantity": 1, "price": 29.99}]',
  'Standard Shipping',
  'Gift Card',
  94.97,
  11.99,
  106.96,
  'Famagusta',
  '147 Ammochostos Street, Apt 3A, Famagusta, Cyprus 5296',
  'cancelled',
  NULL,
  'Customer changed mind about kitchen renovation',
  'Order cancelled per customer request. Full refund processed.',
  '2024-01-16 08:45:00'
),
(
  'ORD-2024-008',
  'Christos Michaelidis',
  'christos.michaelidis@fitness.com',
  '+357-99-890123',
  '[{"name": "Fitness Tracker", "sku": "FT-001", "quantity": 1, "price": 199.99}, {"name": "Workout Mat", "sku": "WM-002", "quantity": 1, "price": 59.99}, {"name": "Water Bottle", "sku": "WB-001", "quantity": 2, "price": 19.99}]',
  'Express Shipping',
  'Credit Card',
  299.96,
  18.99,
  318.95,
  'Kyrenia',
  '258 Girne Marina Street, Kyrenia, Cyprus 9900',
  'delivered',
  'TRK567890123',
  'Fitness enthusiast - regular customer',
  'Delivered successfully. Customer left 5-star review.',
  '2024-01-14 15:10:00'
),
(
  'ORD-2024-009',
  'Antonia Nicolaou',
  'antonia.nicolaou@artschool.ac.cy',
  '+357-99-901234',
  '[{"name": "Art Supplies Set", "sku": "AS-001", "quantity": 1, "price": 129.99}, {"name": "Sketchbook", "sku": "SB-001", "quantity": 3, "price": 15.99}, {"name": "Drawing Pencils", "sku": "DP-001", "quantity": 2, "price": 24.99}]',
  'Standard Shipping',
  'Student Payment Plan',
  202.95,
  13.99,
  216.94,
  'Paphos',
  '369 Art District Lane, Studio 12, Paphos, Cyprus 8021',
  'processing',
  NULL,
  'Art student - payment plan approved',
  'Payment plan activated. First installment received.',
  '2024-01-21 12:00:00'
),
(
  'ORD-2024-010',
  'Nicos Andreou',
  'nicos.andreou@techstart.com',
  '+357-99-012345',
  '[{"name": "Monitor Stand", "sku": "MS-001", "quantity": 2, "price": 89.99}, {"name": "USB Hub", "sku": "UH-001", "quantity": 1, "price": 49.99}, {"name": "Cable Management", "sku": "CM-001", "quantity": 1, "price": 19.99}]',
  'Same Day Delivery',
  'Business Account',
  249.96,
  39.99,
  289.95,
  'Nicosia',
  '741 Tech Park Boulevard, Innovation Hub, Nicosia, Cyprus 2121',
  'shipped',
  'TRK678901234',
  'Startup office setup - urgent delivery needed',
  'Same day delivery confirmed. Driver en route.',
  '2024-01-23 07:30:00'
);

-- Create a view for order summary statistics
CREATE OR REPLACE VIEW order_statistics AS
SELECT 
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as average_order_value,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
  COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
  COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
  COUNT(DISTINCT ship_to_city) as cities_served,
  DATE_TRUNC('month', order_date) as month
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month DESC;

-- Create a view for customer order history
CREATE OR REPLACE VIEW customer_order_summary AS
SELECT 
  customer_email,
  customer_name,
  phone_number,
  COUNT(*) as total_orders,
  SUM(total) as total_spent,
  AVG(total) as average_order_value,
  MAX(order_date) as last_order_date,
  ARRAY_AGG(reference_number ORDER BY order_date DESC) as order_references
FROM orders
GROUP BY customer_email, customer_name, phone_number
ORDER BY total_spent DESC;
