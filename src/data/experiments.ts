import { Experiment } from "../types/experiment";

export const EXPERIMENTS: Experiment[] = [
  {
    id: "exp-07-football",
    number: "EXPERIMENT 07",
    title: "Football Intelligence & Monocular Pitch Reconstruction",
    status: "Exploring",
    category: "Computer Vision",
    hypothesis: "Can player performance kinematics and acceleration profiles be accurately synthesized from raw handheld phone video without multi-camera calibration?",
    currentState: "Prototype: Homography mapping yields ±0.18m metric pitch coordinates across 30fps amateur footage. Occlusion tracking during corner kicks is currently under stress test.",
    nextExperiment: "Build the first automated player scout ranking model based on kinematic burst frequencies rather than raw distance traveled.",
    tags: ["YOLOv9", "Homography", "Kinematics", "Scouting"],
    metrics: [
      { label: "Metric Error", value: "±0.18m" },
      { label: "Frame Rate", value: "60 FPS" },
      { label: "Player Recall", value: "94.2%" }
    ],
    snippet: {
      filename: "lab/homography_homing.py",
      language: "python",
      code: `# Realtime Homography Matrix Solver
def solve_pitch_homography(detected_corners, standard_pitch_pts):
    H, mask = cv2.findHomography(detected_corners, standard_pitch_pts, cv2.RANSAC, 5.0)
    return H`
    }
  },
  {
    id: "exp-08-vector-graph",
    number: "EXPERIMENT 08",
    title: "Graph-Augmented Vector Indices for Compound Thought",
    status: "Building",
    category: "AI & Graph Theory",
    hypothesis: "Will linking vector embeddings with an explicit bidirectional knowledge graph eliminate context hallucination when reasoning across multi-hop causal chains?",
    currentState: "Building: Evaluating neo4j vs. embedded SQLite graph schemas paired with 768-dim GTE embeddings. Multi-hop queries show 41% higher causal precision than flat vector kNN.",
    nextExperiment: "Benchmark graph traversal latency against raw HNSW queries under 100k node clusters.",
    tags: ["GraphRAG", "Knowledge Graphs", "Vector Embeddings", "Reasoning"],
    metrics: [
      { label: "Causal Precision", value: "+41%" },
      { label: "Traversal Hop", value: "3 levels" },
      { label: "P99 Query", value: "14ms" }
    ],
    snippet: {
      filename: "lab/graph_traversal.rs",
      language: "rust",
      code: `// Multi-hop edge traversal with semantic threshold
pub fn traverse_causal_neighborhood(node_id: &str, depth: usize, min_weight: f32) -> Vec<GraphNode> {
    // DFS with visited bitset and cosine similarity cutoff
    let mut frontier = vec![(node_id.to_string(), 0)];
    let mut collected = Vec::new();
    // ...
    collected
}`
    }
  },
  {
    id: "exp-09-zero-knowledge",
    number: "EXPERIMENT 09",
    title: "Lightweight ZK-SNARK State Verifier on Edge WASM",
    status: "Prototype",
    category: "Cryptography",
    hypothesis: "Can zero-knowledge proofs of client identity attributes be verified in browser WASM runtimes within 50 milliseconds without draining mobile battery?",
    currentState: "Prototype: Compiling Groth16 proof verifier into WebAssembly. In-browser verification executes in 38ms on modern mobile Safari.",
    nextExperiment: "Package into reusable NPM library with self-contained cryptographic curve params.",
    tags: ["Zero Knowledge", "WASM", "Groth16", "Privacy"],
    metrics: [
      { label: "WASM Time", value: "38ms" },
      { label: "Binary Size", value: "184KB" },
      { label: "Proof Size", value: "128 bytes" }
    ]
  },
  {
    id: "exp-10-actor-agents",
    number: "EXPERIMENT 10",
    title: "Sub-millisecond Actor Concurrency Engine in Go",
    status: "Building",
    category: "Distributed Systems",
    hypothesis: "Can lightweight Go coroutines using lock-free ring buffers support 1,000,000 concurrent reactive AI agent mailboxes on a single 8-core machine?",
    currentState: "Building: Reached 4.2M message dispatch events/sec across 250,000 active agents with 99th percentile mailbox wait time under 120 microseconds.",
    nextExperiment: "Implement distributed actor migration between nodes during network partition failovers.",
    tags: ["Go", "Actor Model", "Concurrency", "Lock-Free"],
    metrics: [
      { label: "Throughput", value: "4.2M ops/s" },
      { label: "Active Actors", value: "250,000" },
      { label: "P99 Wait", value: "120µs" }
    ]
  },
  {
    id: "exp-11-generative-ui",
    number: "EXPERIMENT 11",
    title: "Self-Hydrating Generative UI with Streaming Schemas",
    status: "Idea",
    category: "Interface Design",
    hypothesis: "Can AI assistants stream validated React tree components directly into active DOM slots with zero hydration mismatch and sub-100ms first paint?",
    currentState: "Idea: Drafting formal schema specification for streaming AST nodes with sandboxed client hooks.",
    nextExperiment: "Build prototype parser using JSON-Patch streams over HTTP chunked transfer.",
    tags: ["Generative UI", "React", "Streaming", "AST"]
  }
];
