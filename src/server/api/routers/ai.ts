import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { openAIService } from '@/server/services/openai.service';
import { aiValidationService } from '@/server/services/aiValidation.service';
import { generateCostDashboard } from '@/server/services/openai-cost-tracker';
import { ItemStatus } from '@/lib/database';

export const aiRouter = createTRPCRouter({
  /**
   * Test OpenAI connection
   */
  testConnection: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const result = await openAIService.generateText({
          prompt: 'Test connection. Respond with "Connection successful!"',
          systemPrompt: 'You are testing the API connection.',
          maxTokens: 20,
          temperature: 0
        }, ctx.session.user.id);

        return {
          success: true,
          message: result,
          model: process.env.OPENAI_MODEL || 'gpt-4',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          message: (error as Error).message || 'Connection failed',
          model: process.env.OPENAI_MODEL || 'gpt-4',
          timestamp: new Date().toISOString()
        };
      }
    }),

  /**
   * Validate an inspection with AI
   */
  validateInspection: protectedProcedure
    .input(z.object({ 
      inspectionId: z.string() 
    }))
    .mutation(async ({ ctx, input }) => {
      // Fetch inspection data
      const inspection = await ctx.prisma.inspection.findUnique({
        where: { id: input.inspectionId },
        include: {
          property: true,
          checklistItems: {
            include: {
              category: true,
              media: true
            }
          }
        }
      });

      if (!inspection || inspection.organizationId !== ctx.session.user.organizationId) {
        throw new Error('Inspection not found or access denied');
      }

      // Run AI validation
      const validation = await aiValidationService.validateInspection(
        {
          id: inspection.id,
          propertyId: inspection.propertyId,
          checklistId: inspection.templateId || '',
          inspectorId: inspection.inspectorId,
          status: inspection.status as any,
          items: inspection.checklistItems.map(item => ({
            id: item.id,
            name: item.label,
            category: item.category?.name || 'General',
            status: (item.status || 'PENDING') as any,
            notes: item.notes || undefined,
            photos: item.media.map(m => m.url)
          }))
        } as any,
        inspection.property
      );

      // Update inspection with AI insights
      await ctx.prisma.inspection.update({
        where: { id: input.inspectionId },
        data: {
          aiInsights: validation.aiInsights,
          aiProcessedAt: new Date()
        }
      });

      return validation;
    }),

  /**
   * Generate inspection report
   */
  generateReport: protectedProcedure
    .input(z.object({ 
      inspectionId: z.string() 
    }))
    .mutation(async ({ ctx, input }) => {
      const inspection = await ctx.prisma.inspection.findUnique({
        where: { id: input.inspectionId },
        include: {
          property: true,
          checklistItems: {
            include: {
              category: true
            }
          }
        }
      });

      if (!inspection || inspection.organizationId !== ctx.session.user.organizationId) {
        throw new Error('Inspection not found or access denied');
      }

      // Prepare data for report generation
      const propertyData = {
        name: inspection.property.name,
        address: inspection.property.address,
        city: inspection.property.city,
        state: inspection.property.state,
        type: inspection.property.propertyType,
        bedrooms: inspection.property.bedrooms,
        bathrooms: inspection.property.bathrooms
      };

      const checklistData = {
        score: inspection.score || 0,
        totalItems: inspection.checklistItems.length,
        passedItems: inspection.checklistItems.filter(i => (i.status as string) === 'PASS').length,
        failedItems: inspection.checklistItems.filter(i => (i.status as string) === 'FAIL').length,
        criticalIssues: inspection.checklistItems
          .filter(i => (i.status as string) === 'FAIL')
          .map(i => `${i.category?.name || 'General'}: ${i.label}`)
      };

      const report = await openAIService.generateInspectionReport(
        propertyData,
        checklistData,
        ctx.session.user.id
      );

      return {
        report,
        generatedAt: new Date().toISOString()
      };
    }),

  /**
   * Get cost dashboard
   */
  getCostDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      const dashboard = generateCostDashboard(ctx.session.user.id);
      
      return {
        ...dashboard,
        aiEnabled: process.env.ENABLE_AI_VALIDATION === 'true'
      };
    }),

  /**
   * Analyze property photos
   */
  analyzePhotos: protectedProcedure
    .input(z.object({
      photos: z.array(z.object({
        url: z.string().url(),
        category: z.string().optional()
      })).max(10)
    }))
    .mutation(async ({ ctx, input }) => {
      const analysis = await aiValidationService.analyzePropertyPhotos(input.photos);
      
      return analysis;
    })
});