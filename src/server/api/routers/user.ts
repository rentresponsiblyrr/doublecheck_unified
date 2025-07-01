import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/api/trpc';
import { UserRole } from '@/lib/database';
import { hash } from 'bcryptjs';

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        organization: true,
        _count: {
          select: {
            inspections: true,
            assignedItems: true,
          },
        },
      },
    });

    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        image: z.string().url().optional(),
        settings: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...input,
          lastActiveAt: new Date(),
        },
      });

      return user;
    }),

  list: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.nativeEnum(UserRole).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, role, limit, cursor } = input;

      const where = {
        organizationId: ctx.session.user.organizationId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(role && { role }),
      };

      const users = await ctx.prisma.user.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              inspections: true,
              assignedItems: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }

      return {
        users,
        nextCursor,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        password: z.string().min(6),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await hash(input.password, 12);

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          role: input.role,
          organizationId: ctx.session.user.organizationId,
        },
      });

      return user;
    }),

  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: {
          id: input.userId,
          organizationId: ctx.session.user.organizationId,
        },
        data: {
          role: input.role,
        },
      });

      return user;
    }),
});