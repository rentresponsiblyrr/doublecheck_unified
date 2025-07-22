/**
 * Claude AI Test Script
 * 
 * This script tests the Claude SDK installation and demonstrates basic usage.
 * Run this with: node test-claude.js
 */

// Import the Claude SDK using ES modules
import Anthropic from '@anthropic-ai/sdk';

// Check if API key is available
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

if (!apiKey) {
  console.log('❌ No Anthropic API key found!');
  console.log('Please set one of these environment variables:');
  console.log('  - ANTHROPIC_API_KEY');
  console.log('  - VITE_ANTHROPIC_API_KEY');
  console.log('');
  console.log('You can get an API key from: https://console.anthropic.com/');
  console.log('');
  console.log('To set the environment variable, run:');
  console.log('  export ANTHROPIC_API_KEY=your_api_key_here');
  process.exit(1);
}

// Initialize the Claude client
const anthropic = new Anthropic({
  apiKey: apiKey,
});

console.log('🚀 Claude AI SDK Test');
console.log('====================');
console.log('');

async function testClaude() {
  try {
    console.log('📝 Testing text generation...');
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Hello! Please write a brief introduction about Claude AI for a property inspection platform.'
        }
      ]
    });

    console.log('✅ Claude response received!');
    console.log('');
    console.log('🤖 Claude says:');
    console.log(response.content[0].text);
    console.log('');
    console.log('📊 Usage:');
    console.log(`  Input tokens: ${response.usage.input_tokens}`);
    console.log(`  Output tokens: ${response.usage.output_tokens}`);
    console.log(`  Total tokens: ${response.usage.input_tokens + response.usage.output_tokens}`);
    console.log('');
    console.log('🎉 Claude AI is working perfectly!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your environment variables in .env.local');
    console.log('2. Deploy the claude-analysis Edge Function');
    console.log('3. Use the ClaudeIntegrationExample component in your app');
    console.log('');
    console.log('📖 See docs/CLAUDE_INTEGRATION.md for complete setup instructions.');

  } catch (error) {
    console.error('❌ Error testing Claude:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check your API key is correct');
    console.log('2. Ensure you have internet connection');
    console.log('3. Verify your Anthropic account has credits');
  }
}

// Run the test
testClaude(); 