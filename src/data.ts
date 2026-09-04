import { FocusItem, Project, Post, SystemBlueprint } from "./types";

export const FOCUS_ITEMS: FocusItem[] = [
  {
    id: "go-agents",
    category: "Building",
    title: "Autonomous Agent Framework in Go",
    icon: "terminal",
    shortDescription: "Surgical, concurrent actor-based architecture for deploying reactive AI agents at scale.",
    longDescription: "Building a high-throughput framework inspired by Akka and ProtoActor, engineered purely in Go. This framework manages millions of reactive agent life-cycles, schedules lightweight coroutines with state synchronization, and supports message passing with sub-millisecond latencies.",
    statusLogs: [
      "Initialized engine context with Go 1.22 coroutine channels",
      "Completed prototype for actor mailbox lock-free ring buffer",
      "Benchmarked state transition throughput: 4.2M events/sec",
      "Integrating local SQLite boundary state WAL checkpointing"
    ],
    snippet: {
      language: "go",
      filename: "actor/mailbox.go",
      code: `package actor

type Mailbox struct {
    queue    chan Message
    receiver Receiver
}

func NewMailbox(capacity int, rx Receiver) *Mailbox {
    return &Mailbox{
        queue:    make(chan Message, capacity),
        receiver: rx,
    }
}

func (m *Mailbox) Loop(ctx Context) {
    for {
        select {
        case msg := <-m.queue:
            err := m.receiver.Receive(ctx, msg)
            if err != nil {
                ctx.Log("error processing message: %v", err)
            }
        case <-ctx.Done():
            return
        }
    }
}`
    }
  },
  {
    id: "consensus-learning",
    category: "Learning",
    title: "Distributed Systems Consensus",
    icon: "school",
    shortDescription: "Grokking formal correctness proofs of Raft and Multi-Paxos variants under net partitions.",
    longDescription: "Deeply researching consensus systems, especially looking at leadership election optimizations, membership changes, and logs compaction safety. Reimplementing a toy Raft cluster in Go, complete with a network simulator to induce packet drop and brain-split scenarios.",
    statusLogs: [
      "Passed validation checks on Leader Election in isolation",
      "Implementing log verification over un-ordered RPC channels",
      "Running TLA+ core state verification proofs",
      "Injecting artificial latency to gauge split-vote resolution"
    ],
    snippet: {
      language: "go",
      filename: "raft/consensus.go",
      code: `package raft

// RequestVoteArgs represents RequestVote RPC arguments
type RequestVoteArgs struct {
    Term         int // candidate's term
    CandidateID  string // candidate requesting vote
    LastLogIndex int // index of candidate's last log entry
    LastLogTerm  int // term of candidate's last log entry
}

// RequestVoteReply represents RequestVote RPC response
type RequestVoteReply struct {
    Term        int  // currentTerm, for candidate to update itself
    VoteGranted bool // true means candidate received vote
}`
    }
  },
  {
    id: "ddia-reading",
    category: "Reading",
    title: "Designing Data-Intensive Apps",
    icon: "menu_book",
    shortDescription: "Re-examining SSTables, LSM-trees, and B-Tree read amplification characteristics under load.",
    longDescription: "Analyzing Martin Kleppmann's authoritative text for the third time, with heavy emphasis on partition algorithms and physical data structures. Simulating read/write amplification metrics to optimize storage engines for low-latency retrieval.",
    statusLogs: [
      "Completed workbook entries on LSM-Tree MemTable flushing flow",
      "Diagramming write path: Commit Log -> MemTable -> SSTable Segment",
      "Modeling Bloom Filter collision rates under heavy writing workloads",
      "Comparing isolation levels: Clean Read vs. Snapshot Isolation"
    ]
  },
  {
    id: "generative-ui",
    category: "Exploring",
    title: "Generative UI with Vercel AI SDK",
    icon: "explore",
    shortDescription: "Streaming interactive React nodes directly from LLM server tool invocation.",
    longDescription: "Investigating modern UI engineering boundaries. Rendering functional server components directly into current chat flows based on schema responses. Building custom rendering containers for dynamic layout structures.",
    statusLogs: [
      "Set up Vite middleware server callback protocols",
      "Created dynamic component loader with Radix primitives",
      "Benchmarked component injection render latency: 120ms",
      "Implementing client-side hydration for generated charts"
    ],
    snippet: {
      language: "typescript",
      filename: "ai/generative-ui.tsx",
      code: `import { createAI, getMutableAIState } from 'ai/rsc';

export const submitUserMessage = async (content: string) => {
  'use server';
  
  const aiState = getMutableAIState<typeof AI>();
  aiState.update([...aiState.get(), { role: 'user', content }]);
  
  // Dynamically yield React components matching tool schemas
  return {
    id: Date.now(),
    role: 'assistant',
    display: <InteractiveSystemNode />
  };
};`
    }
  }
];

