/**
 * VictorOS Knowledge Domain Service
 * Business logic and authorization for conceptual definitions and engineering mental models.
 */

import { KnowledgeRepository } from "./repository";
import { createConceptSchema, updateConceptSchema, conceptFilterSchema } from "./schemas";
import { assertCanManageKnowledge, assertCanDelete } from "../auth/authorization";
import type { ProfileRecord } from "../auth/authorization";
import { ValidationError, NotFoundError, ConflictError } from "../shared/errors";
import { parsePagination, buildPaginationMeta } from "../shared/utils";
import type { Concept, ConceptFilter, CreateConceptInput, UpdateConceptInput } from "./types";

export class KnowledgeService {
  private repository: KnowledgeRepository;

  constructor(repository?: KnowledgeRepository) {
    this.repository = repository || new KnowledgeRepository();
  }

  async listConcepts(rawFilter: unknown = {}) {
    const parseResult = conceptFilterSchema.safeParse(rawFilter);
    if (!parseResult.success) {
      throw new ValidationError("Invalid knowledge filter parameters", {
        errors: parseResult.error.format(),
      });
    }

    const filter: ConceptFilter = { ...parseResult.data };
    const { page, limit } = parsePagination({ page: filter.page, limit: filter.limit });
    const { data, total } = await this.repository.findMany(filter);

    return {
      concepts: data,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  async getConceptBySlug(slug: string): Promise<Concept> {
    if (!slug) {
      throw new ValidationError("Concept slug is required.");
    }

    const concept = await this.repository.findBySlug(slug);
    if (!concept) {
      throw new NotFoundError("Knowledge concept", slug);
    }

    return concept;
  }

  async createConcept(rawInput: unknown, profile: ProfileRecord): Promise<Concept> {
    assertCanManageKnowledge(profile);

    const parseResult = createConceptSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid concept input payload", {
        errors: parseResult.error.format(),
      });
    }

    const input: CreateConceptInput = parseResult.data;

    const existing = await this.repository.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(`Concept with slug '${input.slug}' already exists.`);
    }

    const created = await this.repository.create(input);
    return created;
  }

  async updateConcept(id: string, rawInput: unknown, profile: ProfileRecord): Promise<Concept> {
    assertCanManageKnowledge(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Knowledge concept", id);
    }

    const parseResult = updateConceptSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid concept update payload", {
        errors: parseResult.error.format(),
      });
    }

    const input: UpdateConceptInput = parseResult.data;

    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await this.repository.findBySlug(input.slug);
      if (slugConflict && slugConflict.id !== id) {
        throw new ConflictError(`Concept with slug '${input.slug}' already exists.`);
      }
    }

    const updated = await this.repository.update(id, input);
    return updated;
  }

  async deleteConcept(id: string, profile: ProfileRecord): Promise<void> {
    assertCanDelete(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Knowledge concept", id);
    }

    await this.repository.delete(id);
  }
}
