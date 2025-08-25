-- Sample product data for Armenius Store Cyprus
-- Complete computer hardware inventory for testing

-- Sample product data removed for production deployment
-- Products should be populated via:
-- 1. MCP Firecrawl integration to scrape armenius.com.cy
-- 2. Manual database management
-- 3. Product sync API endpoint /api/cron/product-sync

-- COMMENTED OUT SAMPLE DATA (for reference only):
-- INSERT INTO products (sku, name, category, brand, price, stock_quantity, specifications) VALUES
-- Graphics Cards
-- ('RTX4090-MSI-24GB', 'NVIDIA GeForce RTX 4090 MSI Gaming X Trio 24GB', 'Graphics Cards', 'MSI', 1699.99, 5, '{"memory": "24GB GDDR6X", "boost_clock": "2610 MHz", "interface": "PCIe 4.0", "power": "450W", "ports": "3x DisplayPort 1.4a, 1x HDMI 2.1"}'),
-- ('RTX4080-ASUS-16GB', 'NVIDIA GeForce RTX 4080 ASUS ROG Strix 16GB', 'Graphics Cards', 'ASUS', 1299.99, 8, '{"memory": "16GB GDDR6X", "boost_clock": "2550 MHz", "interface": "PCIe 4.0", "power": "320W", "ports": "3x DisplayPort 1.4a, 2x HDMI 2.1"}'),
-- ('RTX4070-EVGA-12GB', 'NVIDIA GeForce RTX 4070 EVGA FTW3 12GB', 'Graphics Cards', 'EVGA', 899.99, 12, '{"memory": "12GB GDDR6X", "boost_clock": "2520 MHz", "interface": "PCIe 4.0", "power": "200W", "ports": "3x DisplayPort 1.4a, 1x HDMI 2.1"}'),
-- ('RTX4060TI-GIGABYTE-16GB', 'NVIDIA GeForce RTX 4060 Ti Gigabyte Gaming OC 16GB', 'Graphics Cards', 'Gigabyte', 599.99, 15, '{"memory": "16GB GDDR6", "boost_clock": "2540 MHz", "interface": "PCIe 4.0", "power": "165W"}'),
-- ('RTX4060-PALIT-8GB', 'NVIDIA GeForce RTX 4060 Palit Dual 8GB', 'Graphics Cards', 'Palit', 399.99, 20, '{"memory": "8GB GDDR6", "boost_clock": "2460 MHz", "interface": "PCIe 4.0", "power": "115W"}'),
-- ('AMD-7900XTX-20GB', 'AMD Radeon RX 7900 XTX 20GB', 'Graphics Cards', 'AMD', 1199.99, 6, '{"memory": "20GB GDDR6", "boost_clock": "2500 MHz", "interface": "PCIe 4.0", "power": "355W", "ports": "2x DisplayPort 2.1, 2x HDMI 2.1"}'),
-- ('AMD-7900XT-20GB', 'AMD Radeon RX 7900 XT 20GB', 'Graphics Cards', 'AMD', 999.99, 8, '{"memory": "20GB GDDR6", "boost_clock": "2400 MHz", "interface": "PCIe 4.0", "power": "315W"}'),

-- Processors (Intel)
-- ('INTEL-13900K', 'Intel Core i9-13900K', 'Processors', 'Intel', 589.99, 15, '{"cores": 24, "threads": 32, "base_clock": "3.0 GHz", "boost_clock": "5.8 GHz", "socket": "LGA1700", "tdp": "125W"}'),
-- ('INTEL-13700K', 'Intel Core i7-13700K', 'Processors', 'Intel', 449.99, 20, '{"cores": 16, "threads": 24, "base_clock": "3.4 GHz", "boost_clock": "5.4 GHz", "socket": "LGA1700", "tdp": "125W"}'),
-- ('INTEL-13600K', 'Intel Core i5-13600K', 'Processors', 'Intel', 329.99, 25, '{"cores": 14, "threads": 20, "base_clock": "3.5 GHz", "boost_clock": "5.1 GHz", "socket": "LGA1700", "tdp": "125W"}'),
-- ('INTEL-12900K', 'Intel Core i9-12900K', 'Processors', 'Intel', 489.99, 10, '{"cores": 16, "threads": 24, "base_clock": "3.2 GHz", "boost_clock": "5.2 GHz", "socket": "LGA1700", "tdp": "125W"}'),

