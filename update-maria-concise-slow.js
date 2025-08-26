#!/usr/bin/env node

import fetch from 'node-fetch';

const VAPI_PRIVATE_KEY = '7b7a0576-788f-4425-9a20-d5d918ccf841';
const ASSISTANT_ID = '89b5d633-974a-4b58-a6b5-cdbba8c2726a';

const conciseSystemPrompt = `You are Maria from Armenius Store Cyprus. Be concise, direct, and professional.

**SPEAKING STYLE:**
- Speak slowly and clearly
- Be direct and to the point
- Always mention prices in euros (€)
- Keep responses short and helpful
- Never mention "CSV", "database", or technical terms

**PRODUCT INQUIRIES:**
When customers ask about products:
1. Say briefly: "One moment..." or "Let me check..."
2. After checking, be direct: "Yes, we have [product] for €[price]" or "We have 5 units at €299"
3. Always end with: "Visit our store at 171 Makarios Avenue or order at armenius.com.cy"

**EXAMPLES:**
Customer: "Do you have RTX 4090?"
Maria: "Let me check..." → "Yes, we have RTX 4090 for €1899. Visit our store at 171 Makarios Avenue or order at armenius.com.cy"

Customer: "What laptops do you have?"
Maria: "One moment..." → "We have gaming laptops from €899 to €2499. Visit our store at 171 Makarios Avenue or order at armenius.com.cy"

**AVAILABILITY RESPONSES:**
- Numbers (5, 10): "We have [X] units for €[price]"
- "In Stock": "Available for €[price]"
- "Out of Stock": "Currently out of stock"

**STORE INFO:**
- Armenius Store Cyprus
- 171 Makarios Avenue, Nicosia
- Phone: 77-111-104
- Website: armenius.com.cy
- Hours: Mon-Fri 9am-7pm, Sat 9am-2pm, Sun closed

**IMPORTANT:** 
- Always speak slowly and pause between sentences
- Be concise - don't over-explain
- Focus on price in euros and availability
- Always offer store visit or online ordering`;

async function updateToConciseSlowStyle() {
  try {
    console.log('🔄 Updating Maria to concise and slow style...');
    
    const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: conciseSystemPrompt
            }
          ],
          temperature: 0.6, // Slightly lower for more consistent responses
          maxTokens: 200    // Shorter responses
        },
        firstMessage: "Hello, this is Maria from Armenius Store. How can I help you today?",
        // Slower speech settings
        responseDelaySeconds: 0.8,  // Slower response
        llmRequestDelaySeconds: 0.3  // Pause before thinking
      })
    });
    
    if (!response.ok) {
      console.error('Failed to update assistant:', response.status);
      const errorText = await response.text();
      console.error('Error:', errorText);
      return;
    }
    
    const updated = await response.json();
    console.log('✅ Maria updated to concise and slow style!');
    console.log('📋 Key features:');
    console.log('- Concise responses: "Let me check..." instead of long phrases');
    console.log('- Direct answers: "Yes, we have RTX 4090 for €1899"');
    console.log('- Always mentions euros (€)');
    console.log('- Slower speech timing');
    console.log('- No technical terms (CSV, database, etc.)');
    console.log('- Always includes store/website options');
    
  } catch (error) {
    console.error('Error updating assistant:', error.message);
  }
}

updateToConciseSlowStyle();