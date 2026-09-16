# VictorOS — Application Interfaces Specification (Phase C)

## 1. Overview & Dual Interface Architecture

VictorOS exposes its core domain services through two complementary application interface patterns:
1. **Server Actions (`src/lib/actions/*`)**: High-performance, type-safe RPC endpoints for React Server Components and the upcoming VictorOS Command Center.
2. **REST Route Handlers (`src/lib/api/router.ts` mounted at `/api/v1/*`)**: Standard HTTP JSON endpoints for external consumers, automated integrations, and client-side fetching.

Both interface layers share identical underlying business logic, authorization policies, validation schemas, and error masking.

---

## 2. Server Actions Layer (`src/lib/actions/`)

All server actions are constructed using the `createSafeAction` higher-order wrapper (`src/lib/actions/safeAction.ts`).

### 2.1 The `createSafeAction` Harness
Every server action guarantees:
- **Authentication**: Checks for active session when `requireAuth: true`.
- **Role Authorization**: Enforces role constraints (e.g. `requireRole: ROLES.EDITOR` or `ROLES.ADMIN`).
- **Input Validation**: Validates arguments against strict Zod schemas before reaching domain services.
- **Safe Envelope**: Returns a uniform `ActionResponse<T>` tuple:
  ```typescript
  export interface ActionResponse<T> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
      statusCode: number;
      details?: unknown;
    };
  }
  ```
- **Audit Logging**: Emits structured execution metrics and traps exceptions safely.

### 2.2 Exported Server Actions

| Domain | Action Name | Auth Required | Min Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Projects** | `listProjectsAction` | No | None | List projects with filtering |
| | `getProjectAction` | No | None | Retrieve project by slug |
| | `getProjectByIdAction` | No | None | Retrieve project by ID |
| | `createProjectAction` | Yes | `editor` | Create project record |
| | `updateProjectAction` | Yes | `editor` | Update project fields |
| | `publishProjectAction` | Yes | `editor` | Transition to published state |
| | `archiveProjectAction` | Yes | `editor` | Transition to archived state |
| | `deleteProjectAction` | Yes | `admin` | Permanently delete project |
| | `createProjectSectionAction` | Yes | `editor` | Add narrative section |
| | `updateProjectSectionAction` | Yes | `editor` | Update narrative section |
| | `deleteProjectSectionAction` | Yes | `editor` | Delete narrative section |
| | `reorderProjectSectionsAction` | Yes | `editor` | Reorder sections |
| | `attachProjectTagAction` | Yes | `editor` | Attach tag relation |
| | `detachProjectTagAction` | Yes | `editor` | Detach tag relation |
| | `attachProjectTechnologyAction` | Yes | `editor` | Attach technology relation |
| | `detachProjectTechnologyAction` | Yes | `editor` | Detach technology relation |
| | `attachProjectMediaAction` | Yes | `editor` | Attach media relation |
| | `detachProjectMediaAction` | Yes | `editor` | Detach media relation |
| **Articles** | `listArticlesAction` | No | None | List articles with filtering |
| | `getArticleAction` | No | None | Retrieve article by slug |
| | `getArticleByIdAction` | No | None | Retrieve article by ID |
| | `createArticleAction` | Yes | `editor` | Create article record |
| | `updateArticleAction` | Yes | `editor` | Update article fields |
| | `publishArticleAction` | Yes | `editor` | Transition to published state |
| | `archiveArticleAction` | Yes | `editor` | Transition to archived state |
| | `deleteArticleAction` | Yes | `admin` | Permanently delete article |
| | `attachArticleTagAction` | Yes | `editor` | Attach tag relation |
| | `detachArticleTagAction` | Yes | `editor` | Detach tag relation |
| | `attachArticleTechnologyAction` | Yes | `editor` | Attach technology relation |
| | `detachArticleTechnologyAction` | Yes | `editor` | Detach technology relation |
| | `attachArticleMediaAction` | Yes | `editor` | Attach media relation |
| | `detachArticleMediaAction` | Yes | `editor` | Detach media relation |
| **Labs** | `listLabsAction` | No | None | List lab experiments |
| | `getLabAction` | No | None | Retrieve lab by slug |
| | `getLabByIdAction` | No | None | Retrieve lab by ID |
| | `createLabAction` | Yes | `editor` | Create new lab experiment |
| | `updateLabAction` | Yes | `editor` | Update lab experiment |
| | `archiveLabAction` | Yes | `editor` | Archive lab experiment |
| | `deleteLabAction` | Yes | `admin` | Permanently delete lab |
| | `attachLabMediaAction` | Yes | `editor` | Attach media asset |
| | `detachLabMediaAction` | Yes | `editor` | Detach media asset |
| **Knowledge** | `listConceptsAction` | No | None | List knowledge concepts |
| | `getConceptAction` | No | None | Retrieve concept by slug |
| | `getConceptByIdAction` | No | None | Retrieve concept by ID |
| | `createConceptAction` | Yes | `editor` | Create concept node |
| | `updateConceptAction` | Yes | `editor` | Update concept node |
| | `deleteConceptAction` | Yes | `admin` | Permanently delete concept |
| | `attachContentConceptAction` | Yes | `editor` | Link concept to project/article/lab |
| | `detachContentConceptAction` | Yes | `editor` | Unlink concept from content |
| | `getConceptsForContentAction` | No | None | Retrieve concepts for entity |
| | `linkConceptsAction` | Yes | `editor` | Link concept to concept (graph) |
| | `unlinkConceptsAction` | Yes | `editor` | Remove link between concepts |
| | `getRelatedConceptsAction` | No | None | Traverse related concepts |
| **Media** | `listMediaAction` | No | None | List media assets |
| | `getMediaByIdAction` | No | None | Retrieve media asset by ID |
| | `registerMediaAction` | Yes | `editor` | Register media asset |
| | `deleteMediaAction` | Yes | `admin` | Delete asset and storage object |

