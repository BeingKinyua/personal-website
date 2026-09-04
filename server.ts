import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client lazily to prevent crashing on boot if key is missing
  let ai: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        throw new Error("GEMINI_API_KEY environment variable is missing or has a dummy value. Please configure it in Settings > Secrets.");
      }
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  }

  // API Route: AI Digital Clone Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const client = getGeminiClient();

      // System prompt to lock persona and explain blueprint generation rules
      const systemInstruction = `You are a helpful AI System Architect and the direct digital clone of Victor Kinyua (V.K).
V.K is a Software Engineer, AI Builder, and Product Thinker from East Africa.
He built major systems like:
1. AI Football Scout: A computer vision pipeline (YOLOv9, DeepSORT Tracking, Python, custom CNN benchmarks) that processes broadcast or mobile recordings, extracts coordinates, and benchmarks talent profiles.
2. TukoKadi: A transactional fintech infrastructure gateway that abstracts mobile money network rails (M-Pesa, Airtel Money) and banks with double-entry ledgers to avoid double-spend bugs.
Your goal is to converse with users about software engineering, distributed systems, RAG networks, Go programming, or state replication.
Be technically precise, elegant, and highly articulate.

CRITICAL FEATURE: BLUEPRINT GENERATION
If the user asks you to:
- Design a system architecture / blueprint
- Frame an API server flowchart
- Map a cloud deployment topology
- Create nodes and pathways for a processing network
You MUST attach a custom system architecture blueprint JSON to the very end of your response.
To do this, output your regular conversation markdown text, and then write exactly:
---BLUEPRINT---
followed by a raw JSON block matching this precise typescript interface (do not wrap in markdown quotes after the marker, just output pure valid JSON):
{
  "name": "Title of your custom blueprint",
  "description": "Short summary of what this flow represents.",
  "nodes": [
    { "id": "input-1", "label": "Label name", "role": "input", "description": "Short explanation", "x": 10, "y": 30 },
    { "id": "process-1", "label": "Label name", "role": "process", "description": "Short explanation", "x": 50, "y": 30 },
    { "id": "output-1", "label": "Label name", "role": "output", "description": "Short explanation", "x": 90, "y": 30 }
  ],
  "lines": [
    { "from": "input-1", "to": "process-1" },
    { "from": "process-1", "to": "output-1", "active": true }
  ]
}

Place all nodes thoughtfully across coordinates (x matches horizontal percentage 0 to 100, y matches vertical percentage 0 to 100). Keep standard input on the left (x: 10-25), processes in the middle (x: 40-75), outputs on the right (x: 85-95). Make sure node IDs in lines match defined node IDs exactly. Include at least 3 to 6 logical nodes for realistic high fidelity!`;

      // Structure historical thread conversations
      const formattedContents = messages.map((m: any) => {
        return {
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        };
      });

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text || "I was unable to formulate a response. Please let me know how I can help design your architectures." });
    } catch (err: any) {
      console.error("Gemini chatbot error:", err);
      res.status(500).json({ error: err.message || "An error occurred with Victor's AI Core." });
    }
  });

  // API Route: Scoping and Architecture Estimator
  app.post("/api/scope", async (req, res) => {
    try {
      const { name, description, duration, budget } = req.body;
      if (!name || !description) {
        return res.status(400).json({ error: "Project name and description are required." });
      }

      const client = getGeminiClient();

      const prompt = `Perform a high-level software architectures scoping on the following project idea:
Project Name: "${name}"
Description: "${description}"
Target duration: "${duration || 'Flexible'} weeks"
Approximate Budget Scale: "${budget || 'Flexible'}"

Return a comprehensive, beautiful system scoping in a JSON format matching the schema provided.
You should design a realistic cloud architect representation of the core topology (representing this system using input, process, and output nodes). Include 4-6 nodes to represent real world infrastructure (e.g. static Client Web, API Gateway, primary DB state boundary, ML Inference queue, webhooks, analytics, third party APIs). Give them coordinate offsets (x ranges 10 to 95, y ranges 10 to 90).`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Highly polished engineered name of the system architecture" },
          overview: { type: Type.STRING, description: "Surgical, elegant technical executive blueprint overview (1-2 paragraphs)." },
          stack: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                reason: { type: Type.STRING, description: "Why this technology is chosen for this specific bottleneck" }
              },
              required: ["name", "reason"]
            },
            description: "List of 3-4 recommended software technologies"
          },
          phases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Phase title (e.g., Core DB Ledger Design, Real-time Ingestion)" },
                hours: { type: Type.INTEGER, description: "Engineering hours estimated" },
                deliverables: { type: Type.STRING, description: "Core outcomes of this stage" }
              },
              required: ["name", "hours", "deliverables"]
            },
            description: "List of 3-4 concrete development milestones"
          },
          totalHours: { type: Type.INTEGER, description: "Sum of all estimated milestone phases" },
          timelineWeeks: { type: Type.INTEGER, description: "Estimated completion timeline in weeks" },
          architectureJson: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    role: { type: Type.STRING, description: "input OR process OR output" },
                    description: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER }
                  },
                  required: ["id", "label", "role", "x", "y"]
                }
              },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    from: { type: Type.STRING },
                    to: { type: Type.STRING },
                    active: { type: Type.BOOLEAN }
                  },
                  required: ["from", "to"]
                }
              }
            },
            required: ["name", "description", "nodes", "lines"]
          }
        },
        required: ["title", "overview", "stack", "phases", "totalHours", "timelineWeeks", "architectureJson"]
      };

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from AI core.");
      }

      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (err: any) {
      console.error("Gemini scoping estimator error:", err);
      res.status(500).json({ error: err.message || "An error occurred during Victor's architectural estimation scan." });
    }
  });

  // Vite Integration for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