-- Processors (AMD)
-- ('AMD-7950X', 'AMD Ryzen 9 7950X', 'Processors', 'AMD', 699.99, 10, '{"cores": 16, "threads": 32, "base_clock": "4.5 GHz", "boost_clock": "5.7 GHz", "socket": "AM5", "tdp": "170W"}'),
-- ('AMD-7900X', 'AMD Ryzen 9 7900X', 'Processors', 'AMD', 549.99, 12, '{"cores": 12, "threads": 24, "base_clock": "4.7 GHz", "boost_clock": "5.6 GHz", "socket": "AM5", "tdp": "170W"}'),
-- ('AMD-7700X', 'AMD Ryzen 7 7700X', 'Processors', 'AMD', 399.99, 18, '{"cores": 8, "threads": 16, "base_clock": "4.5 GHz", "boost_clock": "5.4 GHz", "socket": "AM5", "tdp": "105W"}'),
-- ('AMD-7600X', 'AMD Ryzen 5 7600X', 'Processors', 'AMD', 299.99, 25, '{"cores": 6, "threads": 12, "base_clock": "4.7 GHz", "boost_clock": "5.3 GHz", "socket": "AM5", "tdp": "105W"}'),
-- ('AMD-5950X', 'AMD Ryzen 9 5950X', 'Processors', 'AMD', 549.99, 8, '{"cores": 16, "threads": 32, "base_clock": "3.4 GHz", "boost_clock": "4.9 GHz", "socket": "AM4", "tdp": "105W"}'),

-- Memory (DDR5)
-- ('DDR5-6000-32GB-GSKILL', 'G.Skill Trident Z5 DDR5-6000 32GB Kit (2x16GB)', 'Memory', 'G.Skill', 299.99, 20, '{"capacity": "32GB", "speed": "6000 MHz", "latency": "CL36", "voltage": "1.35V", "kit": "2x16GB"}'),
-- ('DDR5-5600-32GB-CORSAIR', 'Corsair Vengeance DDR5-5600 32GB Kit (2x16GB)', 'Memory', 'Corsair', 249.99, 25, '{"capacity": "32GB", "speed": "5600 MHz", "latency": "CL36", "voltage": "1.25V", "kit": "2x16GB"}'),
-- ('DDR5-6400-64GB-GSKILL', 'G.Skill Trident Z5 DDR5-6400 64GB Kit (2x32GB)', 'Memory', 'G.Skill', 599.99, 8, '{"capacity": "64GB", "speed": "6400 MHz", "latency": "CL32", "voltage": "1.40V", "kit": "2x32GB"}'),
-- ('DDR5-5200-16GB-CRUCIAL', 'Crucial DDR5-5200 16GB Kit (2x8GB)', 'Memory', 'Crucial', 129.99, 30, '{"capacity": "16GB", "speed": "5200 MHz", "latency": "CL42", "voltage": "1.1V", "kit": "2x8GB"}'),

-- Memory (DDR4)
-- ('DDR4-3600-32GB-CORSAIR', 'Corsair Vengeance LPX DDR4-3600 32GB Kit (2x16GB)', 'Memory', 'Corsair', 179.99, 35, '{"capacity": "32GB", "speed": "3600 MHz", "latency": "CL18", "voltage": "1.35V", "kit": "2x16GB"}'),
-- ('DDR4-3200-16GB-KINGSTON', 'Kingston Fury Beast DDR4-3200 16GB Kit (2x8GB)', 'Memory', 'Kingston', 89.99, 40, '{"capacity": "16GB", "speed": "3200 MHz", "latency": "CL16", "voltage": "1.35V", "kit": "2x8GB"}'),

-- Storage (NVMe SSD)
-- ('SSD-980PRO-2TB', 'Samsung 980 PRO NVMe SSD 2TB', 'Storage', 'Samsung', 199.99, 25, '{"capacity": "2TB", "interface": "NVMe PCIe 4.0", "read_speed": "7000 MB/s", "write_speed": "5100 MB/s", "form_factor": "M.2 2280"}'),
-- ('SSD-980PRO-1TB', 'Samsung 980 PRO NVMe SSD 1TB', 'Storage', 'Samsung', 129.99, 40, '{"capacity": "1TB", "interface": "NVMe PCIe 4.0", "read_speed": "7000 MB/s", "write_speed": "5000 MB/s", "form_factor": "M.2 2280"}'),
-- ('SSD-WD-SN850X-2TB', 'WD Black SN850X NVMe SSD 2TB', 'Storage', 'Western Digital', 189.99, 20, '{"capacity": "2TB", "interface": "NVMe PCIe 4.0", "read_speed": "7300 MB/s", "write_speed": "6600 MB/s", "form_factor": "M.2 2280"}'),
-- ('SSD-CRUCIAL-P3-1TB', 'Crucial P3 NVMe SSD 1TB', 'Storage', 'Crucial', 79.99, 50, '{"capacity": "1TB", "interface": "NVMe PCIe 3.0", "read_speed": "3500 MB/s", "write_speed": "3000 MB/s", "form_factor": "M.2 2280"}'),

-- Motherboards (Intel Z790)
-- ('MOBO-Z790-ASUS-HERO', 'ASUS ROG Maximus Z790 Hero', 'Motherboards', 'ASUS', 499.99, 7, '{"socket": "LGA1700", "chipset": "Z790", "ram_slots": 4, "pcie_slots": 3, "wifi": "Wi-Fi 6E", "ethernet": "2.5GbE"}'),
-- ('MOBO-Z790-MSI-TOMAHAWK', 'MSI MAG Z790 Tomahawk WiFi', 'Motherboards', 'MSI', 299.99, 12, '{"socket": "LGA1700", "chipset": "Z790", "ram_slots": 4, "pcie_slots": 2, "wifi": "Wi-Fi 6E", "ethernet": "2.5GbE"}'),
-- ('MOBO-Z790-GIGABYTE-ELITE', 'Gigabyte Z790 AORUS Elite AX', 'Motherboards', 'Gigabyte', 249.99, 15, '{"socket": "LGA1700", "chipset": "Z790", "ram_slots": 4, "pcie_slots": 2, "wifi": "Wi-Fi 6", "ethernet": "2.5GbE"}'),

