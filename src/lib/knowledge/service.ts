/**
 * VictorOS Knowledge Domain Service
 * Business logic and authorization for conceptual definitions and engineering mental models.
 */

import { KnowledgeRepository } from "./repository";
import {
  createConceptSchema,
  updateConceptSchema,
  conceptFilterSchema,
  attachContentConceptSchema,
  conceptRelationshipSchema,
} from "./schemas";
import { assertCanManageKnowledge, assertCanDelete } from "../auth/authorization";
import type { ProfileRecord } from "../auth/authorization";
import { ValidationError, NotFoundError, ConflictError } from "../shared/errors";
import { parsePagination, buildPaginationMeta } from "../shared/utils";
import { revalidateContent, CACHE_TAGS } from "../shared/revalidate";
import { logger } from "../shared/logger";
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

  async getConceptById(id: string): Promise<Concept> {
    if (!id) {
      throw new ValidationError("Concept ID is required.");
    }

    const concept = await this.repository.findById(id);
    if (!concept) {
      throw new NotFoundError("Knowledge concept", id);
    }

    return concept;
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

    logger.info("audit:concept_created", {
      conceptId: created.id,
      slug: created.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.KNOWLEDGE, CACHE_TAGS.CONCEPT(created.slug)],
      paths: ["/knowledge", `/knowledge/${created.slug}`],
    });

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

    logger.info("audit:concept_updated", {
      conceptId: updated.id,
      slug: updated.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.KNOWLEDGE, CACHE_TAGS.CONCEPT(existing.slug), CACHE_TAGS.CONCEPT(updated.slug)],
      paths: ["/knowledge", `/knowledge/${existing.slug}`, `/knowledge/${updated.slug}`],
    });

    return updated;
  }

  async deleteConcept(id: string, profile: ProfileRecord): Promise<void> {
    assertCanDelete(profile);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Knowledge concept", id);
    }

    await this.repository.delete(id);

    logger.info("audit:concept_deleted", {
      conceptId: id,
      slug: existing.slug,
      userId: profile.id,
      role: profile.role,
    });

    await revalidateContent({
      tags: [CACHE_TAGS.KNOWLEDGE, CACHE_TAGS.CONCEPT(existing.slug)],
      paths: ["/knowledge", `/knowledge/${existing.slug}`],
    });
  }

  // --- Content-Concept Associations ---

  async attachContentConcept(rawInput: unknown, profile: ProfileRecord): Promise<void> {
    assertCanManageKnowledge(profile);

    const parseResult = attachContentConceptSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid content-concept attachment", {
        errors: parseResult.error.format(),
      });
    }

    await this.repository.attachContentConcept(
      parseResult.data.content_type,
      parseResult.data.content_id,
      parseResult.data.concept_id
    );

    logger.info("audit:concept_attached_to_content", {
      contentType: parseResult.data.content_type,
      contentId: parseResult.data.content_id,
      conceptId: parseResult.data.concept_id,
      userId: profile.id,
    });
  }

  async detachContentConcept(
    contentType: "project" | "article" | "lab",
    contentId: string,
    conceptId: string,
    profile: ProfileRecord
  ): Promise<void> {
    assertCanManageKnowledge(profile);
    await this.repository.detachContentConcept(contentType, contentId, conceptId);
  }

  async getConceptsForContent(contentType: "project" | "article" | "lab", contentId: string) {
    if (!contentId) {
      throw new ValidationError("Content ID is required.");
    }
    return this.repository.findConceptsForContent(contentType, contentId);
  }

  // --- Concept-to-Concept Graph Relationships ---

  async linkConcepts(rawInput: unknown, profile: ProfileRecord): Promise<void> {
    assertCanManageKnowledge(profile);

    const parseResult = conceptRelationshipSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid concept relationship payload", {
        errors: parseResult.error.format(),
      });
    }

    if (parseResult.data.source_concept_id === parseResult.data.target_concept_id) {
      throw new ValidationError("Cannot link a concept to itself.");
    }

    await this.repository.linkConcepts(
      parseResult.data.source_concept_id,
      parseResult.data.target_concept_id,
      parseResult.data.relationship_type
    );

    logger.info("audit:concepts_linked", {
      source: parseResult.data.source_concept_id,
      target: parseResult.data.target_concept_id,
      type: parseResult.data.relationship_type,
      userId: profile.id,
    });
  }

  async unlinkConcepts(
    sourceConceptId: string,
    targetConceptId: string,
    profile: ProfileRecord
  ): Promise<void> {
    assertCanManageKnowledge(profile);
    await this.repository.unlinkConcepts(sourceConceptId, targetConceptId);
  }

  async getRelatedConcepts(conceptId: string) {
    if (!conceptId) {
      throw new ValidationError("Concept ID is required.");
    }
    return this.repository.findRelatedConcepts(conceptId);
  }
}
