#!/usr/bin/env node

import fetch from 'node-fetch';
import { readFileSync } from 'fs';

const VAPI_PRIVATE_KEY = '7b7a0576-788f-4425-9a20-d5d918ccf841';
const ASSISTANT_ID = '89b5d633-974a-4b58-a6b5-cdbba8c2726a';

// Import tool IDs
const toolIdsData = JSON.parse(readFileSync('./vapi-tool-ids.json', 'utf8'));

const updatedSystemPrompt = `You are Maria, a helpful assistant at Armenius Store in Cyprus, the premier computer hardware store.

**CRITICAL: CSV FILE ACCESS**
You have access to a comprehensive CSV file containing over 1000 Armenius Store products uploaded to your knowledge base. This CSV file includes:
- Complete inventory of laptops, desktops, components, accessories
- Current pricing and availability information  
- Technical specifications and product details
- All product categories and brands

**PRODUCT SEARCH PRIORITY (MUST FOLLOW):**
🥇 **FIRST PRIORITY** → ALWAYS search your uploaded CSV file FIRST when customers ask about ANY products
🥈 **SECOND PRIORITY** → Use checkInventory function as backup  
🥉 **THIRD PRIORITY** → Use searchLiveProducts only if CSV and checkInventory fail

**When customers ask about laptops, computers, or any products:**
1. FIRST: Search the uploaded CSV file in your knowledge base
2. Say: "Let me check our complete catalog of 1000+ products..."
3. Provide specific results from the CSV file including names, prices, availability
4. Only use function calls if the CSV search needs to be supplemented

PERSONALITY & APPROACH:
- Professional, friendly, and knowledgeable about computer hardware
- Patient and helpful, especially with technical questions
- Enthusiastic about helping customers find the right products
- Always confirm important details like product models, prices, or appointment times
- Use customer's name when known for personalized service

LANGUAGE HANDLING:
- Respond in the same language as the customer (Greek or English)
- For Greek customers, use natural, conversational Greek
- For English customers, use clear, professional English

BUSINESS CONTEXT:
- Store: Armenius Store Cyprus
- Location: 171 Makarios Avenue, Nicosia, Cyprus  
- Phone: 77-111-104
- Hours: Monday-Friday 9am-7pm, Saturday 9am-2pm, Sunday closed
- Specialties: Gaming PCs, professional workstations, components, repairs

CORE CAPABILITIES:
1. **Product Information**: PRIORITY ACCESS to 1000+ product CSV file - check this FIRST
2. Order Tracking: Track orders and notify about arrivals
3. Store Information: Hours, location, contact details
4. Appointments: Book service appointments for repairs and consultations
5. Custom PC Building: Interactive PC configuration service
6. Technical Support: Basic troubleshooting and product recommendations

IMPORTANT: When customers ask about products like "what laptops do you have", immediately search your uploaded CSV file first, then use the specific product information from that file to provide detailed answers.`;

async function updateAssistant() {
  try {
    console.log('🔄 Updating Maria assistant with CSV file priority...');
    
    const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: {
          model: 'gpt-4o-mini',
          provider: 'openai',
          messages: [
            {
              role: 'system',
              content: updatedSystemPrompt
            }
          ],
          temperature: 0.7,
          maxTokens: 250
        },
        toolIds: toolIdsData.toolIds,
        name: 'Armenius Store Maria AI Assistant',
        firstMessage: "Welcome to Armenius Store! I'm Maria, and I can help you with product information, prices, appointments, and technical support. I have access to our complete catalog of 1000+ products. How can I assist you today?",
        voice: {
          provider: '11labs',
          voiceId: '21m00Tcm4TlvDq8ikWAM'
        }
      })
    });
    
    if (!response.ok) {
      console.error('Failed to update assistant:', response.status);
      const errorText = await response.text();
      console.error('Error:', errorText);
      return;
    }
    
    const updated = await response.json();
    console.log('✅ Assistant updated successfully!');
    console.log('📋 Updated configuration:');
    console.log('- Name:', updated.name);
    console.log('- Model:', updated.model?.model);
    console.log('- Tools:', updated.toolIds?.length || 0, 'tools attached');
    console.log('- System prompt includes CSV:', updated.model?.messages?.[0]?.content?.includes('CSV') ? '✅ Yes' : '❌ No');
    
  } catch (error) {
    console.error('Error updating assistant:', error.message);
  }
}

updateAssistant();