import { Project } from "../types/project";

export const PROJECTS: Project[] = [
  {
    id: "nyayo",
    slug: "nyayo",
    number: "01",
    title: "NYAYO",
    subtitle: "A discipleship platform designed around knowing Christ and faithfully following Him.",
    category: "AI & Platform Engineering",
    featured: true,
    version: "v1.4.0",
    technologies: ["NEXT.JS", "SUPABASE", "AI / LLM", "TYPESCRIPT", "TAILWIND"],
    problem: "Modern faith communities struggle with fragmented spiritual growth pathways, inconsistent discipleship check-ins, and lack of personalized theological reflection tools.",
    system: "A unified discipleship platform combining structured scripture study modules, intelligent contextual reflection prompts, community mentor check-ins, and local-first progress synchronization.",
    details: "Architected around edge-rendered Next.js with Supabase Postgres row-level security. Features personalized spiritual habit telemetry, AI-assisted scripture commentary grounding with strict doctrinal guardrails, and real-time community fellowship groups.",
    metrics: [
      { label: "Active Cohorts", value: "24", detail: "Spiritual discipleship groups" },
      { label: "Reflection Latency", value: "<180ms", detail: "Edge AI commentary synthesis" },
      { label: "Engagement Rate", value: "88%", detail: "Weekly consistent study streaks" }
    ],
    deepDive: {
      overview: "NYAYO (meaning 'Footsteps' in Swahili) was created to bridge digital convenience and reverent, deep discipleship. Rather than superficial gamification, it focuses on contemplative scripture engagement, accountability circles, and grounded biblical wisdom.",
      problem: "Traditional church groups rely on disparate WhatsApp chats, printed study binders, and irregular meetings. Users report losing momentum within 3 weeks. Furthermore, generic search engines surface misleading or polarizing commentary when seekers ask sincere questions about hard scriptures.",
      research: "Conducted field interviews with 40+ small group facilitators and seminary educators. Core takeaway: believers desire high-reverence tools with structured question flows, zero commercial ad clutter, and trustworthy historical-grammatical commentary.",
      solution: "Developed an intimate discipleship operating space. Structured 12-week journeys pair users with mentors, provide guided contemplative daily passages, and offer an AI reflection assistant trained to point directly back to primary scripture texts with historical context.",
      architectureNotes: "Next.js App Router deployed to Vercel Edge. Supabase provides PostgreSQL with fine-grained Row Level Security (RLS) ensuring strict privacy for personal prayer journals and small-group disclosures. Embeddings generated via OpenAI text-embedding-3-small stored in pgvector for semantic cross-referencing of biblical themes.",
      implementationSnippet: {
        filename: "lib/discipleship/cohort-sync.ts",
        language: "typescript",
        code: `// Realtime cohort synchronization with privacy-safe RLS
export async function syncCohortCheckIn(cohortId: string, entry: JournalEntry) {
  const { data: member, error: authErr } = await supabase
    .from('cohort_members')
    .select('role, permissions')
    .eq('cohort_id', cohortId)
    .single();

  if (authErr || !member) throw new UnauthorizedError();

  // Enforce zero-retention privacy on personal reflection drafts
  return supabase.rpc('commit_cohort_progress', {
    p_cohort_id: cohortId,
    p_milestone_id: entry.milestoneId,
    p_encrypted_hash: await hashReflection(entry.text)
  });
}`
      },
      results: "Adopted by 6 campus fellowships across East Africa with over 1,200 active disciple journals. Average weekly habit retention reached 88%, surpassing typical app benchmarks by over 3x.",
      lessons: "Technology in sacred spaces must be humble and restrained. Removing badge notifications and aggressive streaks in favor of serene typography increased user honesty and deeper vulnerability in journal entries."
    },
    architectureNodes: [
      { id: "mobile-client", label: "Next.js PWA Client", role: "input", x: 10, y: 30 },
      { id: "edge-gateway", label: "Edge API & Auth Gateway", role: "process", x: 35, y: 30 },
      { id: "scripture-rag", label: "Contextual Theological RAG", role: "process", x: 65, y: 15 },
      { id: "supabase-db", label: "Supabase (PostgreSQL + RLS)", role: "process", x: 65, y: 50 },
      { id: "mentor-dashboard", label: "Fellowship Mentor Portal", role: "output", x: 92, y: 30 }
    ],
    architectureLines: [
      { from: "mobile-client", to: "edge-gateway" },
      { from: "edge-gateway", to: "scripture-rag" },
      { from: "edge-gateway", to: "supabase-db" },
      { from: "scripture-rag", to: "supabase-db" },
      { from: "supabase-db", to: "mentor-dashboard", active: true }
    ],
    githubUrl: "https://github.com",
    liveUrl: "#"
  },
  {
    id: "football-intelligence",
    slug: "football-intelligence",
    number: "02",
    title: "Football Intelligence",
    subtitle: "Transforming player tracking & scouting metrics into actionable performance intelligence.",
    category: "Machine Learning & CV",
    featured: true,
    version: "v2.1.0",
    technologies: ["PYTHON", "COMPUTER VISION", "YOLO V9", "PYTORCH", "OPENCV"],
    problem: "Scouting in amateur and second-tier football is labor-intensive, geographically constrained, and heavily susceptible to human bias.",
    system: "An automated computer vision analysis pipeline that ingests broadcast and phone video footage, detects player spatial coordinates, calculates speed profiles, and builds predictive talent dossiers.",
    details: "Utilizes fine-tuned YOLOv9 for monocular player localization combined with DeepSORT tracking. A homography projection engine maps screen coordinates into metric pitch positions, calculating acceleration bursts and pressing density.",
    metrics: [
      { label: "Frame Rate", value: "60 FPS", detail: "Real-time edge inference" },
      { label: "Tracking Recall", value: "94.2%", detail: "Occlusion handling under crowded box" },
      { label: "Pitch Mapping", value: "±0.18m", detail: "Homography localization tolerance" }
    ],
    deepDive: {
      overview: "Football Intelligence levels the playing field for unheralded talent. Thousands of promising players in grassroots leagues never get seen by professional clubs simply because GPS vests cost $2,500 each. Our system extracts identical physical metrics from simple phone video.",
      problem: "Youth scouts cannot physically attend 500 matches a weekend. Meanwhile, traditional statistical platforms only cover top European leagues. Grassroots teams film games with mobile phones, but the footage is shaky, low-resolution, and uncalibrated.",
      research: "Studied perspective projection homography techniques and Kalman filter occlusions during 22-player dense box scrums. Discovered that kinematic acceleration curves (first 3-5 meters) are the single highest predictor of professional-grade athleticism.",
      solution: "Engineered a dual-stage vision pipeline: Step 1 isolates pitch boundary lines and intersection points to construct a dynamic bird's-eye homography matrix. Step 2 tracks player bounding boxes, maps feet positions to meter grid coordinates, and calculates instant velocity vectors.",
      architectureNotes: "Python pipeline containerized with NVIDIA TensorRT runtime. PyTorch custom heads evaluate body orientation and pressing trigger distances. Generates instant PDF scouting cards and interactive spatial heatmaps.",
      implementationSnippet: {
        filename: "scout/kinematics.py",
        language: "python",
        code: `def compute_acceleration_bursts(trajectory_coords, fps=30):
    """Calculates instantaneous acceleration vectors from metric pitch positions."""
    velocities = np.diff(trajectory_coords, axis=0) * fps
    speeds = np.linalg.norm(velocities, axis=1)
    
    # 5-frame moving average to smooth lens jitter
    smoothed_speed = scipy.signal.savgol_filter(speeds, window_length=5, polyorder=2)
    accelerations = np.diff(smoothed_speed) * fps
    
    peak_bursts = accelerations[accelerations > 3.8] # Elite threshold: >3.8 m/s^2
    return {
        "top_speed": np.max(smoothed_speed),
        "explosive_burst_count": len(peak_bursts),
        "sustained_sprint_distance": np.sum(smoothed_speed[smoothed_speed > 7.0]) / fps
    }`
      },
      results: "Successfully piloted with two Kenyan Premier League youth academies. Identified 4 standout academy players who were subsequently invited to national U-20 trials.",
      lessons: "Raw speed numbers alone deceive; contextual tactical positioning (pressing at the correct angle) matters more than linear sprinting. Combining spatial Voronoi dominance maps with kinematic speed yields true tactical intelligence."
    },
    architectureNodes: [
      { id: "raw-video", label: "Broadcast / Phone Match Video", role: "input", x: 10, y: 30 },
      { id: "yolo-detect", label: "YOLOv9 Player Detection", role: "process", x: 38, y: 15 },
      { id: "homography", label: "Pitch Homography Calibrator", role: "process", x: 38, y: 50 },
      { id: "kinematics", label: "Kinematic Acceleration Slicer", role: "process", x: 68, y: 30 },
      { id: "scout-report", label: "Recruit Performance Dossier", role: "output", x: 92, y: 30 }
    ],
    architectureLines: [
      { from: "raw-video", to: "yolo-detect" },
      { from: "raw-video", to: "homography" },
      { from: "yolo-detect", to: "kinematics" },
      { from: "homography", to: "kinematics" },
      { from: "kinematics", to: "scout-report", active: true }
    ],
    githubUrl: "https://github.com",
    liveUrl: "#"
  },
  {
    id: "tukokadi",
    slug: "tukokadi",
    number: "03",
    title: "TukoKadi",
    subtitle: "Unified payments interface & resilient double-entry ledger for East Africa.",
    category: "Fintech Infrastructure",
    featured: true,
    version: "LIVE",
    technologies: ["GO", "DISTRIBUTED LEDGER", "REDIS", "POSTGRESQL", "DOCKER"],
    problem: "East African digital merchants face fragmented mobile money rails, catastrophic double-spend race conditions, and silent telco API timeouts.",
    system: "A high-concurrency payment gateway API that abstracts M-Pesa, Airtel Money, and card rails beneath a transactionally safe, two-phase commit double-entry ledger.",
    details: "Built in Go with zero external runtime dependencies. Implements distributed idempotency locks in Redis and persistent write-ahead transaction ledgers in Postgres with active failover circuit breakers.",
    metrics: [
      { label: "Throughput", value: "2,400 rps", detail: "Single instance Go router" },
      { label: "Ledger Discrepancy", value: "0.00%", detail: "Zero double-spends under failover" },
      { label: "Callback Latency", value: "45ms", detail: "Async webhook delivery" }
    ],
    deepDive: {
      overview: "TukoKadi ('We are on the card' / verified) provides carrier-grade payment infrastructure for modern African commerce. It handles erratic telco network drops without ever dropping an invoice or charging a customer twice.",
      problem: "Telco mobile-money APIs frequently take 45-90 seconds to acknowledge payment callbacks. Under network timeouts, naïve systems retry charges, resulting in infuriating duplicate debit fees for consumers and nightmare accounting audits for merchants.",
      research: "Analyzed distributed banking patterns, specifically Martin Fowler's Accounting Patterns and Martin Kleppmann's distributed transaction primitives. Designed strict immutable append-only journal ledgers with cryptographic balance checkpoints.",
      solution: "Constructed an event-driven Go service utilizing lock-free worker pools. Every inbound charge request generates a cryptographically signed idempotency token. Even if the network disconnects and reconnects 10 times, the ledger evaluates the transaction exactly once.",
      architectureNotes: "Go 1.22 HTTP router with zero-alloc memory buffering. Redis handles atomic token leases with 120-second lease windows. PostgreSQL maintains audited immutable debit and credit transaction pairs with strict check constraints.",
      implementationSnippet: {
        filename: "ledger/transact.go",
        language: "go",
        code: `// Atomic double-entry commit with write-ahead lock
func (s *LedgerService) ExecuteTransfer(ctx context.Context, tx TransferRequest) error {
    token, err := s.redis.AcquireIdempotency(ctx, tx.IdempotencyKey, 2*time.Minute)
    if err != nil {
        return ErrDuplicateTransaction
    }
    defer token.Release()

    return s.db.WithTransaction(ctx, func(q *Queries) error {
        // Enforce debit == credit constraint
        if err := q.InsertJournalEntry(ctx, tx.DebitAccount, -tx.Amount); err != nil {
            return fmt.Errorf("debit failed: %w", err)
        }
        if err := q.InsertJournalEntry(ctx, tx.CreditAccount, tx.Amount); err != nil {
            return fmt.Errorf("credit failed: %w", err)
        }
        return q.RecordAuditProof(ctx, tx.ID, tx.Sign())
    })
}`
      },
      results: "Processed over $1.4M in transacted volume across 45 merchant integrations with zero ledger discrepancies during major holiday traffic spikes.",
      lessons: "Never trust external telecom API statuses. Assume every external service will fail, timeout, or return misleading HTTP 200 responses with error bodies. Design internal idempotency boundaries as first principles."
    },
    architectureNodes: [
      { id: "merchant-sdk", label: "Merchant Mobile / Web Checkout", role: "input", x: 10, y: 30 },
      { id: "go-router", label: "Go Concurrent API Router", role: "process", x: 35, y: 30 },
      { id: "mpesa-rail", label: "M-Pesa Express Rail", role: "process", x: 65, y: 15 },
      { id: "airtel-rail", label: "Airtel Money Rail", role: "process", x: 65, y: 50 },
      { id: "durable-ledger", label: "Immutable Double-Entry Ledger", role: "process", x: 80, y: 30 },
      { id: "webhook-dispatch", label: "Verified Webhook Dispatcher", role: "output", x: 95, y: 30 }
    ],
    architectureLines: [
      { from: "merchant-sdk", to: "go-router" },
      { from: "go-router", to: "mpesa-rail" },
      { from: "go-router", to: "airtel-rail" },
      { from: "mpesa-rail", to: "durable-ledger" },
      { from: "airtel-rail", to: "durable-ledger" },
      { from: "durable-ledger", to: "webhook-dispatch", active: true }
    ],
    githubUrl: "https://github.com",
    liveUrl: "#"
  },
  {
    id: "goraft-consensus",
    slug: "goraft-consensus",
    number: "04",
    title: "GoRaft Engine",
    subtitle: "Distributed consensus engine for fault-tolerant state machine replication.",
    category: "Distributed Systems",
    featured: true,
    version: "v0.8.4",
    technologies: ["GO", "DISTRIBUTED SYSTEMS", "RAFT", "RPC", "TLA+"],
    problem: "Achieving strictly serializable state transitions across erratic multi-region nodes prone to network partitions and packet loss.",
    system: "A pure Go implementation of the Raft distributed consensus protocol featuring randomized election timers, lock-free write-ahead log compaction, and TLA+ verified correctness.",
    details: "Implements complete leader election, log replication, membership changes, and snapshot compaction. Includes a synthetic network chaos harness that injects artificial drops, delays, and split-brain states.",
    metrics: [
      { label: "Commit Latency", value: "3.2ms", detail: "Across 3-node cluster LAN" },
      { label: "Failover Time", value: "<150ms", detail: "Leader election under sudden kill" },
      { label: "Log Throughput", value: "180k ops/s", detail: "Pipelined append RPCs" }
    ],
    deepDive: {
      overview: "GoRaft was engineered as an exercise in fundamental systems correctness. Distributed consensus is where software meets theoretical mathematics: proving that independent machines agree on a sequence of historical truths even when communication links intermittently fail.",
      problem: "Writing distributed state machines is notoriously deceptive. Subtleties in unbuffered RPC channels or premature commit indexes can cause catastrophic split-brain state divergence that corrupts databases.",
      research: "Studied Diego Ongaro and John Ousterhout's foundational Raft paper. Verified state machine edge invariants in TLA+ before writing the Go implementation. Focused specifically on joint consensus for safe cluster configuration changes.",
      solution: "Engineered GoRaft with an actor-like coroutine structure. Channels isolate state mutations within a single master goroutine per node, eliminating lock contention. Implemented persistent write-ahead logs with CRC32 checksums on disk.",
      architectureNotes: "Zero external dependencies beyond standard library Go. Includes pluggable transport interfaces (TCP, gRPC, in-memory) and storage backends (BoltDB, LevelDB, memory).",
      implementationSnippet: {
        filename: "raft/election.go",
        language: "go",
        code: `func (rf *Raft) startElection() {
    rf.currentTerm++
    rf.votedFor = rf.me
    rf.persist()
    
    votesReceived := 1
    resetTimer := rf.randomElectionDuration()
    
    for peer := range rf.peers {
        if peer == rf.me { continue }
        go func(p int) {
            args := rf.constructRequestVoteArgs()
            var reply RequestVoteReply
            if rf.sendRequestVote(p, args, &reply) {
                rf.mu.Lock()
                defer rf.mu.Unlock()
                if reply.Term > rf.currentTerm {
                    rf.becomeFollower(reply.Term)
                    return
                }
                if reply.VoteGranted && reply.Term == rf.currentTerm {
                    votesReceived++
                    if votesReceived > len(rf.peers)/2 && rf.state == Candidate {
                        rf.becomeLeader()
                    }
                }
            }
        }(peer)
    }
}`
      },
      results: "Passed 10,000 automated iterations of Jepsen-style chaos testing under network partition injection with zero uncommitted log divergence.",
      lessons: "Correctness in distributed systems cannot be tested into existence; it must be designed into existence through formal invariants and verifiable proofs."
    },
    architectureNodes: [
      { id: "client-request", label: "Client Propose State Mutation", role: "input", x: 10, y: 30 },
      { id: "leader-node", label: "Raft Leader Node (Term 4)", role: "process", x: 45, y: 15 },
      { id: "follower-1", label: "Follower Replica Node A", role: "process", x: 45, y: 50 },
      { id: "consensus-commit", label: "Majority Quorum Barrier", role: "process", x: 75, y: 30 },
      { id: "durable-state", label: "Deterministic State Machine", role: "output", x: 92, y: 30 }
    ],
    architectureLines: [
      { from: "client-request", to: "leader-node" },
      { from: "leader-node", to: "follower-1" },
      { from: "leader-node", to: "consensus-commit" },
      { from: "follower-1", to: "consensus-commit" },
      { from: "consensus-commit", to: "durable-state", active: true }
    ],
    githubUrl: "https://github.com",
    liveUrl: "#"
  },
  {
    id: "vector-flow",
    slug: "vector-flow",
    number: "05",
    title: "Vector Flow & Cognitive Indexer",
    subtitle: "High-throughput semantic embedding & hybrid sparse-dense vector retrieval pipeline.",
    category: "AI & Search Systems",
    featured: true,
    version: "v1.5.0",
    technologies: ["RUST", "PYTHON", "HNSW", "EMBEDDINGS", "BM25"],
    problem: "Standard RAG pipelines suffer from context dilution, fragmenting tables, and washing out specific serial codes and technical terms.",
    system: "A multi-stage document ingestion pipeline combining markdown-aware hierarchical chunking, dense vector embeddings, BM25 sparse keyword indices, and cross-encoder re-ranking.",
    details: "Built with a high-performance Rust indexing core utilizing SIMD-accelerated cosine similarity calculations. Reduces hallucination frequency by 62% on complex technical manuals.",
    metrics: [
      { label: "Recall Rate", value: "96.4%", detail: "Top-5 contextual grounding precision" },
      { label: "Index Speed", value: "14,000 p/s", detail: "Rust SIMD embedding indexing" },
      { label: "Token Efficiency", value: "+55%", detail: "Eliminates duplicate prompt bloat" }
    ],
    deepDive: {
      overview: "Vector Flow was built to solve the 'Lost in the Middle' failure mode of generative AI. By marrying classical informational retrieval (BM25) with deep geometric embeddings and cross-encoders, it delivers exact grounding answers.",
      problem: "Naïve text splitters blindly slice documents every 500 characters. When a table of server configuration parameters or a code block is split across chunks, the embedding vector lands in no-man's land, causing LLMs to invent imaginary parameters.",
      research: "Analyzed reciprocal rank fusion (RRF) algorithms and dense vector geometric clustering. Benchmarked parent-child chunking where 256-token child nodes trigger retrieval, but 1024-token parent context blocks are fed to the model.",
      solution: "Engineered an intelligent AST-based document ingest parser. Pre-processes markdown, OpenAPI schemas, and PDFs into coherent syntactic blocks before embedding. Employs a Rust micro-service for ultra-fast HNSW vector similarity search.",
      architectureNotes: "Rust core with PyO3 bindings for seamless integration with Python machine learning pipelines. Deploys with local ONNX runtime for sub-10ms cross-encoder inference.",
      implementationSnippet: {
        filename: "indexer/rank_fusion.rs",
        language: "rust",
        code: `// Reciprocal Rank Fusion of Sparse and Dense search results
pub fn reciprocal_rank_fusion(
    dense_ranks: &[DocScore],
    sparse_ranks: &[DocScore],
    k: f32,
) -> Vec<DocScore> {
    let mut fused_scores: HashMap<String, f32> = HashMap::new();
    
    for (rank, doc) in dense_ranks.iter().enumerate() {
        *fused_scores.entry(doc.id.clone()).or_insert(0.0) += 1.0 / (k + rank as f32);
    }
    for (rank, doc) in sparse_ranks.iter().enumerate() {
        *fused_scores.entry(doc.id.clone()).or_insert(0.0) += 1.0 / (k + rank as f32);
    }
    
    let mut sorted: Vec<DocScore> = fused_scores
        .into_iter()
        .map(|(id, score)| DocScore { id, score })
        .collect();
    sorted.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    sorted
}`
      },
      results: "Adopted across 3 internal enterprise knowledge bases, cutting hallucination rates to under 0.8% across 50,000+ domain queries.",
      lessons: "Dense embeddings are not magic. Pure vector similarity without lexical anchoring fails for exact part numbers, names, and error codes. Hybrid search is mandatory for production reliability."
    },
    architectureNodes: [
      { id: "raw-docs", label: "Raw Document & Code Stream", role: "input", x: 10, y: 30 },
      { id: "ast-chunker", label: "AST-Aware Markdown Chunker", role: "process", x: 38, y: 15 },
      { id: "hybrid-embed", label: "Dual BM25 + Dense Vectorizer", role: "process", x: 38, y: 50 },
      { id: "cross-encoder", label: "Cross-Encoder Re-Ranking Engine", role: "process", x: 68, y: 30 },
      { id: "grounded-llm", label: "Precision Grounded Context Envelope", role: "output", x: 92, y: 30 }
    ],
    architectureLines: [
      { from: "raw-docs", to: "ast-chunker" },
      { from: "raw-docs", to: "hybrid-embed" },
      { from: "ast-chunker", to: "cross-encoder" },
      { from: "hybrid-embed", to: "cross-encoder" },
      { from: "cross-encoder", to: "grounded-llm", active: true }
    ],
    githubUrl: "https://github.com",
    liveUrl: "#"
  }
];
