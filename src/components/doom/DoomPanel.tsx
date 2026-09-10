import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, ArrowRight, CornerDownLeft, ExternalLink, Bot, User, RefreshCw, Compass } from "lucide-react";
import { askDoom } from "../../services/doom";
import { DoomChatMessage, DoomAction, DoomReference } from "../../types/doom";
import { DoomResponse } from "../motion/DoomResponse";
import { useScrollLock } from "../../hooks/useScrollLock";
import Lenis from "lenis";

interface DoomPanelProps {
  isOpen: boolean;
  initialPrompt?: string;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenProject: (slug: string) => void;
  onOpenArticle: (slug: string) => void;
  lenisRef?: React.RefObject<Lenis | null>;
}

export const DoomPanel: React.FC<DoomPanelProps> = ({
  isOpen,
  initialPrompt,
  onClose,
  onNavigate,
  onOpenProject,
  onOpenArticle,
  lenisRef,
}) => {
  // Lock background scroll and pause Lenis while Dr. Doom modal is open
  useScrollLock({
    lock: isOpen,
    lenisRef,
  });

  const [messages, setMessages] = useState<DoomChatMessage[]>([
    {
      id: "initial-welcome",
      sender: "doom",
      text: "DR. DOOM online. How may I assist your investigation into Victor's systems, research, or architecture?",
      timestamp: "SYSTEM READY",
      actions: [
        { label: "Show me Victor's AI projects", type: "open_project", target: "nyayo" },
        { label: "What is Victor currently learning?", type: "navigate", target: "lab" },
        { label: "Take me to the Journal", type: "navigate", target: "journal" },
        { label: "Who is Victor?", type: "navigate", target: "about" }
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      if (initialPrompt) {
        handleSendPrompt(initialPrompt);
      }
    }
  }, [isOpen, initialPrompt]);

  // Isolate wheel and touch events inside the messages container so they don't bubble to window or Lenis
  useEffect(() => {
    if (!isOpen) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    const stopPropagation = (e: Event) => {
      e.stopPropagation();
    };

    container.addEventListener("wheel", stopPropagation, { passive: true });
    container.addEventListener("touchmove", stopPropagation, { passive: true });

    return () => {
      container.removeEventListener("wheel", stopPropagation);
      container.removeEventListener("touchmove", stopPropagation);
    };
  }, [isOpen]);

  // Smooth scroll to latest message when new messages are received
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  const handleSendPrompt = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMessage: DoomChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await askDoom({ message: queryText });
      const doomMessage: DoomChatMessage = {
        id: `doom-${Date.now()}`,
        sender: "doom",
        text: response.message,
        timestamp: response.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: response.actions,
        references: response.references
      };
      setMessages((prev) => [...prev, doomMessage]);
    } catch (err) {
      const errorMessage: DoomChatMessage = {
        id: `doom-err-${Date.now()}`,
        sender: "doom",
        text: "Diagnostic anomaly encountered while evaluating VictorOS indices. Please retry your inquiry.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = (action: DoomAction) => {
    if (action.type === "navigate") {
      onClose();
      onNavigate(action.target);
    } else if (action.type === "open_project") {
      onClose();
      onOpenProject(action.target);
    } else if (action.type === "open_article") {
      onClose();
      onOpenArticle(action.target);
    }
  };

  const handleReferenceClick = (ref: DoomReference) => {
    onClose();
    if (ref.type === "project") {
      onOpenProject(ref.slug);
    } else if (ref.type === "article") {
      onOpenArticle(ref.slug);
    } else if (ref.type === "experiment") {
      onNavigate("lab");
    } else if (ref.type === "knowledge") {
      onNavigate("knowledge");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="doom-panel-backdrop"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="doom-panel-container"
        data-lenis-prevent="true"
        className="relative w-full max-w-2xl h-[85vh] max-h-[720px] rounded-2xl border border-blue-500/20 bg-[#090b0e] shadow-[0_25px_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0d1015]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-semibold text-white tracking-wide">
                  DR. DOOM
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">
                  SYSTEM INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Cognitive assistant for investigating Victor's systems and thought
              </p>
            </div>
          </div>

          <button
            id="close-doom-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div
          ref={messagesContainerRef}
          id="doom-messages-stream"
          data-lenis-prevent="true"
          tabIndex={0}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 scrollbar-thin outline-none"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {messages.map((msg) => {
            const isDoom = msg.sender === "doom";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isDoom ? "items-start" : "items-start justify-end"}`}
              >
                {isDoom && (
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isDoom
                      ? "bg-[#111419] border border-white/10 text-zinc-200"
                      : "bg-blue-600 text-white shadow-lg"
                  }`}
                >
                  {isDoom ? (
                    <DoomResponse
                      message={msg.text}
                      references={msg.references}
                      actions={msg.actions}
                      onOpenProject={(slug) => {
                        onClose();
                        onOpenProject(slug);
                      }}
                      onOpenArticle={(slug) => {
                        onClose();
                        onOpenArticle(slug);
                      }}
                      onNavigate={(sec) => {
                        onClose();
                        onNavigate(sec);
                      }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}

                  <div
                    className={`text-[9px] font-mono mt-2 text-right ${
                      isDoom ? "text-zinc-500" : "text-blue-200"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {!isDoom && (
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-[#111419] border border-white/10 text-xs font-mono text-zinc-400 flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                <span>Dr. Doom evaluating VictorOS topology...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#0d1015]/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2 bg-[#12161d] border border-white/10 rounded-xl px-3.5 py-2 focus-within:border-blue-500/50 transition-colors"
          >
            <input
              ref={inputRef}
              id="doom-query-input"
              type="text"
              placeholder="Ask anything about VictorOS (e.g. 'Show me Victor's AI projects')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none tracking-wide"
            />

            <button
              id="doom-submit-btn"
              type="submit"
              disabled={!input.trim() || loading}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Prompt Suggestion Chips */}
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px] font-mono text-zinc-400">
            <span className="shrink-0 text-zinc-500">TRY:</span>
            {[
              "Show me Victor's AI projects",
              "What is Victor currently learning?",
              "Explain NYAYO architecture",
              "Take me to the Journal"
            ].map((sugg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendPrompt(sugg)}
                className="shrink-0 px-2 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                → {sugg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
