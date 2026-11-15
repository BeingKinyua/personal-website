import { useCallback, useEffect, useState } from "react";
import type { Project } from "../types/project";
import type { Article } from "../types/article";
import type { Experiment } from "../types/experiment";
import type { KnowledgeEdge, KnowledgeNode } from "../types/knowledge";
import { projectRepository, type ContentFetchResult } from "../services/projectService";
import { articleRepository } from "../services/articleService";
import { labRepository } from "../services/labService";
import { knowledgeRepository } from "../services/knowledgeService";

interface CachedEntry<T> {
  promise?: Promise<ContentFetchResult<T>>;
  result?: ContentFetchResult<T>;
}

const listCache = {
  projects: {} as CachedEntry<Project[]>,
  articles: {} as CachedEntry<Article[]>,
  labs: {} as CachedEntry<Experiment[]>,
  knowledge: {} as CachedEntry<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }>,
};

function fetchOnce<T>(
  entry: CachedEntry<T>,
  loader: () => Promise<ContentFetchResult<T>>,
  force = false
): Promise<ContentFetchResult<T>> {
  if (!force && entry.result) {
    return Promise.resolve(entry.result);
  }
  if (!force && entry.promise) {
    return entry.promise;
  }
  const promise = loader()
    .then((res) => {
      entry.result = res;
      entry.promise = undefined;
      return res;
    })
    .catch((err) => {
      entry.promise = undefined;
      throw err;
    });
  entry.promise = promise;
  return promise;
}

export interface AsyncCollectionState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  isFixture: boolean;
  reload: () => void;
}

function useCachedCollection<T>(
  entry: CachedEntry<T>,
  loader: () => Promise<ContentFetchResult<T>>,
  emptyValue: T
): AsyncCollectionState<T> {
  const [data, setData] = useState<T>(entry.result ? entry.result.data : emptyValue);
  const [isFixture, setIsFixture] = useState<boolean>(entry.result ? entry.result.isFixture : false);
  const [loading, setLoading] = useState<boolean>(!entry.result);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const isReload = version > 0;
    if (!entry.result || isReload) {
      setLoading(true);
      setError(null);
    }

    fetchOnce(entry, loader, isReload)
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setIsFixture(res.isFixture);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        if ((err as { name?: string })?.name === "AbortError") return;
        setLoading(false);
        setError(err instanceof Error ? err.message : "Failed to load content.");
      });

    return () => {
      active = false;
    };
  }, [version]);

  const reload = useCallback(() => {
    entry.result = undefined;
    setVersion((v) => v + 1);
  }, [entry]);

  return { data, loading, error, isFixture, reload };
}

export function useProjectsData(): AsyncCollectionState<Project[]> {
  return useCachedCollection(listCache.projects, () => projectRepository.getAllProjects(), []);
}

export function useArticlesData(): AsyncCollectionState<Article[]> {
  return useCachedCollection(listCache.articles, () => articleRepository.getAllArticles(), []);
}

export function useLabsData(): AsyncCollectionState<Experiment[]> {
  return useCachedCollection(listCache.labs, () => labRepository.getAllExperiments(), []);
}

export function useKnowledgeGraphData(): AsyncCollectionState<{
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}> {
  return useCachedCollection(
    listCache.knowledge,
    () => knowledgeRepository.getKnowledgeGraph(),
    { nodes: [], edges: [] }
  );
}

export interface AsyncEntityState<T> {
  data: T | null;
  loading: boolean;
  notFound: boolean;
  error: string | null;
  isFixture: boolean;
  reload: () => void;
}

export function useProjectBySlug(slug: string | null): AsyncEntityState<Project> {
  const [data, setData] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFixture, setIsFixture] = useState<boolean>(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setLoading(false);
      setNotFound(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);
    setError(null);

    projectRepository
      .getProjectBySlug(slug, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setData(res.data);
        setIsFixture(res.isFixture);
        setNotFound(!res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted || (err as { name?: string })?.name === "AbortError") return;
        setLoading(false);
        setError(err instanceof Error ? err.message : "Failed to load project.");
      });

    return () => controller.abort();
  }, [slug, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, loading, notFound, error, isFixture, reload };
}

export function useArticleBySlug(slug: string | null): AsyncEntityState<Article> {
  const [data, setData] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFixture, setIsFixture] = useState<boolean>(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setLoading(false);
      setNotFound(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);
    setError(null);

    articleRepository
      .getArticleBySlug(slug, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setData(res.data);
        setIsFixture(res.isFixture);
        setNotFound(!res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted || (err as { name?: string })?.name === "AbortError") return;
        setLoading(false);
        setError(err instanceof Error ? err.message : "Failed to load article.");
      });

    return () => controller.abort();
  }, [slug, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, loading, notFound, error, isFixture, reload };
}

export function __resetContentCacheForTests(): void {
  listCache.projects = {};
  listCache.articles = {};
  listCache.labs = {};
  listCache.knowledge = {};
}
