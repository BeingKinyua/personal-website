import type { KnowledgeEdge, KnowledgeNode } from "../types/knowledge";
import { KNOWLEDGE_EDGES, KNOWLEDGE_NODES } from "../data/knowledge";
import { apiRequest, shouldFallbackToDevFixture } from "./apiClient";
import { mapKnowledgeGraphToUi, type BackendKnowledgeGraphDto } from "./contentMappers";
import type { ContentFetchResult } from "./projectService";

export interface KnowledgeGraphPayload {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface KnowledgeRepositoryClient {
  getKnowledgeGraph(signal?: AbortSignal): Promise<ContentFetchResult<KnowledgeGraphPayload>>;
}

export class ApiKnowledgeRepository implements KnowledgeRepositoryClient {
  async getKnowledgeGraph(
    signal?: AbortSignal
  ): Promise<ContentFetchResult<KnowledgeGraphPayload>> {
    try {
      const graph = await apiRequest<BackendKnowledgeGraphDto>("/knowledge/graph", {
        signal,
      });
      return {
        data: mapKnowledgeGraphToUi(graph),
        isFixture: false,
      };
    } catch (err) {
      if (shouldFallbackToDevFixture(err)) {
        return {
          data: { nodes: KNOWLEDGE_NODES, edges: KNOWLEDGE_EDGES },
          isFixture: true,
        };
      }
      throw err;
    }
  }
}

export const knowledgeRepository: KnowledgeRepositoryClient = new ApiKnowledgeRepository();
