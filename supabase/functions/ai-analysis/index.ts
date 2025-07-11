import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIAnalysisRequest {
  imageBase64: string
  prompt: string
  inspectionId: string
  checklistItemId: string
  maxTokens?: number
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

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestData: AIAnalysisRequest = await req.json()
    
    // Validate request
    if (!requestData.imageBase64 || !requestData.prompt || !requestData.inspectionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has access to this inspection
    const { data: inspection, error: inspectionError } = await supabaseClient
      .from('inspections')
      .select('inspector_id')
      .eq('id', requestData.inspectionId)
      .single()

    if (inspectionError || !inspection) {
      return new Response(
        JSON.stringify({ error: 'Inspection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has access (is inspector or admin/auditor)
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isAuthorized = inspection.inspector_id === user.id || 
                        userRoles?.some(ur => ['admin', 'reviewer'].includes(ur.role))

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting check
    const { data: recentUsage } = await supabaseClient
      .from('ai_usage_log')
      .select('id')
      .eq('inspection_id', requestData.inspectionId)
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute

    if (recentUsage && recentUsage.length > 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Make OpenAI request (server-side only)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert property inspector. Analyze the provided image and respond with a JSON object containing: status (pass/fail/needs_review), confidence (0-1), reasoning (string), issues (array), recommendations (array).'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: requestData.prompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: requestData.imageBase64.startsWith('data:') ? 
                       requestData.imageBase64 : 
                       `data:image/jpeg;base64,${requestData.imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: Math.min(requestData.maxTokens || 500, 1000),
        temperature: 0.1,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    const processingTime = Date.now() - startTime

    // Parse AI response
    let analysis
    try {
      const content = openaiData.choices[0].message.content
      analysis = JSON.parse(content)
    } catch (parseError) {
      // Fallback parsing if JSON is malformed
      const content = openaiData.choices[0].message.content
      analysis = {
        status: content.toLowerCase().includes('pass') ? 'pass' : 
                 content.toLowerCase().includes('fail') ? 'fail' : 'needs_review',
        confidence: 0.7,
        reasoning: content,
        issues: [],
        recommendations: []
      }
    }

    // Calculate cost (approximate)
    const costPer1kTokens = 0.01 // GPT-4 Vision pricing
    const totalTokens = openaiData.usage.total_tokens
    const cost = (totalTokens / 1000) * costPer1kTokens

    const response = {
      analysis: {
        status: analysis.status || 'needs_review',
        confidence: Math.min(Math.max(analysis.confidence || 0.5, 0), 1),
        reasoning: analysis.reasoning || 'Analysis completed',
        issues: Array.isArray(analysis.issues) ? analysis.issues : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
      },
      usage: {
        promptTokens: openaiData.usage.prompt_tokens,
        completionTokens: openaiData.usage.completion_tokens,
        totalTokens: openaiData.usage.total_tokens,
        cost: cost
      },
      metadata: {
        model: 'gpt-4-vision-preview',
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime
      }
    }

    // Log usage for monitoring and billing
    await supabaseClient.from('ai_usage_log').insert({
      inspection_id: requestData.inspectionId,
      checklist_item_id: requestData.checklistItemId,
      prompt_tokens: response.usage.promptTokens,
      completion_tokens: response.usage.completionTokens,
      total_tokens: response.usage.totalTokens,
      cost: response.usage.cost,
      model: response.metadata.model,
      processing_time_ms: response.metadata.processingTimeMs,
      user_id: user.id,
      created_at: new Date().toISOString()
    })

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})