/**
 * OpenAI Integration Usage Examples
 * This file demonstrates how to use the OpenAI services in STR Certified
 */

import { openAIService } from '../openai.service';
import { aiValidationService } from '../aiValidation.service';
import type { InspectionData, PropertyData } from '../types/openai.types';

// Example 1: Basic Inspection Validation
export async function validateInspectionExample() {
  const inspectionData: InspectionData = {
    id: 'insp_123',
    propertyId: 'prop_456',
    checklistId: 'check_789',
    inspectorId: 'user_abc',
    status: 'COMPLETED',
    items: [
      {
        id: 'item_1',
        name: 'Kitchen Cleanliness',
        category: 'Kitchen',
        status: 'PASS',
        notes: 'All surfaces clean, appliances working',
        photos: ['https://example.com/kitchen1.jpg']
      },
      {
        id: 'item_2',
        name: 'Bathroom Fixtures',
        category: 'Bathroom',
        status: 'FAIL',
        notes: 'Leaking faucet in master bathroom',
        severity: 'HIGH',
        photos: ['https://example.com/bathroom1.jpg']
      }
    ],
    score: 85,
    completedAt: new Date()
  };

  // Direct OpenAI validation
  const validation = await openAIService.validateInspectionReport(
    inspectionData,
    'user_123' // userId for rate limiting
  );

  console.log('Validation Result:', validation);
  // Output: { isValid: true, completenessScore: 90, missingItems: [...], suggestions: [...] }
}

// Example 2: Full AI Validation with Property Context
export async function fullValidationExample() {
  const inspectionData: InspectionData = {
    // ... inspection data
  } as InspectionData;

  const propertyData: PropertyData = {
    id: 'prop_456',
    name: 'Sunset Beach Villa',
    address: '123 Ocean Drive',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    propertyType: 'Condo',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500
  };

  // Use the AI validation service for comprehensive analysis
  const result = await aiValidationService.validateInspection(
    {
      id: inspectionData.id,
      propertyId: inspectionData.propertyId,
      checklistId: inspectionData.checklistId,
      items: inspectionData.items.map(item => ({
        id: item.id,
        name: item.name,
        status: item.status,
        notes: item.notes,
        photos: item.photos
      }))
    },
    propertyData
  );

  console.log('Full Validation:', result);
  // Includes validation, property condition assessment, and AI insights
}

// Example 3: Property Photo Analysis
export async function analyzePropertyPhotos() {
  const photos = [
    { url: 'https://example.com/exterior1.jpg', category: 'Exterior' },
    { url: 'https://example.com/living-room.jpg', category: 'Living Room' },
    { url: 'https://example.com/kitchen.jpg', category: 'Kitchen' }
  ];

  const analysis = await aiValidationService.analyzePropertyPhotos(photos);
  
  console.log('Photo Analysis:', analysis);
  // Returns detailed analysis of each photo with maintenance issues, safety concerns, etc.
}

// Example 4: Generate Inspection Report
export async function generateReportExample() {
  const propertyData = {
    name: 'Oceanview Retreat',
    address: '456 Beach Road',
    type: 'Single Family Home',
    bedrooms: 4,
    bathrooms: 3
  };

  const checklistData = {
    completedItems: 45,
    totalItems: 50,
    failedItems: [
      'Pool filter needs replacement',
      'Deck railing loose in two spots',
      'GFCI outlet in kitchen not functioning'
    ],
    score: 90
  };

  const report = await openAIService.generateInspectionReport(
    propertyData,
    checklistData,
    'user_123'
  );

  console.log('Generated Report:', report);
  // Returns a comprehensive, formatted inspection report
}

// Example 5: Market Insights
export async function getMarketInsightsExample() {
  const insights = await openAIService.generateMarketInsights(
    'Miami Beach, FL',
    'Luxury Condo',
    'user_123'
  );

  console.log('Market Insights:', insights);
  // Returns market trends, pricing recommendations, occupancy rates, etc.
}

// Example 6: Content Moderation
export async function moderateUserContent() {
  const userNote = "This property has some issues that need attention.";
  
  const isSafe = await openAIService.moderateContent(userNote);
  
  if (!isSafe) {
    console.log('Content flagged for moderation');
  }
}

// Example 7: Using in TRPC Router
export const inspectionRouterExample = {
  validateWithAI: async ({ ctx, input }: any) => {
    const { inspectionId } = input;
    
    // Fetch inspection data from database
    const inspection = await ctx.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        property: true,
        checklistItems: true
      }
    });

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    // Run AI validation
    const validation = await openAIService.validateInspectionReport(
      inspection,
      ctx.session.user.id // Use authenticated user ID for rate limiting
    );

    // Update inspection with AI insights
    await ctx.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        aiInsights: validation,
        aiProcessedAt: new Date()
      }
    });

    return validation;
  }
};

// Example 8: Batch Processing with Rate Limiting
export async function batchProcessInspections(userId: string) {
  const inspections = ['insp_1', 'insp_2', 'insp_3'];
  const results = [];

  for (const inspectionId of inspections) {
    try {
      // Rate limiting is automatically handled by the service
      const result = await openAIService.validateInspectionReport(
        { id: inspectionId, /* ... other data */ },
        userId
      );
      results.push({ inspectionId, result });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        console.log('Rate limit hit, waiting before retry...');
        // Handle rate limiting gracefully
      }
    }
  }

  return results;
}