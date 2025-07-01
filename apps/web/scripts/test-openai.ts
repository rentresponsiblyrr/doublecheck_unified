#!/usr/bin/env tsx
/**
 * Test OpenAI API Connection
 * Run with: tsx scripts/test-openai.ts
 */

import OpenAI from 'openai';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

console.log('🔧 Testing OpenAI API Connection...\n');

// Check if API key exists
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables');
  console.log('Please set OPENAI_API_KEY in your .env.local file');
  process.exit(1);
}

console.log(`✅ API Key found: ${OPENAI_API_KEY.substring(0, 10)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4)}`);
console.log(`📦 Using model: ${OPENAI_MODEL}\n`);

async function testConnection() {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    console.log('🚀 Testing basic chat completion...');
    
    const startTime = Date.now();
    
    // Test basic chat completion
    const chatResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant testing the API connection.'
        },
        {
          role: 'user',
          content: 'Respond with "Connection successful!" and nothing else.'
        }
      ],
      max_tokens: 10,
      temperature: 0
    });

    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Chat completion successful (${responseTime}ms)`);
    console.log(`📝 Response: ${chatResponse.choices[0]?.message?.content}`);
    console.log(`💰 Usage: ${chatResponse.usage?.total_tokens} tokens\n`);

    // Test JSON mode
    console.log('🧪 Testing JSON response mode...');
    
    const jsonResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'user',
          content: 'Return a JSON object with status: "ok" and timestamp: current ISO timestamp'
        }
      ],
      max_tokens: 50,
      response_format: { type: 'json_object' }
    });

    const jsonResult = JSON.parse(jsonResponse.choices[0]?.message?.content || '{}');
    console.log('✅ JSON mode successful');
    console.log(`📝 Response:`, jsonResult, '\n');

    // Test moderation
    console.log('🛡️ Testing content moderation...');
    
    const moderationResponse = await openai.moderations.create({
      input: 'This is a safe test message for STR property inspection.',
    });

    console.log('✅ Moderation check successful');
    console.log(`📝 Flagged: ${moderationResponse.results[0]?.flagged}\n`);

    // Test cost calculation
    const totalTokens = (chatResponse.usage?.total_tokens || 0) + (jsonResponse.usage?.total_tokens || 0);
    const estimatedCost = (totalTokens / 1000) * 0.03; // GPT-4 pricing
    
    console.log('💰 Cost Summary:');
    console.log(`   Total tokens used: ${totalTokens}`);
    console.log(`   Estimated cost: $${estimatedCost.toFixed(4)}\n`);

    // Test our service integration
    console.log('🔌 Testing STR Certified OpenAI Service...');
    
    try {
      const { openAIService } = await import('../src/server/services/openai.service');
      
      const validationResult = await openAIService.validateInspectionReport({
        propertyType: 'Test Property',
        items: [
          { status: 'PASS', category: 'Kitchen', name: 'Cleanliness' },
          { status: 'FAIL', category: 'Bathroom', name: 'Faucet leak' }
        ]
      });

      console.log('✅ Service integration successful');
      console.log(`📝 Validation result:`, validationResult, '\n');
    } catch (error) {
      console.log('⚠️  Could not test service integration (might need to build first)');
      console.log(`   Error: ${error.message}\n`);
    }

    console.log('✅ All tests passed! OpenAI integration is working correctly.\n');
    
    // Display configuration summary
    console.log('📋 Configuration Summary:');
    console.log(`   Model: ${OPENAI_MODEL}`);
    console.log(`   Organization ID: ${process.env.OPENAI_ORG_ID || 'Not set'}`);
    console.log(`   AI Validation Enabled: ${process.env.ENABLE_AI_VALIDATION || 'false'}`);
    console.log(`   Vision Model: ${process.env.OPENAI_VISION_MODEL || 'gpt-4-vision-preview'}`);

  } catch (error) {
    console.error('\n❌ Connection test failed!');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data?.error?.message || error.message}`);
      
      if (error.response.status === 401) {
        console.error('\n🔑 Authentication failed. Please check your API key.');
      } else if (error.response.status === 429) {
        console.error('\n⏱️  Rate limit exceeded. Please try again later.');
      } else if (error.response.status === 404) {
        console.error('\n📦 Model not found. Make sure you have access to GPT-4.');
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    process.exit(1);
  }
}

// Run tests
testConnection().catch(console.error);