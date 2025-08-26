#!/usr/bin/env node

import fetch from 'node-fetch';

const VAPI_PRIVATE_KEY = '7b7a0576-788f-4425-9a20-d5d918ccf841';
const ASSISTANT_ID = '89b5d633-974a-4b58-a6b5-cdbba8c2726a';

async function getAssistant() {
  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to get assistant:', response.status);
      const errorText = await response.text();
      console.error('Error:', errorText);
      return;
    }
    
    const assistant = await response.json();
    console.log('📋 Assistant Configuration:');
    console.log('Name:', assistant.name);
    console.log('Model:', assistant.model?.model);
    console.log('Tools:', assistant.toolIds?.length || 0, 'tools');
    console.log('Tool IDs:', assistant.toolIds);
    
    // Check if system message mentions CSV
    const systemContent = assistant.model?.messages?.[0]?.content || '';
    if (systemContent.includes('CSV') || systemContent.includes('1000')) {
      console.log('✅ CSV file mentioned in system prompt');
    } else {
      console.log('❌ CSV file NOT mentioned in system prompt');
      console.log('Current system prompt (first 300 chars):');
      console.log(systemContent.substring(0, 300) + '...');
    }
    
    // Check for file uploads
    if (assistant.knowledgeBase?.files?.length > 0) {
      console.log('📁 Files uploaded:', assistant.knowledgeBase.files.length);
      assistant.knowledgeBase.files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name} (${file.size} bytes)`);
      });
    } else {
      console.log('❌ No files found in knowledge base');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getAssistant();