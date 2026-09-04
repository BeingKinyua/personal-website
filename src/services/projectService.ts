import { Project } from "../types/project";
import { PROJECTS } from "../data/projects";

export interface ProjectRepository {
  getAllProjects(): Promise<Project[]>;
  getFeaturedProjects(): Promise<Project[]>;
  getProjectBySlug(slug: string): Promise<Project | null>;
  searchProjects(query: string): Promise<Project[]>;
}

export class MockProjectRepository implements ProjectRepository {
  async getAllProjects(): Promise<Project[]> {
    return PROJECTS;
  }

  async getFeaturedProjects(): Promise<Project[]> {
    return PROJECTS.filter((p) => p.featured);
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const found = PROJECTS.find((p) => p.slug === slug || p.id === slug);
    return found || null;
  }

  async searchProjects(query: string): Promise<Project[]> {
    const q = query.toLowerCase().trim();
    if (!q) return PROJECTS;
    return PROJECTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.technologies.some((t) => t.toLowerCase().includes(q))
    );
  }
}

export const projectRepository: ProjectRepository = new MockProjectRepository();
