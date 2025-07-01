import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { ItemStatus, AiStatus } from '@str-certified/database';
import { TRPCError } from '@trpc/server';

const updateChecklistItemSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(ItemStatus).optional(),
  notes: z.string().optional(),
  aiStatus: z.nativeEnum(AiStatus).optional(),
  aiConfidence: z.number().min(0).max(1).optional(),
  aiSuggestions: z.any().optional(),
});

export const checklistRouter = createTRPCRouter({
  updateItem: protectedProcedure
    .input(updateChecklistItemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify item belongs to user's organization
      const item = await ctx.prisma.checklistItem.findUnique({
        where: { id },
        include: {
          inspection: true,
        },
      });

      if (!item || item.inspection.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Checklist item not found or access denied',
        });
      }

      // Create history entry for changes
      const changes: any = {};
      if (data.status && data.status !== item.status) {
        changes.status = { from: item.status, to: data.status };
      }
      if (data.notes !== undefined && data.notes !== item.notes) {
        changes.notes = { from: item.notes, to: data.notes };
      }

      if (Object.keys(changes).length > 0) {
        await ctx.prisma.itemHistory.create({
          data: {
            checklistItemId: id,
            userId: ctx.session.user.id,
            action: 'UPDATE',
            changes,
          },
        });
      }

      // Update the item
      const updatedItem = await ctx.prisma.checklistItem.update({
        where: { id },
        data: {
          ...data,
          lastModifiedBy: ctx.session.user.id,
          lastModifiedAt: new Date(),
          version: { increment: 1 },
        },
        include: {
          category: true,
          media: true,
          assignedTo: true,
        },
      });

      return updatedItem;
    }),

  assignItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        userId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify item belongs to user's organization
      const item = await ctx.prisma.checklistItem.findUnique({
        where: { id: input.itemId },
        include: {
          inspection: true,
        },
      });

      if (!item || item.inspection.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Checklist item not found or access denied',
        });
      }

      // Verify assignee belongs to same organization if provided
      if (input.userId) {
        const assignee = await ctx.prisma.user.findUnique({
          where: { id: input.userId },
        });

        if (!assignee || assignee.organizationId !== ctx.session.user.organizationId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid assignee',
          });
        }
      }

      const updatedItem = await ctx.prisma.checklistItem.update({
        where: { id: input.itemId },
        data: {
          assignedToId: input.userId,
        },
      });

      // Create history entry
      await ctx.prisma.itemHistory.create({
        data: {
          checklistItemId: input.itemId,
          userId: ctx.session.user.id,
          action: 'ASSIGN',
          changes: { assignedTo: input.userId },
        },
      });

      return updatedItem;
    }),

  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        itemIds: z.array(z.string()),
        status: z.nativeEnum(ItemStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify all items belong to user's organization
      const items = await ctx.prisma.checklistItem.findMany({
        where: {
          id: { in: input.itemIds },
        },
        include: {
          inspection: true,
        },
      });

      const validItemIds = items
        .filter(item => item.inspection.organizationId === ctx.session.user.organizationId)
        .map(item => item.id);

      if (validItemIds.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No valid items to update',
        });
      }

      // Update items
      await ctx.prisma.checklistItem.updateMany({
        where: {
          id: { in: validItemIds },
        },
        data: {
          status: input.status,
          lastModifiedBy: ctx.session.user.id,
          lastModifiedAt: new Date(),
        },
      });

      // Create history entries
      const historyEntries = validItemIds.map(itemId => ({
        checklistItemId: itemId,
        userId: ctx.session.user.id,
        action: 'BULK_UPDATE',
        changes: { status: input.status },
      }));

      await ctx.prisma.itemHistory.createMany({
        data: historyEntries,
      });

      return {
        updated: validItemIds.length,
        total: input.itemIds.length,
      };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify item belongs to user's organization
      const item = await ctx.prisma.checklistItem.findUnique({
        where: { id: input.itemId },
        include: {
          inspection: true,
        },
      });

      if (!item || item.inspection.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Checklist item not found or access denied',
        });
      }

      const history = await ctx.prisma.itemHistory.findMany({
        where: { checklistItemId: input.itemId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return history;
    }),
});