import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Copy, HelpCircle, Loader2, Sparkles, Check } from "lucide-react";
import { Message, SystemBlueprint } from "../types";

interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
  onBlueprintGenerated: (blueprint: SystemBlueprint) => void;
}

export default function AICopilot({ isOpen, onClose, onBlueprintGenerated }: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "system",
      text: "V.K's AI System Architect instance online.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      sender: "assistant",
      text: "Hello! I am V.K's AI Clone and System Architect assistant. Ask me anything about how I engineered projects like AI Football Scout, or ask me to draft a custom architectural blueprint for your own idea (e.g., 'Draft a system blueprint for a real-time messaging server')!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5500);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    if (!textToSend) setInputText("");

    const userMsg: Message = {
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status} Error`);
      }

      const data = await response.json();
      let responseText = data.text;

      // Extract blueprint JSON if embedded
      let parsedBlueprint: SystemBlueprint | undefined = undefined;
      if (responseText.includes("---BLUEPRINT---")) {
        const parts = responseText.split("---BLUEPRINT---");
        responseText = parts[0].trim();
        const jsonString = parts[1].trim();

        try {
          parsedBlueprint = JSON.parse(jsonString);
        } catch (e) {
          console.error("Failed to parse AI generated blueprint JSON:", e);
        }
      }

      const assistantMsg: Message = {
        sender: "assistant",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generatedBlueprint: parsedBlueprint
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (parsedBlueprint) {
        onBlueprintGenerated(parsedBlueprint);
        triggerToast(`🎉 System diagram generated: "${parsedBlueprint.name}"! Overriding Interactive Systems Studio.`);
      }

    } catch (err: any) {
      console.error("Chatbot API core error:", err);
      setMessages(prev => [
        ...prev,
        {
          sender: "system",
          text: `⚠️ Engine Error: ${err.message || 'Connecting failure.'} Ensure Gemini API keys are configured and valid.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: "Design a streaming app", icon: Sparkles, text: "Draft a system blueprint for a high-concurrency music streaming service" },
    { label: "Scout Vision Specs", icon: HelpCircle, text: "Explain the backend computer vision pipeline of AI Football Scout" },
    { label: "TukoKadi Double-Spend", icon: HelpCircle, text: "How did Victor secure TukoKadi against fintech double-spend failures?" }
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      {/* Visual floating toasts over screens */}
      {toastMessage && (
        <div className="absolute top-8 left-8 right-8 md:left-12 md:right-auto z-50 bg-slate-900 border border-[#c3c0ff] text-slate-200 px-5.5 py-4.5 rounded-2xl shadow-2xl flex items-center gap-3.5 max-w-sm animate-bounce text-sm">
          <Sparkles className="w-5 h-5 text-[#c3c0ff] shrink-0" />
          <p className="font-sans font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Main Drawer container */}
      <div 
        className="w-full max-w-md bg-[#0d0f0f] border-l border-slate-705/80 h-full shadow-2xl flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5.5 border-b border-white/5 flex items-center justify-between bg-black/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#c3c0ff]/10 border border-[#c3c0ff]/20 text-[#c3c0ff]">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans">SYS-ARCH COPILOT</h3>
              <p className="text-[10px] font-mono text-emerald-500 uppercase font-bold tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Victor's AI Core Live
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll Thread body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 d-flex flex-col scrollbar-thin">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col max-w-[85%] ${
                m.sender === "user" 
                  ? "ml-auto items-end" 
                  : m.sender === "system"
                  ? "mx-auto w-full max-w-full items-center text-center"
                  : "mr-auto items-start"
              }`}
            >
              {/* Sender Indicator */}
              <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                {m.sender === "system" ? "SYSTEM OUT" : m.sender} • {m.timestamp}
              </span>

              {/* Msg bubble container */}
              <div 
                className={`p-4 rounded-2xl text-xs md:text-sm font-sans leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#1d00a5] text-white rounded-tr-none"
                    : m.sender === "system"
                    ? "bg-[#161717] border border-stone-800 text-[#c3c0ff] rounded-none py-2 px-4.5 font-mono text-[10px]"
                    : "bg-[#1e2020] text-slate-200 border border-slate-700/50 rounded-tl-none"
                }`}
              >
                {m.text}

                {/* Sub features if custom blueprint generated inside logs */}
                {m.generatedBlueprint && (
                  <div className="mt-4 p-3.5 bg-black/40 border border-[#c3c0ff]/30 rounded-xl space-y-2 font-mono text-[10px] text-[#c3c0ff] flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#c3c0ff] shrink-0" />
                    <div>
                      <p className="font-bold underline uppercase">Custom Diagram Compiled</p>
                      <p className="text-slate-400 mt-0.5">{m.generatedBlueprint.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-slate-450 mr-auto">
              <Loader2 className="w-4 h-4 animate-spin text-[#c3c0ff]" />
              <span className="font-mono text-xs uppercase text-slate-500 font-bold animate-pulse">Modeling Architecture...</span>
            </div>
          )}
        </div>

        {/* Suggestion Prompts */}
        {messages.length <= 2 && (
          <div className="px-5 pb-3 space-y-2 border-t border-white/5 pt-4">
            <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">RECOMMENDED CHANNELS</span>
            <div className="flex flex-col gap-2">
              {quickPrompts.map((qp, idx) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qp.text)}
                    className="w-full text-left p-3 rounded-xl bg-[#121414] border border-white/5 hover:border-[#c3c0ff]/50 transition-all text-xs font-sans text-slate-400 hover:text-slate-200 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#c3c0ff] shrink-0" />
                    <span>{qp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Send Footer */}
        <div className="p-5 border-t border-white/5 bg-black/10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            className="flex gap-2.5 relative items-center"
          >
            <input
              type="text"
              value={inputText}
              disabled={isLoading}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Query Victor's AI clone..."
              className="flex-1 bg-[#121414] border border-slate-700/60 rounded-full py-3.5 px-6 text-sm text-white focus:outline-none focus:border-[#c3c0ff] placeholder-slate-500 font-sans disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 p-2 rounded-full bg-[#c3c0ff] text-[#1d00a5] hover:bg-[#dad7ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3 text-[9px] font-mono text-slate-600 uppercase">
            SECURE ENGINE TUNNEL TERMINALLY ENCRYPTED
          </div>
        </div>
      </div>
    </div>
  );
}
