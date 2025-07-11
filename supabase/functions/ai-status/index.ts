import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          available: false,
          rateLimitRemaining: 0,
          lastUpdate: new Date().toISOString(),
          models: [],
          error: 'AI service not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check OpenAI API status
    try {
      const modelsResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
      })

      if (!modelsResponse.ok) {
        throw new Error(`OpenAI API error: ${modelsResponse.status}`)
      }

      const modelsData = await modelsResponse.json()
      const availableModels = modelsData.data
        .filter((model: any) => model.id.includes('gpt-4'))
        .map((model: any) => model.id)

      // Get rate limit info from headers
      const rateLimitRemaining = parseInt(modelsResponse.headers.get('x-ratelimit-remaining-requests') || '0')

      // Get recent usage for this user
      const { data: recentUsage } = await supabaseClient
        .from('ai_usage_log')
        .select('total_tokens, cost')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour

      const hourlyUsage = recentUsage?.reduce((acc, log) => ({
        tokens: acc.tokens + log.total_tokens,
        cost: acc.cost + log.cost
      }), { tokens: 0, cost: 0 }) || { tokens: 0, cost: 0 }

      return new Response(
        JSON.stringify({
          available: true,
          rateLimitRemaining,
          lastUpdate: new Date().toISOString(),
          models: availableModels,
          usage: {
            hourlyTokens: hourlyUsage.tokens,
            hourlyCost: hourlyUsage.cost,
            remaining: Math.max(0, 10000 - hourlyUsage.tokens) // 10k tokens per hour limit
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('AI status check failed:', error)
      return new Response(
        JSON.stringify({
          available: false,
          rateLimitRemaining: 0,
          lastUpdate: new Date().toISOString(),
          models: [],
          error: 'AI service temporarily unavailable'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})