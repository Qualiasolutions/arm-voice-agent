// Health check endpoint for monitoring
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
    
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
    
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'online',
      database: 'checking',
      cache: 'checking',
      vapi: 'checking'
    },
    environment: {
      node_version: process.version,
      region: process.env.VERCEL_REGION || 'unknown',
      environment: process.env.NODE_ENV || 'development'
    },
    functions: {
      checkInventory: 'active',
      getProductPrice: 'active',
      bookAppointment: 'active',
      checkOrderStatus: 'active',
      getStoreInfo: 'active'
    }
  };
    
  // Check database connection
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
            
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);
            
      if (error) {
        console.error('Database health check failed:', error);
        healthStatus.services.database = 'error';
        healthStatus.database_error = error.message;
      } else {
        healthStatus.services.database = 'online';
        healthStatus.database_records = data?.length || 0;
      }
    } else {
      healthStatus.services.database = 'not configured';
      healthStatus.database_error = 'Missing environment variables: ' + 
        (!process.env.SUPABASE_URL ? 'SUPABASE_URL ' : '') +
        (!process.env.SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY' : '');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    healthStatus.services.database = 'error';
    healthStatus.database_error = error.message;
  }
    
  // Check Vapi configuration
  healthStatus.services.vapi = process.env.VAPI_API_KEY ? 'configured' : 'not configured';
    
  // Check cache (simplified check)
  healthStatus.services.cache = process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'not configured';
    
  // Determine overall health
  const hasErrors = Object.values(healthStatus.services).some(status => 
    status === 'error' || status === 'not configured'
  );
    
  if (hasErrors) {
    healthStatus.status = 'degraded';
  }
    
  // Return health status
  return res.status(200).json(healthStatus);
}