---

## 3. REST API Route Handlers (`/api/v1/*`)

Mounted on the backend server via `createBackendRouter()` (`src/lib/api/router.ts`).

### 3.1 Standard Response Envelopes

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with slug 'ai-football-scout' not found",
    "statusCode": 404
  }
}
```

### 3.2 Endpoint Summary

#### System
- `GET /api/v1/health` — System status, database connection, and environment feature flags.
- `GET /api/v1/auth/session` — Inspect current authentication and profile role.

#### Projects
- `GET /api/v1/projects` — Query projects with filters (`status`, `featured`, `search`, `page`, `limit`).
- `GET /api/v1/projects/:slug` — Full project detail with hydrated sections, tags, technologies, and media.
- `POST /api/v1/projects` — Create project [Editor].
- `PUT /api/v1/projects/:id` — Update project [Editor].
- `POST /api/v1/projects/:id/publish` — Publish project [Editor].
- `POST /api/v1/projects/:id/archive` — Archive project [Editor].
- `DELETE /api/v1/projects/:id` — Delete project [Admin].
- Sections:
  - `GET /api/v1/projects/:id/sections`
  - `POST /api/v1/projects/:id/sections` [Editor]
  - `PUT /api/v1/projects/sections/:sectionId` [Editor]
  - `DELETE /api/v1/projects/sections/:sectionId` [Editor]
  - `POST /api/v1/projects/:id/sections/reorder` [Editor]
- Relations:
  - `POST /api/v1/projects/:id/tags` / `DELETE /api/v1/projects/:id/tags/:tagId` [Editor]
  - `POST /api/v1/projects/:id/technologies` / `DELETE /api/v1/projects/:id/technologies/:techId` [Editor]
  - `POST /api/v1/projects/:id/media` / `DELETE /api/v1/projects/:id/media/:mediaAssetId` [Editor]

#### Articles
- `GET /api/v1/articles` — Query articles with filters (`status`, `featured`, `search`, `page`, `limit`).
- `GET /api/v1/articles/:slug` — Article detail with computed reading time, tags, technologies, and media.
- `POST /api/v1/articles` — Create article [Editor].
- `PUT /api/v1/articles/:id` — Update article [Editor].
- `POST /api/v1/articles/:id/publish` — Publish article [Editor].
- `POST /api/v1/articles/:id/archive` — Archive article [Editor].
- `DELETE /api/v1/articles/:id` — Delete article [Admin].
- Relations:
  - `POST /api/v1/articles/:id/tags` / `DELETE /api/v1/articles/:id/tags/:tagId` [Editor]
  - `POST /api/v1/articles/:id/technologies` / `DELETE /api/v1/articles/:id/technologies/:techId` [Editor]
  - `POST /api/v1/articles/:id/media` / `DELETE /api/v1/articles/:id/media/:mediaAssetId` [Editor]

#### Labs
- `GET /api/v1/labs` — List labs with status and tech filters.
- `GET /api/v1/labs/:slug` — Lab experiment details and media.
- `POST /api/v1/labs` — Create experiment [Editor].
- `PUT /api/v1/labs/:id` — Update experiment [Editor].
- `POST /api/v1/labs/:id/archive` — Archive experiment [Editor].
- `DELETE /api/v1/labs/:id` — Delete experiment [Admin].
- `POST /api/v1/labs/:id/media` / `DELETE /api/v1/labs/:id/media/:mediaAssetId` [Editor].

#### Knowledge
- `GET /api/v1/knowledge` — List concepts with search and category filters.
- `GET /api/v1/knowledge/:slug` — Concept detail.
- `POST /api/v1/knowledge` — Create concept [Editor].
- `PUT /api/v1/knowledge/:id` — Update concept [Editor].
- `DELETE /api/v1/knowledge/:id` — Delete concept [Admin].
- Content Links:
  - `GET /api/v1/knowledge/content/:type/:id` — Concepts attached to content.
  - `POST /api/v1/knowledge/content` [Editor] — Attach concept to content.
  - `DELETE /api/v1/knowledge/content/:type/:id/:conceptId` [Editor] — Detach concept.
- Graph Relationships:
  - `GET /api/v1/knowledge/:id/related` — Related concepts graph edges.
  - `POST /api/v1/knowledge/relationships` [Editor] — Create relationship.
  - `DELETE /api/v1/knowledge/relationships/:sourceId/:targetId` [Editor] — Remove relationship.

#### Media
- `GET /api/v1/media` — List assets with bucket, mime type, and search filters.
- `GET /api/v1/media/:id` — Media asset metadata.
- `POST /api/v1/media` — Register media asset [Editor].
- `DELETE /api/v1/media/:id` — Delete media asset and storage object [Admin].

---

## 4. Integration Guidelines for Future Command Center

When building the Command Center UI in future phases:
1. **Direct RPC in React Components**:
   ```typescript
   import { publishProjectAction } from "@/lib/actions/projects";

   const handlePublish = async (projectId: string) => {
     const res = await publishProjectAction({ id: projectId });
     if (!res.success) {
       toast.error(res.error?.message);
       return;
     }
     toast.success("Project published!");
   };
   ```
2. **Deterministic Security**: All authorization assertions happen on the server. The UI cannot bypass validation, permissions, or audit logs.
3. **Cache Coherency**: Actions automatically trigger cache revalidation tags so public views update immediately upon publication.
