import { vi } from 'vitest';

export const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        id: 'chatcmpl-test',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4-vision-preview',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                analysis: {
                  score: 85,
                  confidence: 0.92,
                  issues: [
                    {
                      type: 'plumbing',
                      severity: 'medium',
                      location: 'Kitchen sink',
                      description: 'Minor leak detected under kitchen sink',
                      confidence: 0.88,
                    },
                  ],
                  recommendations: [
                    'Verify plumbing issue in kitchen',
                    'Consider follow-up inspection',
                  ],
                  flags: [],
                },
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 75,
          total_tokens: 225,
        },
      }),
    },
  },
  
  images: {
    generate: vi.fn().mockResolvedValue({
      created: Date.now(),
      data: [
        {
          url: 'https://test.com/generated-image.jpg',
        },
      ],
    }),
    
    createVariation: vi.fn().mockResolvedValue({
      created: Date.now(),
      data: [
        {
          url: 'https://test.com/variation-image.jpg',
        },
      ],
    }),
  },
  
  models: {
    list: vi.fn().mockResolvedValue({
      object: 'list',
      data: [
        {
          id: 'gpt-4-vision-preview',
          object: 'model',
          created: Date.now(),
          owned_by: 'openai',
        },
        {
          id: 'gpt-4',
          object: 'model',
          created: Date.now(),
          owned_by: 'openai',
        },
        {
          id: 'dall-e-3',
          object: 'model',
          created: Date.now(),
          owned_by: 'openai',
        },
      ],
    }),
  },
  
  moderations: {
    create: vi.fn().mockResolvedValue({
      id: 'modr-test',
      model: 'text-moderation-latest',
      results: [
        {
          flagged: false,
          categories: {
            sexual: false,
            hate: false,
            harassment: false,
            'self-harm': false,
            'sexual/minors': false,
            'hate/threatening': false,
            'violence/graphic': false,
            'self-harm/intent': false,
            'self-harm/instructions': false,
            'harassment/threatening': false,
            violence: false,
          },
          category_scores: {
            sexual: 0.01,
            hate: 0.02,
            harassment: 0.01,
            'self-harm': 0.0,
            'sexual/minors': 0.0,
            'hate/threatening': 0.0,
            'violence/graphic': 0.01,
            'self-harm/intent': 0.0,
            'self-harm/instructions': 0.0,
            'harassment/threatening': 0.0,
            violence: 0.02,
          },
        },
      ],
    }),
  },
};