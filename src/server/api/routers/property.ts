import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { PropertyType, PropertyStatus } from '~/lib/database';
import { TRPCError } from '@trpc/server';

const createPropertySchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  propertyType: z.nativeEnum(PropertyType),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  maxGuests: z.number().int().min(1).optional(),
  vrboUrl: z.string().url().optional(),
  airbnbUrl: z.string().url().optional(),
  bookingUrl: z.string().url().optional(),
});

const updatePropertySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(2).max(2).optional(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  maxGuests: z.number().int().min(1).optional(),
  vrboUrl: z.string().url().optional(),
  airbnbUrl: z.string().url().optional(),
  bookingUrl: z.string().url().optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  amenities: z.array(z.string()).optional(),
  houseRules: z.array(z.string()).optional(),
});

export const propertyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPropertySchema)
    .mutation(async ({ ctx, input }) => {
      const property = await ctx.prisma.property.create({
        data: {
          ...input,
          organizationId: ctx.session.user.organizationId,
        },
      });

      // Log activity
      await ctx.prisma.activity.create({
        data: {
          userId: ctx.session.user.id,
          action: 'CREATED_PROPERTY',
          entityType: 'property',
          entityId: property.id,
          metadata: { propertyName: property.name },
        },
      });

      return property;
    }),

  update: protectedProcedure
    .input(updatePropertySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify property belongs to user's organization
      const existing = await ctx.prisma.property.findUnique({
        where: { id },
      });

      if (!existing || existing.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Property not found or access denied',
        });
      }

      const property = await ctx.prisma.property.update({
        where: { id },
        data,
      });

      // Log activity
      await ctx.prisma.activity.create({
        data: {
          userId: ctx.session.user.id,
          action: 'UPDATED_PROPERTY',
          entityType: 'property',
          entityId: property.id,
          metadata: { changes: data },
        },
      });

      return property;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const property = await ctx.prisma.property.findUnique({
        where: { id: input.id },
        include: {
          inspections: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              inspector: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              inspections: true,
            },
          },
        },
      });

      if (!property || property.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Property not found or access denied',
        });
      }

      return property;
    }),

  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.nativeEnum(PropertyStatus).optional(),
        propertyType: z.nativeEnum(PropertyType).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, status, propertyType, limit, cursor } = input;

      const where = {
        organizationId: ctx.session.user.organizationId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(status && { status }),
        ...(propertyType && { propertyType }),
      };

      const properties = await ctx.prisma.property.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              inspections: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (properties.length > limit) {
        const nextItem = properties.pop();
        nextCursor = nextItem!.id;
      }

      return {
        properties,
        nextCursor,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify property belongs to user's organization
      const property = await ctx.prisma.property.findUnique({
        where: { id: input.id },
      });

      if (!property || property.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Property not found or access denied',
        });
      }

      // Only allow deletion if no inspections
      const inspectionCount = await ctx.prisma.inspection.count({
        where: { propertyId: input.id },
      });

      if (inspectionCount > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete property with existing inspections',
        });
      }

      await ctx.prisma.property.delete({
        where: { id: input.id },
      });

      // Log activity
      await ctx.prisma.activity.create({
        data: {
          userId: ctx.session.user.id,
          action: 'DELETED_PROPERTY',
          entityType: 'property',
          entityId: input.id,
          metadata: { propertyName: property.name },
        },
      });

      return { success: true };
    }),
});