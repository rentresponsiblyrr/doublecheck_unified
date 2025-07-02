import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
// import { chromium } from 'playwright'; // Removed for deployment
import { TRPCError } from '@trpc/server';
import { Platform } from '@/lib/database';

const scrapeInputSchema = z.object({
  propertyId: z.string().optional(),
  vrboId: z.string().optional(),
  url: z.string().url().optional(),
  platform: z.nativeEnum(Platform).default(Platform.VRBO),
});

export const scraperRouter = createTRPCRouter({
  scrapeImages: protectedProcedure
    .input(scrapeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { propertyId, vrboId, url, platform } = input;

      // Validate input
      if (!vrboId && !url && !propertyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Must provide either vrboId, url, or propertyId',
        });
      }

      let targetUrl = url;
      let property = null;

      // If propertyId provided, get URL from database
      if (propertyId) {
        property = await ctx.prisma.property.findUnique({
          where: { id: propertyId },
        });

        if (!property) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Property not found',
          });
        }

        // Check authorization
        if (property.organizationId !== ctx.session.user.organizationId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized to access this property',
          });
        }

        targetUrl = property.vrboUrl || property.airbnbUrl || undefined;
      }

      // Construct URL from vrboId if needed
      if (!targetUrl && vrboId) {
        targetUrl = `https://www.vrbo.com/${vrboId}?dateless=true&pwaThumbnailDialog=thumbnail-gallery`;
      }

      if (!targetUrl) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No valid URL found',
        });
      }

      // Create scraper job
      const job = await ctx.prisma.scraperJob.create({
        data: {
          propertyId: property?.id || propertyId!,
          platform: platform as any,
          status: 'RUNNING',
        },
      });

      try {
        // Scraping temporarily disabled for deployment
        throw new TRPCError({
          code: 'NOT_IMPLEMENTED',
          message: 'Scraping functionality temporarily disabled - playwright not installed',
        });
        
        /* // Launch browser with stealth settings
        const browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const context = await browser.newContext({
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 },
        });

        const page = await context.newPage();

        // Navigate to URL
        await page.goto(targetUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // Wait for images to load
        await page.waitForTimeout(5000);

        // Extract image URLs based on platform
        let imageUrls: string[] = [];

        if (platform === Platform.VRBO) {
          imageUrls = await page.$$eval('img', (imgs) =>
            imgs
              .map((img) => img.src)
              .filter((src) => src && (src.includes('.jpg') || src.includes('.jpeg')))
              .filter((src) => !src.includes('thumb') && !src.includes('small'))
          );
        } else if (platform === Platform.AIRBNB) {
          // Airbnb specific selectors
          imageUrls = await page.$$eval('img[data-original-uri], img[src*="airbnb"]', (imgs) =>
            imgs
              .map((img) => img.getAttribute('data-original-uri') || img.src)
              .filter((src) => src && (src.includes('.jpg') || src.includes('.jpeg')))
          );
        }

        await browser.close();

        // Remove duplicates
        const uniqueUrls = [...new Set(imageUrls)];

        // Update job status
        await ctx.prisma.scraperJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            data: { imageUrls: uniqueUrls },
          },
        });

        // If property exists, update its photos
        if (property) {
          await ctx.prisma.property.update({
            where: { id: property.id },
            data: {
              photos: uniqueUrls,
              scrapedData: {
                ...property.scrapedData as any,
                lastScrapedAt: new Date(),
                imageCount: uniqueUrls.length,
              },
            },
          });
        }

        return {
          success: true,
          imageUrls: uniqueUrls,
          count: uniqueUrls.length,
          jobId: job.id,
        }; */
      } catch (error) {
        // Update job status to failed
        await ctx.prisma.scraperJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          },
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to scrape images',
          cause: error,
        });
      }
    }),

  getScraperJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.prisma.scraperJob.findUnique({
        where: { id: input.jobId },
        include: { property: true },
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        });
      }

      // Check authorization
      if (job.property.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to access this job',
        });
      }

      return job;
    }),

  listScraperJobs: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().optional(),
        status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { propertyId, status, limit, cursor } = input;

      const where = {
        property: {
          organizationId: ctx.session.user.organizationId,
        },
        ...(propertyId && { propertyId }),
        ...(status && { status }),
      };

      const jobs = await ctx.prisma.scraperJob.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { scheduledFor: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (jobs.length > limit) {
        const nextItem = jobs.pop();
        nextCursor = nextItem!.id;
      }

      return {
        jobs,
        nextCursor,
      };
    }),
});