export const PROJECTS: Project[] = [
  {
    id: "ai-football-scout",
    title: "AI Football Scout",
    subtitle: "Computer vision analysis & recruit intelligence",
    category: "Machine Learning Pipeline",
    version: "v2.1.0",
    icon: "sports_soccer",
    problem: "Manual scouting for lower divisions is biased, labor-intensive, and ignores non-professional footage.",
    system: "An automated computer vision model that ingests amateur game recordings, detects player tracking coordinates, calculates speed profiles, and runs statistical clustering to uncover overlooked prospects.",
    details: "Using YOLO and Custom CNNs to process 30fps broadcasts or low-resolution phone recordings. Player tracking is extracted into dynamic coordinate traces. A local regression model standardizes performance vectors against elite division benchmarks, outputting talent reports.",
    architectureNodes: [
      { id: "raw-video", label: "Broadcast/Mobile Match Video", role: "input", x: 10, y: 30 },
      { id: "yolo-detect", label: "YOLO v9 Player Detection", role: "process", x: 40, y: 15 },
      { id: "coordinate-tracking", label: "DeepSORT Tracking Vectors", role: "process", x: 40, y: 50 },
      { id: "normalize-benchmark", label: "Talent Benchmarker", role: "process", x: 70, y: 30 },
      { id: "scout-report", label: "Recruit Recommendation", role: "output", x: 90, y: 30 }
    ],
    architectureLines: [
      { from: "raw-video", to: "yolo-detect" },
      { from: "raw-video", to: "coordinate-tracking" },
      { from: "yolo-detect", to: "normalize-benchmark" },
      { from: "coordinate-tracking", to: "normalize-benchmark" },
      { from: "normalize-benchmark", to: "scout-report", active: true }
    ],
    url: "#"
  },
  {
    id: "tukokadi",
    title: "TukoKadi",
    subtitle: "Unified payments interface for East Africa",
    category: "Fintech Infrastructure",
    version: "LIVE",
    icon: "account_balance_wallet",
    problem: "East African merchants are stranded by fragmented mobile money rails, complex double-spend bugs, and manual recon cycles.",
    system: "A scalable payments API gateway that unifies M-Pesa, Airtel Money, and local commercial banking systems under a highly resilient, transaction-safe API ledger.",
    details: "Built in Go with high concurrency. Employs a robust double-commit ledger system, ensuring zero double-spends even under cluster failover. Serves over 2,000 requests/sec with active circuit-breakers managing telco API downtimes.",
    architectureNodes: [
      { id: "merchant-checkout", label: "Merchant Mobile SDK", role: "input", x: 10, y: 30 },
      { id: "gateway-balancer", label: "Go API Router (Round-Robin)", role: "process", x: 35, y: 30 },
      { id: "safari-ledgers", label: "M-Pesa API Handler", role: "process", x: 65, y: 15 },
      { id: "airtel-ledgers", label: "Airtel API Handler", role: "process", x: 65, y: 50 },
      { id: "durable-ledger", label: "Durable Double-Entry Ledger", role: "process", x: 80, y: 30 },
      { id: "receipt-dis", label: "Webhooks Dispatcher", role: "output", x: 95, y: 30 }
    ],
    architectureLines: [
      { from: "merchant-checkout", to: "gateway-balancer" },
      { from: "gateway-balancer", to: "safari-ledgers" },
      { from: "gateway-balancer", to: "airtel-ledgers" },
      { from: "safari-ledgers", to: "durable-ledger" },
      { from: "airtel-ledgers", to: "durable-ledger" },
      { from: "durable-ledger", to: "receipt-dis", active: true }
    ],
    url: "#"
  },
  {
    id: "raft-consensus-engine",
    title: "GoRaft Engine",
    subtitle: "Distributed consensus engine for critical state machines",
    category: "Distributed Systems",
    version: "v0.8.4",
    icon: "dns",
    problem: "Achieving strict transactional state replication across highly erratic multi-region networks prone to silent data drops.",
    system: "A consensus replication library implemented in custom Go which maintains an active lock-free write-ahead log under state partition faults.",
    details: "Engineered a low-overhead RPC protocol for heartbeat tracking and candidate votings. Leverages randomized timer boundaries to avoid split-vote contention, processing millions of consensus state messages with zero log deviation.",
    architectureNodes: [
      { id: "client-request", label: "Client Request Input", role: "input", x: 10, y: 30 },
      { id: "leader-node", label: "Raft Leader Node", role: "process", x: 45, y: 15 },
      { id: "follower-1", label: "Follower Replica A", role: "process", x: 45, y: 50 },
      { id: "consensus-commit", label: "Consensus Commit Barrier", role: "process", x: 75, y: 30 },
      { id: "durable-state", label: "State Machine Store", role: "output", x: 92, y: 30 }
    ],
    architectureLines: [
      { from: "client-request", to: "leader-node" },
      { from: "leader-node", to: "follower-1" },
      { from: "leader-node", to: "consensus-commit" },
      { from: "follower-1", to: "consensus-commit" },
      { from: "consensus-commit", to: "durable-state", active: true }
    ],
    url: "#"
  },
  {
    id: "semantic-indexer",
    title: "Cognitive Indexer",
    subtitle: "Hybrid BM25 + Dense vector database pipeline",
    category: "AI / Search Infrastructure",
    version: "v1.5.0",
    icon: "search",
    problem: "Traditional indexing pipelines fail to maintain semantic boundaries when slicing rich visual PDFs or nested markdown document maps.",
    system: "An intelligent, multi-stage document ingest pipeline that enforces smart markdown-oriented boundaries and runs hybrid candidate retrieval.",
    details: "Formulates sparse keyword metrics alongside Cohere neural text embeddings which feeds into an optimized vector re-ranking analyzer. Decreases token bloat by 55% while dropping hallucination risks significantly.",
    architectureNodes: [
      { id: "document-source", label: "Raw Document Stream", role: "input", x: 10, y: 30 },
      { id: "parser-chunker", label: "Semantic Boundary Slicer", role: "process", x: 40, y: 15 },
      { id: "hybrid-embedder", label: "BM25 + Semantic Vectorizer", role: "process", x: 40, y: 50 },
      { id: "rerank-filter", label: "Cross-Encoder Re-ranker", role: "process", x: 70, y: 30 },
      { id: "context-llm", label: "Scored Grounding Payload", role: "output", x: 92, y: 30 }
    ],
    architectureLines: [
      { from: "document-source", to: "parser-chunker" },
      { from: "document-source", to: "hybrid-embedder" },
      { from: "parser-chunker", to: "rerank-filter" },
      { from: "hybrid-embedder", to: "rerank-filter" },
      { from: "rerank-filter", to: "context-llm", active: true }
    ],
    url: "#"
  }
];

