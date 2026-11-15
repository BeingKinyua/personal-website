import type { Experiment } from "../types/experiment";
import { EXPERIMENTS } from "../data/experiments";
import { apiRequest, shouldFallbackToDevFixture } from "./apiClient";
import { mapLabRowToExperiment, type BackendLabDto } from "./contentMappers";
import type { ContentFetchResult } from "./projectService";

export interface LabRepositoryClient {
  getAllExperiments(signal?: AbortSignal): Promise<ContentFetchResult<Experiment[]>>;
}

export class ApiLabRepository implements LabRepositoryClient {
  async getAllExperiments(signal?: AbortSignal): Promise<ContentFetchResult<Experiment[]>> {
    try {
      const payload = await apiRequest<{ labs: BackendLabDto[] }>("/labs?limit=100", {
        signal,
      });
      return {
        data: (payload.labs || []).map((row, idx) => mapLabRowToExperiment(row, idx)),
        isFixture: false,
      };
    } catch (err) {
      if (shouldFallbackToDevFixture(err)) {
        return { data: EXPERIMENTS, isFixture: true };
      }
      throw err;
    }
  }
}

export const labRepository: LabRepositoryClient = new ApiLabRepository();
