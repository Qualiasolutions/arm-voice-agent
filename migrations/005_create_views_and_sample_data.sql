-- Create useful views for analytics and reporting
CREATE VIEW daily_stats AS
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
CREATE VIEW appointment_slots AS
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

-- Note: Sample product data removed for production deployment
-- Product data should now come from live sources via MCP integration or database management

-- Store information cache data (legitimate static responses)
INSERT INTO analytics_events (event_type, properties) VALUES
('store_info_cache', '{"type": "hours", "value": "Monday to Friday 9am-7pm, Saturday 9am-2pm", "language": "en"}'),
('store_info_cache', '{"type": "hours", "value": "Δευτέρα έως Παρασκευή 9π.μ.-7μ.μ., Σάββατο 9π.μ.-2μ.μ.", "language": "el"}'),
('store_info_cache', '{"type": "location", "value": "We are located at 171 Makarios Avenue in Nicosia", "language": "en"}'),
('store_info_cache', '{"type": "location", "value": "Βρισκόμαστε στη Λεωφόρο Μακαρίου 171 στη Λευκωσία", "language": "el"}'),
('store_info_cache', '{"type": "phone", "value": "You can also reach us at 77-111-104", "language": "en"}'),
('store_info_cache', '{"type": "phone", "value": "Μπορείτε επίσης να μας καλέσετε στο 77-111-104", "language": "el"}');