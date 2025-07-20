/**
 * PROFESSIONAL OPENAI MOCK - ZERO TOLERANCE STANDARDS
 * 
 * Comprehensive OpenAI API mock for testing AI functionality.
 */

import { vi } from 'vitest';

export const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(() => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify({
              analysis: {
                score: 85,
                issues: [],
                recommendations: ['Good photo quality'],
                confidence: 0.9,
              },
            }),
          },
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      })),
    },
  },
  
  images: {
    generate: vi.fn(() => Promise.resolve({
      data: [{
        url: 'https://mock-generated-image.com/test.jpg',
      }],
    })),
  },
  
  embeddings: {
    create: vi.fn(() => Promise.resolve({
      data: [{
        embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5),
      }],
    })),
  },
};