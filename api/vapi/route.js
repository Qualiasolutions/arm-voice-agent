import crypto from 'crypto';
import FunctionRegistry from '../../lib/functions/index.js';
import CacheManager from '../../lib/cache/index.js';
import CostOptimizer from '../../lib/optimization/index.js';
import CustomerIdentification from '../../lib/functions/customer-identification.js';
import { db } from '../../lib/supabase/client.js';

// Initialize components
let initialized = false;
let customerIdentification = null;

async function ensureInitialized() {
  if (!initialized) {
    await FunctionRegistry.init();
    await CacheManager.init();
    customerIdentification = new CustomerIdentification(db);
    initialized = true;
  }
}

// Webhook signature verification
function verifyVapiSignature(request, body) {
  if (!process.env.VAPI_SERVER_SECRET) {
    console.warn('VAPI_SERVER_SECRET not configured - skipping signature verification');
    return true; // Allow in development
  }

  const signature = request.headers.get('x-vapi-signature');
  if (!signature) {
    console.error('Missing x-vapi-signature header');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.VAPI_SERVER_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Main webhook handler
export async function POST(request) {
  const startTime = Date.now();

  try {
    await ensureInitialized();

    // Parse request body
    const body = await request.json();
    
    // Verify webhook signature
    if (!verifyVapiSignature(request, body)) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const { type, call, functionCall, transcript, message } = body;
    
    console.log(`Webhook received: ${type}`, {
      callId: call?.id,
      timestamp: new Date().toISOString()
    });

    // Route to appropriate handler
    switch (type) {
      case 'function-call':
        return await handleFunctionCall(functionCall, call, body);
      
      case 'conversation-update':
        return await handleConversationUpdate(transcript || message, call, body);
      
      case 'call-started':
        return await handleCallStarted(call, body);
      
      case 'call-ended':
        return await handleCallEnded(call, body);
      
      case 'transfer-destination-request':
        return await handleTransferRequest(call, body);
      
      case 'status-update':
        return await handleStatusUpdate(call, body);
      
      case 'transcript':
        return await handleTranscript(message || transcript, call, body);
        
      default:
        console.log(`Unhandled webhook type: ${type}`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Webhook handler error:', error);
    
    // Track error
    await db.trackEvent('webhook_error', {
      error: error.message,
      stack: error.stack,
      requestBody: body,
      processingTime: Date.now() - startTime
    }).catch(console.error);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'Something went wrong processing your request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle function calls (main business logic)
async function handleFunctionCall(functionCall, call, originalPayload) {
  const startTime = Date.now();
  const { name, parameters } = functionCall;
  
  console.log(`Executing function: ${name}`, parameters);

  try {
    // Create or get conversation record
    let conversationId = null;
    try {
      const conversation = await db.createConversation(call.id, call.customer?.number, {
        functionCall: { name, parameters },
        callStarted: new Date().toISOString()
      });
      conversationId = conversation.id;
    } catch (error) {
      console.warn('Failed to create conversation record:', error.message);
    }

    // Identify customer for personalized responses
    let customerProfile = null;
    let customerContext = {};
    
    if (call.customer?.number) {
      try {
        customerProfile = await customerIdentification.identifyCustomer(
          call.customer.number, 
          { conversationId, callId: call.id }
        );
        
        if (customerProfile) {
          customerContext = customerIdentification.getCustomerContext(customerProfile);
          console.log(`Customer identified: ${customerProfile.name} (${customerProfile.totalOrders} orders)`);
        }
      } catch (error) {
        console.warn('Failed to identify customer:', error.message);
      }
    }

    // Build call context with customer info
    const callContext = {
      callId: call.id,
      conversationId: conversationId,
      customerNumber: call.customer?.number,
      customerProfile: customerProfile,
      customerContext: customerContext,
      timestamp: new Date().toISOString()
    };

    // Execute function through registry
    const result = await FunctionRegistry.execute(name, parameters, callContext);

    // Optimize response text for TTS cost savings
    if (result.message) {
      const language = result.language || detectLanguageFromResult(result);
      result.message = await CostOptimizer.optimizeResponse(result.message, language);
    }

    // Track successful execution
    const processingTime = Date.now() - startTime;
    await db.trackEvent('function_execution', {
      functionName: name,
      parameters: parameters,
      success: true,
      processingTime: processingTime,
      resultType: result.error ? 'error' : 'success'
    }, conversationId);

    // Update conversation with function call
    if (conversationId) {
      try {
        await db.updateConversation(call.id, {
          functions_called: [name],
          metadata: {
            lastFunction: name,
            lastFunctionResult: result,
            lastFunctionTime: new Date().toISOString()
          }
        });
      } catch (error) {
        console.warn('Failed to update conversation:', error.message);
      }
    }

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`Function ${name} execution error:`, error);

    // Track error
    const processingTime = Date.now() - startTime;
    await db.trackEvent('function_execution_error', {
      functionName: name,
      parameters: parameters,
      error: error.message,
      processingTime: processingTime
    }, conversationId);

    // Return fallback response
    const handler = FunctionRegistry.get(name);
    const fallbackMessage = handler?.fallbackResponse || 
      "I'm having trouble with that request. Please try again or call us directly at 77-111-104.";

    return new Response(JSON.stringify({
      result: {
        error: true,
        message: fallbackMessage,
        fallback: true
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle call started
async function handleCallStarted(call, payload) {
  console.log(`Call started: ${call.id} from ${call.customer?.number}`);

  try {
    // Identify customer for personalized experience
    let customerProfile = null;
    let personalizedGreeting = null;
    
    if (call.customer?.number) {
      console.log(`Attempting to identify customer with phone: ${call.customer.number}`);
      try {
        customerProfile = await customerIdentification.identifyCustomer(call.customer.number, {
          callId: call.id
        });
        
        if (customerProfile) {
          // Generate personalized greeting
          const detectedLanguage = customerProfile.preferredLanguage || 'en';
          personalizedGreeting = customerIdentification.generatePersonalizedGreeting(
            customerProfile, 
            detectedLanguage
          );
          
          console.log(`✅ Customer identified: ${customerProfile.name}, Orders: ${customerProfile.totalOrders}, Language: ${detectedLanguage}, VIP: ${customerProfile.isVipCustomer}`);
        } else {
          console.log(`❌ No customer found for phone: ${call.customer.number}`);
        }
      } catch (error) {
        console.error('Failed to identify customer for greeting:', error);
      }
    } else {
      console.log('No customer phone number provided in call');
    }

    // Create conversation record with customer info
    const conversationData = {
      callStarted: new Date().toISOString(),
      customerName: customerProfile?.name || call.customer?.name,
      assistantId: call.assistantId,
      customerProfile: customerProfile,
      personalizedGreeting: personalizedGreeting
    };

    await db.createConversation(call.id, call.customer?.number, conversationData);

    // Track call start with customer context
    await db.trackEvent('call_started', {
      callId: call.id,
      customerNumber: call.customer?.number,
      assistantId: call.assistantId,
      customerIdentified: !!customerProfile,
      customerName: customerProfile?.name,
      isReturningCustomer: customerProfile?.totalOrders > 0,
      isVipCustomer: customerProfile?.isVipCustomer
    });

    // Warm up cache for this call
    await CacheManager.warmup();

    // Return personalized response if customer was identified
    const response = { received: true };
    
    if (personalizedGreeting) {
      response.personalizedGreeting = personalizedGreeting;
      response.customerContext = {
        identified: true,
        name: customerProfile.name,
        preferredLanguage: customerProfile.preferredLanguage
      };
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error handling call start:', error);
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle call ended
async function handleCallEnded(call, payload) {
  console.log(`Call ended: ${call.id}, duration: ${call.duration}s`);

  try {
    // Calculate call cost
    const usage = {
      vapiMinutes: (call.duration || 0) / 60,
      ttsCharacters: call.costs?.tts || 0,
      sttSeconds: call.duration || 0,
      llmTokens: call.costs?.llm || 0
    };

    const costData = await CostOptimizer.trackCallCost(call.id, usage);

    // Update conversation record
    const updateData = {
      ended_at: new Date().toISOString(),
      duration_seconds: call.duration,
      resolution_status: call.endedReason === 'customer-ended-call' ? 'resolved' : 'incomplete',
      cost: costData?.total
    };

    await db.updateConversation(call.id, updateData);

    // Track call end
    await db.trackEvent('call_ended', {
      callId: call.id,
      duration: call.duration,
      endReason: call.endedReason,
      cost: costData?.total
    });

    // Generate call summary if transcript is available
    if (call.transcript && call.transcript.length > 0) {
      // TODO: Generate AI summary of the call
      // const summary = await generateCallSummary(call.transcript);
      // await db.updateConversation(call.id, { summary });
    }

  } catch (error) {
    console.error('Error handling call end:', error);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle conversation updates
async function handleConversationUpdate(transcript, call, payload) {
  try {
    if (transcript) {
      // Update conversation with transcript
      await db.updateConversation(call.id, {
        transcript: transcript,
        language_detected: detectLanguage(transcript.text || transcript)
      });
    }

  } catch (error) {
    console.error('Error handling conversation update:', error);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle transfer requests
async function handleTransferRequest(call, payload) {
  try {
    // Simple transfer logic - in production this would be more sophisticated
    const { functionCall } = payload;
    const urgency = functionCall?.parameters?.urgency || 'medium';

    let destination;
    if (urgency === 'critical' || urgency === 'emergency') {
      destination = {
        type: "number",
        number: process.env.EMERGENCY_TRANSFER_NUMBER || "+35777111104",
        message: "Connecting you to our emergency support team."
      };
    } else {
      destination = {
        type: "number", 
        number: process.env.GENERAL_TRANSFER_NUMBER || "+35777111104",
        message: "Transferring you to our support team. Please hold."
      };
    }

    await db.trackEvent('call_transfer', {
      callId: call.id,
      urgency: urgency,
      destination: destination.number
    });

    return new Response(JSON.stringify({ destination }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error handling transfer request:', error);
    
    return new Response(JSON.stringify({
      error: 'Transfer routing failed. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle status updates
async function handleStatusUpdate(call, payload) {
  try {
    await db.trackEvent('call_status_update', {
      callId: call.id,
      status: call.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error handling status update:', error);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle transcript updates
async function handleTranscript(message, call, payload) {
  try {
    const role = message.role || 'unknown';
    const transcript = message.transcript || message.content || message;

    await db.trackEvent('transcript_update', {
      callId: call.id,
      role: role,
      transcript: transcript,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error handling transcript:', error);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper functions
function detectLanguage(text) {
  if (!text) return 'en';
  const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/;
  return greekRegex.test(text) ? 'el' : 'en';
}

function detectLanguageFromResult(result) {
  if (result.language) return result.language;
  if (result.message) return detectLanguage(result.message);
  return 'en';
}

// Handle GET requests (health check)
export async function GET(request) {
  await ensureInitialized();
  
  const stats = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    functions: FunctionRegistry.getStats(),
    cache: CacheManager.getStats(),
    environment: process.env.NODE_ENV || 'development'
  };

  return new Response(JSON.stringify(stats, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}