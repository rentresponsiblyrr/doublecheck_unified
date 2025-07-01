export const env = {
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
  OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL || 'gpt-4-vision-preview',
  
  // Feature Flags
  ENABLE_AI_VALIDATION: process.env.ENABLE_AI_VALIDATION || 'false',
  
  // Other configurations can be added here
} as const;