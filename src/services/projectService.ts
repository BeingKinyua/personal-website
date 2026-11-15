import type { Project } from "../types/project";
import { PROJECTS } from "../data/projects";
import { apiRequest, ApiClientError, shouldFallbackToDevFixture } from "./apiClient";
import { mapProjectRowToProject, type BackendProjectDto } from "./contentMappers";

export interface ContentFetchResult<T> {
  data: T;
  isFixture: boolean;
}

export interface ProjectRepository {
  getAllProjects(signal?: AbortSignal): Promise<ContentFetchResult<Project[]>>;
  getFeaturedProjects(signal?: AbortSignal): Promise<ContentFetchResult<Project[]>>;
  getProjectBySlug(slug: string, signal?: AbortSignal): Promise<ContentFetchResult<Project | null>>;
  searchProjects(query: string, signal?: AbortSignal): Promise<ContentFetchResult<Project[]>>;
}

export class ApiProjectRepository implements ProjectRepository {
  async getAllProjects(signal?: AbortSignal): Promise<ContentFetchResult<Project[]>> {
    try {
      const payload = await apiRequest<{ projects: BackendProjectDto[] }>("/projects?limit=100", {
        signal,
      });
      return {
        data: (payload.projects || []).map((row, idx) => mapProjectRowToProject(row, idx)),
        isFixture: false,
      };
    } catch (err) {
      if (shouldFallbackToDevFixture(err)) {
        return { data: PROJECTS, isFixture: true };
      }
      throw err;
    }
  }

  async getFeaturedProjects(signal?: AbortSignal): Promise<ContentFetchResult<Project[]>> {
    try {
      const payload = await apiRequest<{ projects: BackendProjectDto[] }>(
        "/projects?featured=true&limit=50",
        { signal }
      );
      return {
        data: (payload.projects || []).map((row, idx) => mapProjectRowToProject(row, idx)),
        isFixture: false,
      };
    } catch (err) {
      if (shouldFallbackToDevFixture(err)) {
        return { data: PROJECTS.filter((p) => p.featured), isFixture: true };
      }
      throw err;
    }
  }

  async getProjectBySlug(
    slug: string,
    signal?: AbortSignal
  ): Promise<ContentFetchResult<Project | null>> {
    try {
      const row = await apiRequest<BackendProjectDto>(
        `/projects/${encodeURIComponent(slug)}`,
        { signal }
      );
      return {
        data: mapProjectRowToProject(row),
        isFixture: false,
      };
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 404) {
        return { data: null, isFixture: false };
      }
      if (shouldFallbackToDevFixture(err)) {
        const found = PROJECTS.find((p) => p.slug === slug || p.id === slug) || null;
        return { data: found, isFixture: true };
      }
      throw err;
    }
  }

  async searchProjects(query: string, signal?: AbortSignal): Promise<ContentFetchResult<Project[]>> {
    const q = query.trim();
    if (!q) return this.getAllProjects(signal);

    try {
      const payload = await apiRequest<{ projects: BackendProjectDto[] }>(
        `/projects?search=${encodeURIComponent(q)}&limit=50`,
        { signal }
      );
      return {
        data: (payload.projects || []).map((row, idx) => mapProjectRowToProject(row, idx)),
        isFixture: false,
      };
    } catch (err) {
      if (shouldFallbackToDevFixture(err)) {
        const lower = q.toLowerCase();
        return {
          data: PROJECTS.filter(
            (p) =>
              p.title.toLowerCase().includes(lower) ||
              p.subtitle.toLowerCase().includes(lower) ||
              p.category.toLowerCase().includes(lower) ||
              p.technologies.some((t) => t.toLowerCase().includes(lower))
          ),
          isFixture: true,
        };
      }
      throw err;
    }
  }
}

export const projectRepository: ProjectRepository = new ApiProjectRepository();