-- Motherboards (AMD X670)
-- ('MOBO-X670E-ASUS-EXTREME', 'ASUS ROG Crosshair X670E Extreme', 'Motherboards', 'ASUS', 699.99, 5, '{"socket": "AM5", "chipset": "X670E", "ram_slots": 4, "pcie_slots": 3, "wifi": "Wi-Fi 6E", "ethernet": "10GbE"}'),
-- ('MOBO-X670-MSI-CARBON', 'MSI MPG X670E Carbon WiFi', 'Motherboards', 'MSI', 449.99, 8, '{"socket": "AM5", "chipset": "X670E", "ram_slots": 4, "pcie_slots": 2, "wifi": "Wi-Fi 6E", "ethernet": "2.5GbE"}'),

-- Power Supplies
-- ('PSU-850W-CORSAIR', 'Corsair RM850x 850W 80+ Gold Modular', 'Power Supplies', 'Corsair', 149.99, 18, '{"wattage": "850W", "efficiency": "80+ Gold", "modular": true, "warranty": "10 years"}'),
-- ('PSU-750W-SEASONIC', 'Seasonic Focus GX-750 750W 80+ Gold', 'Power Supplies', 'Seasonic', 129.99, 22, '{"wattage": "750W", "efficiency": "80+ Gold", "modular": true, "warranty": "10 years"}'),
-- ('PSU-1000W-EVGA', 'EVGA SuperNOVA 1000 P5 80+ Platinum', 'Power Supplies', 'EVGA', 199.99, 12, '{"wattage": "1000W", "efficiency": "80+ Platinum", "modular": true, "warranty": "10 years"}'),
-- ('PSU-650W-COOLERMASTER', 'Cooler Master MWE Gold 650W 80+ Gold', 'Power Supplies', 'Cooler Master', 89.99, 30, '{"wattage": "650W", "efficiency": "80+ Gold", "modular": false, "warranty": "5 years"}'),

-- Cases
-- ('CASE-FRACTAL-DEFINE-7', 'Fractal Design Define 7 ATX Mid Tower', 'Cases', 'Fractal Design', 169.99, 15, '{"form_factor": "ATX Mid Tower", "color": "Black", "panels": "Tempered Glass", "fans_included": 3}'),
-- ('CASE-CORSAIR-4000D', 'Corsair iCUE 4000X RGB ATX Mid Tower', 'Cases', 'Corsair', 129.99, 20, '{"form_factor": "ATX Mid Tower", "color": "Black", "panels": "Tempered Glass", "rgb": true, "fans_included": 3}'),
-- ('CASE-NZXT-H510', 'NZXT H510 ATX Mid Tower', 'Cases', 'NZXT', 99.99, 25, '{"form_factor": "ATX Mid Tower", "color": "Black/White", "panels": "Tempered Glass", "fans_included": 2}'),

-- Cooling
-- ('COOLER-NOCTUA-NH-D15', 'Noctua NH-D15 CPU Air Cooler', 'Cooling', 'Noctua', 99.99, 20, '{"type": "Air Cooler", "socket_support": "LGA1700, AM5, AM4", "fan_size": "140mm", "height": "165mm"}'),
-- ('COOLER-CORSAIR-H100I', 'Corsair iCUE H100i Elite Capellix 240mm AIO', 'Cooling', 'Corsair', 149.99, 15, '{"type": "AIO Liquid", "radiator_size": "240mm", "rgb": true, "socket_support": "LGA1700, AM5, AM4"}'),
-- ('COOLER-ARCTIC-FREEZER-34', 'Arctic Freezer 34 eSports DUO', 'Cooling', 'Arctic', 49.99, 30, '{"type": "Air Cooler", "socket_support": "LGA1700, AM5, AM4", "fan_size": "120mm", "height": "157mm"}');

-- Sample conversation data removed for production
-- INSERT INTO conversations (vapi_call_id, phone_number, duration_seconds, resolution_status, sentiment, cost, language_detected, functions_called) VALUES
-- ('call_sample_001', '+35799123456', 180, 'resolved', 'positive', 0.35, 'en', ARRAY['checkInventory', 'getProductPrice']);

-- Sample appointment data removed for production
-- INSERT INTO appointments (customer_phone, customer_name, service_type, appointment_time, status, notes) VALUES
-- ('+35799123456', 'Yiannis Georgiou', 'repair', '2024-01-25 10:00:00+02', 'confirmed', 'Laptop screen replacement');

-- Sample analytics events removed for production
-- INSERT INTO analytics_events (event_type, properties) VALUES
-- ('function_execution', '{"functionName": "checkInventory", "processingTime": 245, "success": true}');