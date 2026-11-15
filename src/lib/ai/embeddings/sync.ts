/**
 * Tovu Intelligence Layer — Non-Blocking Content Sync Orchestrator
 * Keeps vector embeddings synchronized when domain records change without
 * slowing or breaking mutation requests when AI/admin credentials are absent.
 */

import { logger } from "../../shared/logger";

type SyncHook = (task: () => Promise<void>, label: string) => void;

const defaultSyncHook: SyncHook = (task, label) => {
  void task().catch((err) => {
    logger.warn("Background vector sync skipped or failed", {
      label,
      error: err instanceof Error ? err.message : String(err),
    });
  });
};

let activeSyncHook: SyncHook = defaultSyncHook;

export function setEmbeddingSyncHook(hook: SyncHook | null): void {
  activeSyncHook = hook || defaultSyncHook;
}

export function scheduleEmbeddingSync(label: string, task: () => Promise<void>): void {
  activeSyncHook(task, label);
}
