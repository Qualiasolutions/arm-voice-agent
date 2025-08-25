// Vercel Serverless Function Handler for Vapi.ai Webhooks
// This wraps the Edge Runtime handler for compatibility with Vercel Node.js runtime

import { GET as edgeGET, POST as edgePOST } from './vapi/route.js';

export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Vapi-Signature');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Build absolute URL for the request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const absoluteUrl = `${protocol}://${host}${req.url}`;

    // Create Request object for Edge Runtime handler
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value[0] : value);
      }
    }

    let body = null;
    if (req.method === 'POST' && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const request = new Request(absoluteUrl, {
      method: req.method,
      headers,
      body
    });

    let response;
    if (req.method === 'GET') {
      response = await edgeGET(request);
    } else if (req.method === 'POST') {
      response = await edgePOST(request);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Convert Edge Runtime Response to Node.js response
    const responseBody = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';
    
    res.status(response.status);
    res.setHeader('Content-Type', contentType);
    
    // Copy other response headers
    for (const [key, value] of response.headers.entries()) {
      if (!key.startsWith('access-control-') && key !== 'content-type') {
        res.setHeader(key, value);
      }
    }

    res.send(responseBody);

  } catch (error) {
    console.error('Vapi webhook handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}