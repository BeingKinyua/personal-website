import { CurrentlyItem } from "../types/common";

export const CURRENTLY_ITEMS: CurrentlyItem[] = [
  {
    id: "building-agents",
    category: "Building",
    title: "Autonomous Agent Framework in Go",
    status: "Active Iteration",
    techOrSource: "Go 1.22 · Actor Model · Lock-Free",
    description: "Surgical, concurrent actor-based architecture for deploying reactive AI agents at scale.",
    details: "Managing reactive agent lifecycles using lightweight coroutines, lock-free ring buffers, and sub-millisecond message passing with durable SQLite WAL checkpointing.",
    statusLogs: [
      "Initialized engine context with Go 1.22 coroutine channels",
      "Completed prototype for actor mailbox lock-free ring buffer",
      "Benchmarked state transition throughput: 4.2M events/sec",
      "Integrating local SQLite boundary state WAL checkpointing"
    ],
    snippet: {
      filename: "actor/mailbox.go",
      language: "go",
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
            if err := m.receiver.Receive(ctx, msg); err != nil {
                ctx.Log("process error: %v", err)
            }
        case <-ctx.Done():
            return
        }
    }
}`
    }
  },
  {
    id: "learning-consensus",
    category: "Learning",
    title: "Distributed Systems Consensus & Raft",
    status: "Formal Verification",
    techOrSource: "Raft · Paxos · TLA+ Invariants",
    description: "Grokking formal correctness proofs of Raft and Multi-Paxos variants under network partitions.",
    details: "Deeply researching consensus systems, leadership election optimizations, membership transitions, and log compaction safety with chaos network fault injection.",
    statusLogs: [
      "Passed validation checks on Leader Election in isolation",
      "Implementing log verification over un-ordered RPC channels",
      "Running TLA+ core state verification proofs",
      "Injecting artificial latency to gauge split-vote resolution"
    ],
    snippet: {
      filename: "raft/consensus.go",
      language: "go",
      code: `package raft

// RequestVoteArgs represents RequestVote RPC arguments
type RequestVoteArgs struct {
    Term         int    // candidate's term
    CandidateID  string // candidate requesting vote
    LastLogIndex int    // index of candidate's last log entry
    LastLogTerm  int    // term of candidate's last log entry
}`
    }
  },
  {
    id: "reading-ddia",
    category: "Reading",
    title: "Designing Data-Intensive Applications",
    status: "3rd Deep Study",
    techOrSource: "Martin Kleppmann · Storage Engines",
    description: "Re-examining SSTables, LSM-trees, and B-Tree read amplification characteristics under heavy load.",
    details: "Analyzing partition algorithms, physical data structures, Bloom filter collision math, and write amplification profiles for high-throughput persistence.",
    statusLogs: [
      "Completed workbook entries on LSM-Tree MemTable flushing flow",
      "Diagramming write path: Commit Log -> MemTable -> SSTable Segment",
      "Modeling Bloom Filter collision rates under heavy writing workloads",
      "Comparing isolation levels: Clean Read vs. Snapshot Isolation"
    ]
  },
  {
    id: "exploring-generative-ui",
    category: "Exploring",
    title: "Generative UI with Streaming Schemas",
    status: "Architectural RFC",
    techOrSource: "React · Streaming JSON · Vercel AI SDK",
    description: "Streaming interactive React nodes directly from LLM server tool invocation.",
    details: "Investigating modern UI engineering boundaries. Rendering functional server components directly into current chat flows based on schema responses with instant client-side hydration.",
    statusLogs: [
      "Set up Vite middleware server callback protocols",
      "Created dynamic component loader with Radix primitives",
      "Benchmarked component injection render latency: 120ms",
      "Implementing client-side hydration for generated charts"
    ]
  }
];
