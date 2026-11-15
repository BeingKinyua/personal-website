import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { askTovu } from "../../services/tovu";
import { ApiClientError } from "../../services/apiClient";
import { TovuChatMessage } from "../../types/tovu";
import { TovuResponse } from "../motion/TovuResponse";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useDialogFocusTrap } from "../../hooks/useDialogFocusTrap";
import Lenis from "lenis";

export interface TovuPanelProps {
  isOpen: boolean;
  initialPrompt?: string;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenProject: (slug: string) => void;
  onOpenArticle: (slug: string) => void;
  lenisRef?: React.RefObject<Lenis | null>;
}

export const TovuPanel: React.FC<TovuPanelProps> = ({
  isOpen,
  initialPrompt,
  onClose,
  onNavigate,
  onOpenProject,
  onOpenArticle,
  lenisRef,
}) => {
  useScrollLock({
    lock: isOpen,
    lenisRef,
  });

  const [messages, setMessages] = useState<TovuChatMessage[]>([
    {
      id: "initial-welcome",
      sender: "tovu",
      text: "Hello — I can help you explore Victor's engineered systems, essays, active lab experiments, and knowledge lattice.",
      timestamp: "Ready",
      actions: [
        { label: "Explore AI projects", type: "navigate", target: "work" },
        { label: "Current lab research", type: "navigate", target: "lab" },
        { label: "Read the Journal", type: "navigate", target: "journal" },
        { label: "About Victor", type: "navigate", target: "about" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const dialogRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastInitialPromptRef = useRef<string | undefined>(undefined);

  useDialogFocusTrap(isOpen, dialogRef, { initialFocusRef: inputRef });

  useEffect(() => {
    if (!isOpen) {
      lastInitialPromptRef.current = undefined;
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 80);
    if (initialPrompt && initialPrompt !== lastInitialPromptRef.current) {
      lastInitialPromptRef.current = initialPrompt;
      handleSendPrompt(initialPrompt);
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, initialPrompt, onClose]);

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

    const userMessage: TovuChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await askTovu({
        message: queryText,
        conversationId,
      });

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      const tovuMessage: TovuChatMessage = {
        id: `tovu-${Date.now()}`,
        sender: "tovu",
        text: response.message,
        timestamp:
          response.timestamp ||
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: response.actions,
        references: response.references,
        fallbackUsed: response.fallbackUsed,
      };
      setMessages((prev) => [...prev, tovuMessage]);
    } catch (err) {
      const errorText =
        err instanceof ApiClientError && err.statusCode === 429
          ? err.message
          : err instanceof ApiClientError
          ? `Tovu request failed (${err.code}): ${err.message}`
          : "Unable to reach Tovu intelligence right now. Please try your question again.";

      const errorMessage: TovuChatMessage = {
        id: `tovu-err-${Date.now()}`,
        sender: "tovu",
        text: errorText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="tovu-panel-backdrop"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        id="tovu-panel-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tovu-panel-title"
        tabIndex={-1}
        data-lenis-prevent="true"
        className="relative w-full max-w-3xl h-[86vh] max-h-[760px] rounded-2xl border border-[var(--tovu-border-strong)] bg-[var(--tovu-bg-canvas)] shadow-2xl flex flex-col overflow-hidden text-[var(--tovu-text-primary)] focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--tovu-accent-soft)] border border-[var(--tovu-accent-border)] text-[var(--tovu-accent)] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="tovu-panel-title"
                className="font-display text-base sm:text-lg font-semibold text-[var(--tovu-text-primary)]"
              >
                Ask Tovu
              </h3>
              <p className="text-[13px] text-[var(--tovu-text-muted)]">
                Explore systems, essays, architecture, and research
              </p>
            </div>
          </div>

          <button
            id="close-tovu-btn"
            type="button"
            onClick={onClose}
            className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-elevated)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
            aria-label="Close Ask Tovu dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div
          ref={messagesContainerRef}
          id="tovu-messages-stream"
          data-lenis-prevent="true"
          tabIndex={0}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5 scrollbar-thin outline-none"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {messages.map((msg) => {
            const isTovu = msg.sender === "tovu";
            return (
              <div
                key={msg.id}
                className={`flex ${isTovu ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-5 ${
                    isTovu
                      ? msg.isError
                        ? "bg-red-500/10 border border-red-500/30 text-[var(--tovu-text-primary)]"
                        : "bg-[var(--tovu-bg-surface)] border border-[var(--tovu-border-hairline)] text-[var(--tovu-text-primary)]"
                      : "bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] text-[15px] sm:text-base leading-relaxed"
                  }`}
                >
                  {isTovu ? (
                    <TovuResponse
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
                    className={`text-[12px] font-mono mt-3 flex items-center justify-end gap-2 ${
                      isTovu ? "text-[var(--tovu-text-muted)]" : "opacity-70"
                    }`}
                  >
                    {msg.fallbackUsed && (
                      <span className="text-[11px] opacity-80">Grounded summary ·</span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start" aria-live="polite">
              <div className="rounded-2xl px-5 py-4 bg-[var(--tovu-bg-surface)] border border-[var(--tovu-border-hairline)] text-sm text-[var(--tovu-text-secondary)]">
                Searching systems, essays, and architecture notes...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Suggestions */}
        <div className="p-4 sm:p-5 border-t border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2.5 bg-[var(--tovu-bg-inset)] border border-[var(--tovu-border-hairline)] rounded-xl px-4 py-2 focus-within:border-[var(--tovu-accent)] transition-colors"
          >
            <input
              ref={inputRef}
              id="tovu-query-input"
              type="text"
              placeholder="Ask about projects, architecture, essays, or experiments..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="w-full min-h-[40px] bg-transparent text-[15px] sm:text-base text-[var(--tovu-text-primary)] placeholder-[var(--tovu-text-muted)] focus:outline-none"
            />

            <button
              id="tovu-submit-btn"
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send question"
              className="w-10 h-10 inline-flex items-center justify-center rounded-lg bg-[var(--tovu-accent)] text-[var(--tovu-accent-ink)] disabled:opacity-35 disabled:cursor-not-allowed transition-opacity cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {[
              "Show me the AI projects",
              "What is Victor currently learning?",
              "Explain NYAYO architecture",
              "Take me to the Journal",
            ].map((sugg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendPrompt(sugg)}
                className="min-h-[36px] shrink-0 px-3.5 py-1.5 rounded-lg bg-[var(--tovu-bg-elevated)] hover:border-[var(--tovu-accent-border)] border border-[var(--tovu-border-hairline)] text-[13px] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] transition-colors cursor-pointer whitespace-nowrap"
              >
                {sugg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
