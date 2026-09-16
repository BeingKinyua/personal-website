/**
 * VictorOS Content Cache & Revalidation Architecture
 * Coordinates Next.js On-Demand Revalidation and Cache Tag Invalidation.
 * Fails gracefully when invoked in worker, test, or non-Next.js runtime environments.
 */

import { logger } from "./logger";

export const CACHE_TAGS = {
  PROJECTS: "projects",
  PROJECT: (slugOrId: string) => `projects:${slugOrId}`,
  ARTICLES: "articles",
  ARTICLE: (slugOrId: string) => `articles:${slugOrId}`,
  LABS: "labs",
  LAB: (slugOrId: string) => `labs:${slugOrId}`,
  KNOWLEDGE: "knowledge",
  CONCEPT: (slugOrId: string) => `knowledge:${slugOrId}`,
  MEDIA: "media",
  MEDIA_ASSET: (id: string) => `media:${id}`,
} as const;

/**
 * Safely triggers on-demand cache revalidation for given tags or paths.
 */
export async function revalidateContent(options: {
  tags?: string[];
  paths?: string[];
}): Promise<void> {
  const { tags = [], paths = [] } = options;

  logger.info("cache:revalidate_requested", { tags, paths });

  try {
    // Attempt dynamic import of next/cache if in Next.js environment
    // Using Function to prevent bundlers from statically resolving next/cache if unavailable
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const nextCacheModule = await (new Function('return import("next/cache")')().catch(() => null));

    if (nextCacheModule) {
      if (nextCacheModule.revalidateTag && tags.length > 0) {
        for (const tag of tags) {
          nextCacheModule.revalidateTag(tag);
        }
      }
      if (nextCacheModule.revalidatePath && paths.length > 0) {
        for (const path of paths) {
          nextCacheModule.revalidatePath(path);
        }
      }
      logger.info("cache:revalidated_via_next", { tags, paths });
    } else {
      logger.debug("cache:revalidate_simulated", { tags, paths, runtime: "standalone/express" });
    }
  } catch (err) {
    logger.warn("cache:revalidation_failed_softly", {
      tags,
      paths,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
