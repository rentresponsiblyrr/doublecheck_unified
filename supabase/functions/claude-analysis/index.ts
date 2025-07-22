import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClaudeAnalysisRequest {
  imageBase64?: string;
  prompt: string;
  inspectionId?: string;
  checklistItemId?: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  analysisType: 'photo' | 'text' | 'code';
}

interface ClaudeAnalysisResponse {
  analysis?: {
    status: 'pass' | 'fail' | 'needs_review';
    confidence: number;
    reasoning: string;
    issues: string[];
    recommendations: string[];
  };
  content?: string;
  review?: {
    score: number;
    issues: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low';
      category: 'security' | 'performance' | 'maintainability' | 'accessibility' | 'type-safety';
      description: string;
      line?: number;
      suggestion?: string;
    }>;
    suggestions: string[];
    summary: string;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata: {
    model: string;
    processingTime: number;
    timestamp: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestData: ClaudeAnalysisRequest = await req.json()

    // Validate request
    if (!requestData.prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limiting
    const { data: recentUsage } = await supabaseClient
      .from('ai_usage_log')
      .select('id')
      .eq('user_id', user.id)
      .eq('ai_provider', 'claude')
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute

    if (recentUsage && recentUsage.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Anthropic API key
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'Claude service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()

    // Prepare Claude request based on analysis type
    let claudeRequest: any
    let systemPrompt: string

    switch (requestData.analysisType) {
      case 'photo':
        if (!requestData.imageBase64) {
          return new Response(
            JSON.stringify({ error: 'Image data is required for photo analysis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        systemPrompt = `You are an expert property inspector analyzing photos for vacation rental compliance in the STR Certified platform.

Your role is to:
1. Compare the inspection photo to expected standards
2. Identify compliance issues and safety concerns
3. Provide actionable recommendations
4. Assess confidence in your analysis

Respond with a JSON object containing:
- status: "pass", "fail", or "needs_review"
- confidence: number between 0 and 1
- reasoning: detailed explanation of your assessment
- issues: array of specific problems found
- recommendations: array of actionable suggestions

Focus on:
- Safety compliance (fire safety, electrical, structural)
- Property condition and maintenance
- Amenity accuracy and functionality
- Regulatory requirements for vacation rentals`

        claudeRequest = {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: requestData.maxTokens || 1000,
          temperature: requestData.temperature || 0.3,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: requestData.prompt },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: requestData.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
                  }
                }
              ]
            }
          ]
        }
        break

      case 'text':
        systemPrompt = requestData.context?.systemPrompt || 
          'You are an expert assistant for the STR Certified platform, helping with property inspection workflows, documentation, and analysis.'

        claudeRequest = {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: requestData.maxTokens || 1000,
          temperature: requestData.temperature || 0.3,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: requestData.prompt
            }
          ]
        }
        break

      case 'code':
        systemPrompt = `You are an expert code reviewer for the STR Certified platform, a React/TypeScript application for property inspections.

Review the provided code for:
- Security vulnerabilities
- Performance issues
- Maintainability concerns
- Accessibility compliance
- Type safety
- Best practices

Respond with a JSON object containing:
- score: number between 0-100 (overall code quality)
- issues: array of issues with severity, category, description, line number, and suggestions
- suggestions: array of general improvement suggestions
- summary: brief overview of the review

Focus on React/TypeScript best practices, security, and the specific needs of a property inspection platform.`

        claudeRequest = {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: requestData.maxTokens || 1000,
          temperature: 0.1, // Lower temperature for consistent code review
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Please review this code:

File: ${requestData.context?.filePath || 'Unknown'}
Context: ${requestData.context?.context || 'No additional context provided'}
Focus Areas: ${requestData.context?.focusAreas?.join(', ') || 'General review'}

Code:
\`\`\`typescript
${requestData.prompt}
\`\`\``
            }
          ]
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid analysis type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Make Claude API request
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequest)
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Claude analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const claudeData = await claudeResponse.json()
    const processingTime = Date.now() - startTime

    // Parse Claude response
    let analysis, content, review
    const responseText = claudeData.content[0]?.text || ''

    try {
      const parsedResponse = JSON.parse(responseText)
      
      if (requestData.analysisType === 'photo') {
        analysis = parsedResponse
      } else if (requestData.analysisType === 'text') {
        content = responseText
      } else if (requestData.analysisType === 'code') {
        review = parsedResponse
      }
    } catch (parseError) {
      // Fallback for non-JSON responses
      if (requestData.analysisType === 'text') {
        content = responseText
      } else {
        console.error('Failed to parse Claude response:', parseError)
        return new Response(
          JSON.stringify({ error: 'Invalid response format from Claude' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Calculate cost
    const inputTokens = claudeData.usage.input_tokens
    const outputTokens = claudeData.usage.output_tokens
    const inputCostPer1k = 0.003
    const outputCostPer1k = 0.015
    const cost = (inputTokens / 1000) * inputCostPer1k + (outputTokens / 1000) * outputCostPer1k

    // Prepare response
    const response: ClaudeAnalysisResponse = {
      ...(analysis && { analysis }),
      ...(content && { content }),
      ...(review && { review }),
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost
      },
      metadata: {
        model: 'claude-3-5-sonnet-20241022',
        processingTime,
        timestamp: new Date().toISOString()
      }
    }

    // Log usage
    await supabaseClient
      .from('ai_usage_log')
      .insert({
        user_id: user.id,
        ai_provider: 'claude',
        model: 'claude-3-5-sonnet-20241022',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost,
        inspection_id: requestData.inspectionId,
        checklist_item_id: requestData.checklistItemId,
        analysis_type: requestData.analysisType
      })

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Claude analysis error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 