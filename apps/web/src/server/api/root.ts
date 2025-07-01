import { createTRPCRouter } from '@/server/api/trpc';
import { propertyRouter } from '@/server/api/routers/property';
import { inspectionRouter } from '@/server/api/routers/inspection';
import { scraperRouter } from '@/server/api/routers/scraper';
import { userRouter } from '@/server/api/routers/user';
import { checklistRouter } from '@/server/api/routers/checklist';
import { mediaRouter } from '@/server/api/routers/media';
import { aiRouter } from '@/server/api/routers/ai';

export const appRouter = createTRPCRouter({
  property: propertyRouter,
  inspection: inspectionRouter,
  scraper: scraperRouter,
  user: userRouter,
  checklist: checklistRouter,
  media: mediaRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;