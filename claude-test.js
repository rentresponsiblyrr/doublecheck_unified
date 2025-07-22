/**
 * Simple Claude AI Test
 * 
 * This script demonstrates Claude AI functionality for the STR Certified platform.
 * Run this to test Claude without needing to set up the full React app.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';

// Check for API key
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

if (!apiKey) {
  console.log('❌ No Anthropic API key found!');
  console.log('');
  console.log('To set your API key, run one of these commands:');
  console.log('  export ANTHROPIC_API_KEY=your_api_key_here');
  console.log('  export VITE_ANTHROPIC_API_KEY=your_api_key_here');
  console.log('');
  console.log('Or add it to your .env.local file:');
  console.log('  VITE_ANTHROPIC_API_KEY=your_api_key_here');
  console.log('');
  console.log('Get your API key from: https://console.anthropic.com/');
  process.exit(1);
}

// Initialize Claude
const anthropic = new Anthropic({ apiKey });

console.log('🚀 Claude AI Test for STR Certified');
console.log('===================================');
console.log('');

async function testClaudeFeatures() {
  try {
    // Test 1: Text Generation
    console.log('📝 Test 1: Text Generation');
    console.log('Generating property inspection summary...');
    
    const textResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: 'Write a brief summary of a property inspection for a vacation rental, focusing on safety compliance and any issues found.'
        }
      ]
    });

    console.log('✅ Text Generation Result:');
    console.log(textResponse.content[0].text);
    console.log('');

    // Test 2: Code Review
    console.log('💻 Test 2: Code Review');
    console.log('Reviewing sample React component...');
    
    const sampleCode = `
function PropertyInspectionForm({ propertyId, onSubmit }) {
  const [formData, setFormData] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={formData.name} 
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
    `;

    const codeResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Please review this React component for a property inspection form. Focus on security, performance, and best practices. Here's the code:\n\n\`\`\`jsx\n${sampleCode}\n\`\`\``
        }
      ]
    });

    console.log('✅ Code Review Result:');
    console.log(codeResponse.content[0].text);
    console.log('');

    // Test 3: Property Analysis
    console.log('🏠 Test 3: Property Analysis');
    console.log('Analyzing property inspection scenario...');
    
    const analysisResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 250,
      messages: [
        {
          role: 'user',
          content: `You are an expert property inspector. Analyze this scenario and provide recommendations:

Scenario: A vacation rental property has been reported for safety concerns. The property is a 3-bedroom house with:
- Electrical outlets near water sources
- Missing smoke detectors in bedrooms
- Staircase without proper handrails
- Kitchen with outdated appliances

What are the critical safety issues and what recommendations would you make for compliance?`
        }
      ]
    });

    console.log('✅ Property Analysis Result:');
    console.log(analysisResponse.content[0].text);
    console.log('');

    // Usage Summary
    console.log('📊 Usage Summary:');
    const totalInput = textResponse.usage.input_tokens + codeResponse.usage.input_tokens + analysisResponse.usage.input_tokens;
    const totalOutput = textResponse.usage.output_tokens + codeResponse.usage.output_tokens + analysisResponse.usage.output_tokens;
    const totalTokens = totalInput + totalOutput;
    
    console.log(`  Total Input Tokens: ${totalInput}`);
    console.log(`  Total Output Tokens: ${totalOutput}`);
    console.log(`  Total Tokens: ${totalTokens}`);
    console.log(`  Estimated Cost: $${((totalInput * 0.003 + totalOutput * 0.015) / 1000).toFixed(4)}`);
    console.log('');

    console.log('🎉 All Claude AI tests completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Add your API key to .env.local for the React app');
    console.log('2. Deploy the claude-analysis Edge Function');
    console.log('3. Use Claude in your STR Certified application');
    console.log('');
    console.log('📖 See CLAUDE_QUICK_START.md for complete setup instructions.');

  } catch (error) {
    console.error('❌ Error testing Claude:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check your API key is correct');
    console.log('2. Ensure you have internet connection');
    console.log('3. Verify your Anthropic account has credits');
    console.log('4. Check the error details above');
  }
}

// Run the tests
testClaudeFeatures(); 