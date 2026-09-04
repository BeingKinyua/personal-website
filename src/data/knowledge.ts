import { KnowledgeNode, KnowledgeEdge } from "../types/knowledge";

export const KNOWLEDGE_NODES: KnowledgeNode[] = [
  {
    id: "ai-systems",
    label: "Compound AI Systems",
    type: "concept",
    category: "AI & ML",
    level: "Advanced",
    description: "Architecting reliable intelligence through deterministic state machines, specialized models, and strict evaluation harnesses rather than monolithic prompts.",
    connections: ["llms", "rag-architecture", "evals"],
    relatedProjects: ["nyayo", "vector-flow"],
    relatedArticles: ["ai-engineering-production"]
  },
  {
    id: "llms",
    label: "Large Language Models",
    type: "technology",
    category: "AI & ML",
    level: "Applied",
    description: "Transformers, attention mechanisms, token economics, context window management, and structured JSON generation.",
    connections: ["ai-systems", "rag-architecture", "python"],
    relatedProjects: ["nyayo", "vector-flow"],
    relatedArticles: ["ai-engineering-production"]
  },
  {
    id: "rag-architecture",
    label: "Retrieval-Augmented Generation",
    type: "concept",
    category: "AI & ML",
    level: "Advanced",
    description: "Hybrid dense-sparse vector indexing, reciprocal rank fusion, AST chunking, and neural cross-encoder re-ranking.",
    connections: ["ai-systems", "vector-databases", "llms"],
    relatedProjects: ["vector-flow"],
    relatedArticles: ["ai-research-rag", "ai-engineering-production"]
  },
  {
    id: "vector-databases",
    label: "Vector Indexing & HNSW",
    type: "technology",
    category: "Data & Storage",
    level: "Applied",
    description: "Hierarchical Navigable Small World graphs, inverted file indices, SIMD distance acceleration, and pgvector.",
    connections: ["rag-architecture", "rust", "distributed-consensus"],
    relatedProjects: ["vector-flow"]
  },
  {
    id: "distributed-consensus",
    label: "Distributed Consensus & Raft",
    type: "concept",
    category: "Systems & Infrastructure",
    level: "Advanced",
    description: "Leader election, log replication, safety invariants, TLA+ formal verification, and surviving network partitions.",
    connections: ["go-concurrency", "storage-engines", "vector-databases"],
    relatedProjects: ["goraft-consensus", "tukokadi"]
  },
  {
    id: "storage-engines",
    label: "LSM-Trees & SSTables",
    type: "concept",
    category: "Data & Storage",
    level: "Advanced",
    description: "MemTables, write-ahead logging (WAL), Bloom filters, Leveled compaction algorithms, and read/write amplification.",
    connections: ["distributed-consensus", "go-concurrency"],
    relatedArticles: ["data-intensive-architecture"]
  },
  {
    id: "go-concurrency",
    label: "Go Actor & Goroutine Concurrency",
    type: "technology",
    category: "Systems & Infrastructure",
    level: "Applied",
    description: "Lock-free ring buffers, coroutine channel scheduling, memory-zero alloc HTTP routing, and high-throughput actor models.",
    connections: ["distributed-consensus", "storage-engines"],
    relatedProjects: ["goraft-consensus", "tukokadi"]
  },
  {
    id: "python",
    label: "Python & PyTorch",
    type: "technology",
    category: "AI & ML",
    level: "Applied",
    description: "Tensor manipulation, model training, computer vision pipelines, OpenCV, and TensorRT deployment.",
    connections: ["computer-vision", "llms"],
    relatedProjects: ["football-intelligence"]
  },
  {
    id: "computer-vision",
    label: "Computer Vision & Kinematics",
    type: "concept",
    category: "AI & ML",
    level: "Applied",
    description: "Object detection with YOLOv9, monocular perspective homography, Kalman tracking filters, and acceleration vector extraction.",
    connections: ["python"],
    relatedProjects: ["football-intelligence"],
    relatedArticles: ["football-analytics-kinematics"]
  },
  {
    id: "rust",
    label: "Rust Systems Engineering",
    type: "technology",
    category: "Systems & Infrastructure",
    level: "Applied",
    description: "Memory safety without garbage collection, borrow checker paradigms, SIMD optimizations, and WebAssembly compilation.",
    connections: ["vector-databases", "zero-knowledge"]
  },
  {
    id: "zero-knowledge",
    label: "Zero-Knowledge Cryptography",
    type: "concept",
    category: "Systems & Infrastructure",
    level: "Advanced",
    description: "zk-SNARKs, Groth16 proof verifiers, arithmetic circuits, self-sovereign identity, and client-side privacy boundaries.",
    connections: ["rust"],
    relatedArticles: ["nation-building-enclaves"]
  },
  {
    id: "book-ddia",
    label: "Designing Data-Intensive Applications",
    type: "book",
    category: "Data & Storage",
    level: "Foundational",
    description: "Author: Martin Kleppmann. Key study on replication, partitioning, transactions, and distributed systems batch/stream processing.",
    connections: ["storage-engines", "distributed-consensus"],
    readingOrCourse: {
      author: "Martin Kleppmann",
      progress: "100% (3rd read-through)",
      keyTakeaway: "Reliability is continuing to work correctly even when things go wrong. Build around immutable append-only logs."
    },
    relatedArticles: ["data-intensive-architecture"]
  },
  {
    id: "book-crafting-interpreters",
    label: "Crafting Interpreters",
    type: "book",
    category: "Systems & Infrastructure",
    level: "Advanced",
    description: "Author: Robert Nystrom. Deep study of tree-walk parsers, bytecode virtual machines, and garbage collectors.",
    connections: ["rust", "go-concurrency"],
    readingOrCourse: {
      author: "Robert Nystrom",
      progress: "Completed",
      keyTakeaway: "Compilers turn messy human intent into exact mechanical instruction sequences. Precision at the AST boundary is paramount."
    }
  },
  {
    id: "book-systems-thinking",
    label: "Thinking in Systems: A Primer",
    type: "book",
    category: "Product & Design",
    level: "Foundational",
    description: "Author: Donella H. Meadows. Feedback loops, stock-and-flow dynamics, leverage points, and non-linear causal behavior.",
    connections: ["ai-systems", "design-engineering"],
    readingOrCourse: {
      author: "Donella H. Meadows",
      progress: "Completed",
      keyTakeaway: "You cannot control a system; you can only dance with it. Find the highest leverage intervention points."
    }
  },
  {
    id: "design-engineering",
    label: "Design Engineering & Systems",
    type: "concept",
    category: "Product & Design",
    level: "Applied",
    description: "Strict typographic mathematical scales, restrained high-contrast visual systems, micro-motion physics, and zero-clutter ergonomics.",
    connections: ["ai-systems"],
    relatedArticles: ["opinionated-design-systems"]
  }
];

export const KNOWLEDGE_EDGES: KnowledgeEdge[] = [
  { source: "ai-systems", target: "llms", relationship: "coordinates" },
  { source: "ai-systems", target: "rag-architecture", relationship: "utilizes" },
  { source: "rag-architecture", target: "vector-databases", relationship: "queries" },
  { source: "vector-databases", target: "rust", relationship: "implemented in" },
  { source: "distributed-consensus", target: "go-concurrency", relationship: "modeled in" },
  { source: "distributed-consensus", target: "storage-engines", relationship: "commits to" },
  { source: "computer-vision", target: "python", relationship: "implemented in" },
  { source: "book-ddia", target: "storage-engines", relationship: "formalizes" },
  { source: "book-ddia", target: "distributed-consensus", relationship: "analyzes" },
  { source: "design-engineering", target: "ai-systems", relationship: "human interface" }
];
