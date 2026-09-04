import { Article } from "../types/article";

export const ARTICLES: Article[] = [
  {
    id: "ai-engineering-production",
    slug: "ai-engineering-production",
    title: "AI Engineering: Building AI Systems That Actually Solve Problems",
    category: "AI Engineering",
    date: "AUG 2024",
    readTime: "8 min read",
    summary: "Why prompt engineering is merely the surface, and why state machines, evaluation harnesses, and deterministic boundaries are where real AI value lives.",
    tags: ["AI Systems", "Architecture", "LLMs", "Evaluation"],
    featured: true,
    bentoSpan: "wide",
    visualType: "graph",
    content: `## Beyond the Chatbox Illusion

Over the past two years, the software industry has confused API calls with engineering. Wrapping an LLM API endpoint in a React text field and calling it an "AI Product" is the modern equivalent of an iframe wrapper in 2002.

True AI engineering does not begin with the model; it begins with **determinism**, **state machines**, and **evaluation boundaries**.

\`\`\`
[ User Intent ]
       ↓
[ Deterministic Classifier ]
   ├── Direct Code Execution (Deterministic)
   └── Bounded Tool Invocations (Constrained LLM)
       └── Real-time Schema Validator
\`\`\`

### 1. The Trap of Unconstrained Generation

When an LLM is granted free-form output authority, failure is a statistical certainty over time. The fundamental law of production AI systems is:

> **Never allow an LLM to generate unstructured tokens when a strongly typed schema or deterministic state machine can make the decision.**

By enforcing JSON Schemas, Zod parsers, and finite state transitions, we constrain entropy. If an AI agent attempts to output an illegal state transition, the runtime rejects the mutation before it touches persistent storage.

### 2. Building Continuous Evaluation Harnesses

Traditional unit testing checks static inputs against static outputs. AI evaluation requires statistical confidence bounds.

- **Golden Test Sets**: Curated suites of 500+ diverse edge-case queries with ground-truth semantic references.
- **LLM-as-a-Judge with Blind Redundancy**: Evaluating outputs using multiple cross-family models (e.g. Gemini 1.5 Pro judging Claude 3.5 Sonnet outputs) to eliminate single-model evaluation bias.
- **Latency & Cost Curves**: Tracking token economics alongside user delight.

### 3. The Shift to Compound AI Systems

The most capable production systems today are not bigger models; they are compound systems of smaller, specialized components:

1. High-speed classifiers (sub-50ms) that triage incoming user intent.
2. Focused semantic retrieval pipelines (BM25 + Dense vector search).
3. Highly constrained code execution environments for arithmetic and data transformations.
4. Synthesizer models that articulate the final verified outcome into natural, human language.

Building systems this way gives you the intelligence of modern models with the reliability of Unix tools.`
  },
  {
    id: "data-intensive-architecture",
    slug: "data-intensive-architecture",
    title: "SSTables, LSM-Trees, and Storage Engine Mechanics",
    category: "Data & Storage",
    date: "JUN 2024",
    readTime: "11 min read",
    summary: "Re-examining Martin Kleppmann's authoritative work on read/write amplification, Bloom filter collisions, and immutable storage segments.",
    tags: ["Storage Engines", "LSM-Trees", "Database Internals", "Distributed"],
    featured: false,
    bentoSpan: "standard",
    visualType: "enclave",
    content: `## The Physical Reality of Disks

Every database abstraction eventually collides with physics: disk seek times, cache line alignment, and write amplification.

When architecting high-throughput ingestion pipelines (such as our payment ledgers and sensor telemetry streams), traditional B-Trees struggle because random writes cause in-place disk modifications and page fragmentation.

### Log-Structured Merge Trees (LSM)

LSM trees solve this by trading write amplification for sequential I/O:

1. **MemTable**: Incoming writes append to an in-memory balanced tree (typically a Red-Black or SkipList) and an on-disk append-only Write-Ahead Log (WAL).
2. **Flush to SSTable**: When the MemTable exceeds its memory threshold, it flushes sequentially to disk as an immutable Sorted String Table (SSTable).
3. **Bloom Filter Guards**: Because keys may reside in any SSTable segment, in-memory Bloom filters prevent costly disk seeks for non-existent keys.

\`\`\`
Write Path:
Inbound Write ──► [ WAL Disk Append ]
             └──► [ Memory MemTable ] ──(Flush)──► [ Immutable SSTables ]
\`\`\`

### Compaction Strategies: Leveled vs. Size-Tiered

The heart of LSM maintenance is compaction. Leveled compaction guarantees minimal read amplification by keeping key ranges disjoint across levels, while Size-Tiered compaction optimizes for maximum write throughput. Understanding this trade-off is the difference between an application surviving traffic surges or falling over in lock contention.`
  },
  {
    id: "opinionated-design-systems",
    slug: "opinionated-design-systems",
    title: "Opinionated Architecture & High-Contrast Design Systems",
    category: "Design Systems",
    date: "APR 2024",
    readTime: "6 min read",
    summary: "Why excessive UI customization slows product velocity. Crafting interfaces using deep negative space, strong typography, and strict visual constraints.",
    tags: ["Design Engineering", "Typography", "Product", "Linear Design"],
    featured: false,
    bentoSpan: "standard",
    visualType: "grid",
    content: `## The Illusion of Infinite Customization

Software engineers love adding configuration toggles. We build theme pickers, layout density sliders, and custom font selectors under the banner of "user choice."

In practice, excessive customization is often an abdication of design responsibility. The finest tools in human history—from Leica cameras to the Apple Macintosh to Linear—are defined by **rigorous, opinionated, unyielding defaults**.

### Principles of Restrained Digital Craft

1. **Typography as Architecture**: When your typography is disciplined, you don't need borders, cards inside cards, or glowing drop-shadows. Space, scale, and weight communicate hierarchy instantly.
2. **The 60-30-10 Value Discipline**: 60% calm neutral background, 30% crisp contrasting typography, and 10% purposeful accent.
3. **Motion with Kinetic Meaning**: Animations should never be decoration. Motion is the optical physics engine that teaches the user where an object came from and where it is going.`
  },
  {
    id: "football-analytics-kinematics",
    slug: "football-analytics-kinematics",
    title: "High-Velocity Player Kinematics & Computer Vision in Football",
    category: "Machine Learning",
    date: "FEB 2024",
    readTime: "9 min read",
    summary: "Translating monocular match footage into metric pitch tracking coordinates, speed profiles, and spatial dominance models.",
    tags: ["Computer Vision", "Football Analytics", "Kinematics", "PyTorch"],
    featured: false,
    bentoSpan: "standard",
    visualType: "kinematics",
    content: `## Scouting the Overlooked 99%

Only 1% of the world's football talent is captured by high-end tracking hardware like Catapult GPS vests or multi-camera optical tracking systems like TRACAB. The remaining 99% play in youth academies, local school tournaments, and regional leagues where games are recorded on handheld mobile phones.

Can we democratize elite athletic scouting using pure computer vision?

### The Homography Coordinate Transform

The primary challenge of monocular match footage is perspective distortion. A player 50 meters away occupies 20 pixels, whereas a player 10 meters away occupies 200 pixels.

By detecting known pitch markings (the 18-yard box, the halfway line, and corner arcs), we compute a dynamic $3 \\times 3$ perspective transformation matrix $H$:

$$\\begin{bmatrix} x' \\\\ y' \\\\ 1 \\end{bmatrix} = H \\begin{bmatrix} u \\\\ v \\\\ 1 \\end{bmatrix}$$

This maps screen pixels $(u, v)$ directly onto standard metric football pitch coordinates $(x', y')$, allowing us to calculate true sprint speeds, deceleration forces, and spatial Voronoi dominance with sub-20cm accuracy.`
  }
];