export const POSTS: Post[] = [
  {
    id: "ai-research-rag",
    title: "Frontiers in Neural RAG & Multi-Vector Indices",
    category: "AI Research",
    date: "JUN 2024",
    readTime: "9 min read",
    summary: "How chunk size, hierarchical overlapping trees, and dense embedding models resolve context degradation in high-isolation private knowledge clusters.",
    content: `## The Recall Bottleneck in Generative AI

When feeding proprietary knowledge maps into Large Language Models, simple character-based slicing fails to preserve programmatic intent. Slicing complex tables or structural bullet maps in half results in semantic entropy, culminating in high hallucination thresholds.

To secure complete contextual fidelity, our index processes files through unified semantic boundary detectors, dual hybrid embeddings, and neural cross-encoders.

### 1. Hierarchical Recursive Tree Chunking

Instead of raw character-limit splitters, we construct nested multi-level document partitions. Parent blocks retain broad overarching context while child chunks target fine-grained operational parameters.

- **Markdown-Aware Borders**: Sentences are grouped using natural layout tags (\`##\`, \`###\`, \`-\`, \`> \`) to ensure adjacent tables or lists are never severed.
- **Overlapping Tokens**: An active 15%-25% sequence overlay factor safeguards document edges during embedding vector extraction.
- **Sentence-Window Retrievals**: The backend query engine pulls high-precision 256-token child nodes from the vector pool, but dynamically pads them into 1024-token parent blocks before presenting them to the inference pipeline.

### 2. Hybrid Sparse-Dense Vector Coexistence

Relying entirely on standard vector dot-products is a major vulnerability. Specific technical keywords (like product serial IDs, specific code elements, or names) are regularly washed out by semantic embeddings. Combining semantic vectors alongside robust BM25 keyword indices yields exceptional factual accuracy:

$$\\text{Combined Retrieval Score} = \\alpha \\cdot \\text{Dense Similarity} + (1 - \\alpha) \\cdot \\text{BM25 Sparse Score}$$

Typically, setting $\\alpha = 0.75$ optimizes retrieval paths for rich documentation.

### 3. Cross-Encoder Re-Ranking Pipeline

Sending 50 documents straight to the LLM context envelope results in massive latency penalties and runs into the infamous "Lost in the Middle" syndrome. The model prioritizes information at the extreme boundaries, neglecting critical details in the middle.

We introduce a middle-tier cross-encoder stage:
1. Fetch 50 candidate records via standard hybrid querying.
2. Route candidate tuples to a local fine-tuned cross-encoder model to score explicit relevance.
3. Keep only the top 6-8 matching chunks for final generative grounding.
`
  },
  {
    id: "nation-building-enclaves",
    title: "Architecting Resilient Digital Enclaves for Nation Building",
    category: "Nation Building",
    date: "MAR 2024",
    readTime: "12 min read",
    summary: "Leveraging decentralized Ledger Structures and high-isolation computing enclaves to secure foundational state identity networks.",
    content: `## The Sovereignty Threat to Core Identifiers

Traditional state registries relying on single-database centers or insecure legacy mainframes are vulnerable to cyber disruption, unauthorized espionage, and physical compromise. Building modern, resilient national infrastructure requires a radical rethinking of identity security.

Sovereign state records call for highly isolated distributed systems that run cryptographic signatures, secure hardware-level enclaves, and partition-tolerant ledger sync.

### 1. Hardware-Isolated Cryptographic Enclaves

We deploy foundational data nodes within hardware-shielded secure enclaves (such as Intel SGX or AWS Nitro Enclaves). These enclaves isolate state computations, keeping secrets encrypted even from the host operating system.

- **Zero-Trust Memory boundaries**: Process memory registers are encrypted at the CPU level with instant hardware key cycling.
- **Attestation Frameworks**: Each enclave performs self-attestation before participating in ledger replication, proving that no unauthorized software or kernel alterations exist.

### 2. Peer-to-Peer State Ledger Replication

Identity records are replicated across high-isolation federal nodes using a custom Byzantine Fault Tolerant (BFT) consensus structure. The network survives even under active compromises:

$$\\text{Fault Tolerance Limit } F = \\lfloor \\frac{N - 1}{3} \\rfloor$$

If less than one-third of regional nodes are corrupted or experiencing power outages, the integrity of the state ledger remains completely uncompromised. This structure guarantees that no power grid failure or foreign actor can rewrite historical citizen registries or land distribution charts.

### 3. Citizen-Owned Cryptographic Wallets

Citizens carry self-sovereign keys residing on hardware-level chips within mobile devices. No centralized bureau holds master secrets. Decoupling citizen credentials from static global records lets individuals authorize selective proof vectors (such as proving they are over 18 without disclosing their specific birth year) through zero-knowledge proofs (ZKP).
`
  },
  {
    id: "opinionated-design-systems",
    title: "Opinionated Architecture & High-Contrast Design Systems",
    category: "Product Design",
    date: "JAN 2024",
    readTime: "7 min read",
    summary: "Why excessive UI customization slows product velocity. Crafting interfaces using deep negative space, strong typography, and constraints.",
    content: `## Over-Configuration is a Product Anti-Pattern

As product designers and engineers, we are drawn to flexibility. We love designing multiple themes, exposing complex layout sliders, and building hundreds of modular color palettes to satisfy every edge user request.

However, unrestrained design optionality is a double-edged sword. Every toggle is an added branch of structural state complexity. It introduces massive cognitive clutter for users and slows downstream iteration cycles.

Great software is built around highly opinionated, beautiful, and non-negotiable defaults.

### 1. The Power of Aesthetic Constraints

Conventions and limits eliminate decision-making friction:
- **Unified Grids**: We lock view layouts into strict mathematical grids, ensuring every paragraph and card is anchored with absolute geometric intent.
- **Typography as Structure**: Instead of relying on dividers, borders, and margins, we let high-contrast type scales guide hierarchy. A bold, letter-spaced Space Grotesk header paired with JetBrains Mono communicates division without visual noise.
- **Micro-interactions with Purpose**: Avoid gratuitous animations. Transitions must serve a physical purpose—guiding a user's eyes naturally from an input click to an active result state.

### 2. High-Contrast Slate Palette Strategy

A high-contrast light or dark theme (such as our custom off-black canvas with indigo-washed lines) forces an interface to be highly readable.

1. **Focus State Isolation**: The primary backdrop stays uncluttered, while active controls utilize glowing borders or fine-line drawings to highlight interactable bounds.
2. **Eliminating Aesthetic Noise**: Drop-shadows, glossy buttons, and heavy gradients are stripped in favor of sharp, architectural geometry.
3. **Responsive Density**: On desktop, we avoid stretching containers infinitely. Instead, we use elegant centered framing with bento grids to establish a logical reading flow.
`
  },
  {
    id: "football-analytics-kinematics",
    title: "High-Velocity Player Kinematics & Computer Vision in Football",
    category: "Football Analytics",
    date: "NOV 2023",
    readTime: "10 min read",
    summary: "Translating broadcast frames into real-time tracking data: using speed profiles and spatial clustering to discover lower-tier academy prospects.",
    content: `## The Scouting Revolution Beyond the Mainstream

Modern professional sport is swimming in telemetry. However, lower divisions and youth academies remain highly overlooked due to the prohibitive hardware costs of wear-able GPS trackers and specialized multi-camera arrays.

We build lightweight computer vision pipelines that extract professional-grade player kinematics from standard raw broadcast and smartphone recordings.

### 1. Monocular Player Tracking and Localization

Using fine-tuned YOLO architectures alongside SORT tracking, our pipeline isolates players and translates their raw bounding-box movements into coordinates on a virtual scale field model.

- **Perspective Homography Matrices**: We detect key field markers (corners, boxes, center circle) to map 2D pixel coordinates directly into absolute metrics.
- **Speed & Accel Slicing**: Velocity matrices are computed by tracking delta distances over rolling frame blocks:

$$v(t) = \\frac{x(t + \\Delta t) - x(t)}{\\Delta t}$$

These vectors detect hidden physical assets, such as high acceleration rates in early meters or intense lateral agility during pressing transitions.

### 2. Density Cluster Analysis for Formations

By grouping player coordinates over long sequences, we identify tactical spatial trends using unsupervised clustering:
1. **Centroid Computations**: We extract the geometric centers of pressing lines to track team compactness.
2. **Voronoi Diagram Maps**: Dynamic Voronoi polygons calculate real-time spatial dominance, revealing which players are most efficient at creating or finding passing lanes.
3. **Outlier Detection**: The clustering models compare prospects against established professional player models, highlighting players who out-perform their budget benchmarks.
`
  }
];

// Initial default blueprint shown in the node editor
export const DEFAULT_BLUEPRINT: SystemBlueprint = {
  name: "Football CV Analytics Pipeline",
  description: "Processes raw matches under CV models, extracting player acceleration vectors to benchmark recruits.",
  nodes: [
    { id: "feed", label: "Match Broadcast (RTMP)", role: "input", description: "Streams raw soccer footage at 30/60 FPS", x: 10, y: 30 },
    { id: "detect", label: "YOLO Tracker", role: "process", description: "Performs real-time player/ball localization & bounding", x: 40, y: 15 },
    { id: "pose", label: "Pose Analyzer", role: "process", description: "Extracts kinematic keypoints & joint paths", x: 40, y: 50 },
    { id: "align", label: "Benchmarker Engine", role: "process", description: "Standardizes player speeds and metrics against comparative database indices", x: 70, y: 35 },
    { id: "output", label: "Scout Reports", role: "output", description: "Produces final player scouting dossiers with charts", x: 92, y: 35 }
  ],
  lines: [
    { from: "feed", to: "detect" },
    { from: "feed", to: "pose" },
    { from: "detect", to: "align" },
    { from: "pose", to: "align" },
    { from: "align", to: "output", active: true }
  ]
};
