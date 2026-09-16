# VictorOS — Domain Services Specification (Phase B)

## 1. Overview & Architecture

Domain Services form the core business logic layer of VictorOS. Following the architectural principle:
> **"Supabase stores VictorOS. Next.js thinks for VictorOS."**

Domain Services sit strictly between application boundaries (Server Actions & Route Handlers) and the data-access layer (Repositories). They ensure that business rules, invariants, validation, authorization checks, audit logging, and cache invalidation are uniformly applied regardless of whether an operation originated from a Server Action, an API route, or a background worker.

```text
┌────────────────────────────────────────────────────────┐
│             Application Interfaces Layer               │
│      Server Actions  │  HTTP Route Handlers (/api/v1)  │
└───────────────────────────┬────────────────────────────┘
                            │ Validated Input + Profile
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Domain Services Layer                  │
│                                                        │
│  ProjectService    ArticleService    LabService        │
│  KnowledgeService  MediaService                        │
│                                                        │
│  • Invariant & Schema Validation (Zod)                 │
│  • Authorization Assertions (Role-Based)               │
│  • Slug Uniqueness & Content Calculations              │
│  • Multi-entity & Relationship Orchestration           │
│  • Structured Audit Logging (logger.info)              │
│  • Cache Revalidation (revalidateContent & Tags)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Repositories Data Access                 │
│   ProjectRepository │ ArticleRepository │ LabRepo      │
│   KnowledgeRepo     │ MediaRepo                        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Domain Services

### 2.1 ProjectService (`src/lib/projects/service.ts`)

Encapsulates complete project lifecycle management, hierarchical sections, and relational metadata.

#### Key Capabilities:
- **Query & Filtering**: `listProjects(filter, profile)`
  - Automatically enforces visibility boundaries: unauthenticated or public viewers receive only `published` projects; editors and admins may view drafts and archived projects with status filters.
- **Slug-Based Retrieval**: `getProjectBySlug(slug, profile)` and `getProjectById(id, profile)`
  - Hydrates associative relations: tags, technologies, and media assets.
- **Publishing Workflow**: `publishProject(id, profile)` and `archiveProject(id, profile)`
  - Sets `published_at` timestamp on first publication.
  - Revalidates cache tags: `projects`, `project:<slug>`, and frontend routes `/projects` and `/projects/<slug>`.
- **Hierarchical Section Management**:
  - `createProjectSection`, `updateProjectSection`, `deleteProjectSection`, `reorderProjectSections`
  - Maintains strict sequential order indexing across narrative project sections.
- **Relational Metadata**:
  - `attachTag` / `detachTag`
  - `attachTechnology` / `detachTechnology`
  - `attachMedia` / `detachMedia`
- **Audit Logging**: Emits structured logs: `audit:project_created`, `audit:project_updated`, `audit:project_published`, `audit:project_archived`, `audit:project_deleted`.

---

### 2.2 ArticleService (`src/lib/articles/service.ts`)

Manages long-form engineering essays, technical articles, and architectural teardowns.

#### Key Capabilities:
- **Automated Metric Computation**:
  - Automatically counts words and calculates `reading_time_minutes` from article Markdown/MDX content (200 wpm baseline).
- **Draft & Publication Management**:
  - `createArticle`, `updateArticle`, `publishArticle`, `archiveArticle`, `deleteArticle`.
  - Ensures slug uniqueness across all articles.
  - Automatically sets `published_at` upon state transition to `published`.
- **Relational Associations**:
  - `attachTag` / `detachTag` (`article_tags`)
  - `attachTechnology` / `detachTechnology` (`article_technologies`)
  - `attachMedia` / `detachMedia` (`article_media`)
- **Cache & Audit**:
  - Tags: `articles`, `article:<slug>`.
  - Emits `audit:article_*` log events.

---

### 2.3 LabService (`src/lib/labs/service.ts`)

Governs experimental prototypes, interactive sandboxes, and research spikes.

#### Key Capabilities:
- **Experiment State Machine**:
  - Supports experiment statuses: `exploring`, `building`, `paused`, `completed`, `archived`, `active`, `experimental`.
  - `createLab`, `updateLab`, `archiveLab`, `deleteLab`.
- **Lab Media**:
  - `attachMedia` / `detachMedia` (`lab_media`) with roles (e.g. `preview`, `demo`, `screenshot`).
- **Cache & Audit**:
  - Tags: `labs`, `lab:<slug>`.
  - Paths: `/labs`, `/labs/<slug>`.

---

### 2.4 KnowledgeService (`src/lib/knowledge/service.ts`)

Powers VictorOS's second-brain knowledge graph, engineering mental models, and cross-domain conceptual connections.

#### Key Capabilities:
- **Concept Directory**:
  - `listConcepts`, `getConceptBySlug`, `getConceptById`, `createConcept`, `updateConcept`, `deleteConcept`.
- **Content-Concept Linking**:
  - Connects engineering concepts to any VictorOS content (`project`, `article`, or `lab`) via associative table `content_concepts`.
  - `attachContentConcept`, `detachContentConcept`, `getConceptsForContent`.
- **Knowledge Graph Relationships**:
  - Directional & non-directional graph edges (`concept_relationships`).
  - Types: `prerequisite_for`, `related_to`, `implements`, `contrasts_with`.
  - `linkConcepts`, `unlinkConcepts`, `getRelatedConcepts`.
- **Cache & Audit**:
  - Tags: `knowledge`, `concept:<slug>`.
  - Paths: `/knowledge`, `/knowledge/<slug>`.

---

### 2.5 MediaService (`src/lib/media/service.ts`)

Handles binary uploads, storage bucket integration, asset registry, and lifecycle cleanup.

#### Key Capabilities:
- **Binary Upload Pipeline**:
  - `uploadFile({ filename, mimeType, sizeBytes, buffer, bucket, altText }, profile)`
  - Streams binary data to Supabase Storage with unique timestamp keys.
  - Generates public URLs and persists asset records in `media_assets`.
- **Metadata Registration**:
  - `registerMedia(input, profile)` for registering externally hosted or pre-staged assets.
- **Safe Asset Deletion**:
  - `deleteMedia(id, profile)` removes both the Supabase Storage object and the database record.
- **Cache & Audit**:
  - Tags: `media`.

---

## 3. Cross-Cutting Design Patterns

### Error Handling & Invariant Enforcement
All services validate inputs via Zod schemas and throw domain-specific `AppError` subclasses:
- `ValidationError`: Malformed input or constraint failures.
- `AuthenticationError`: Missing active user session.
- `AuthorizationError`: Insufficient role permissions.
- `NotFoundError`: Target entity does not exist.
- `ConflictError`: Unique slug collision or relational duplicate.

### Cache Tag Invalidation
Services call `revalidateContent({ tags, paths })` upon mutation to ensure instant cache invalidation without requiring manual database webhooks.
