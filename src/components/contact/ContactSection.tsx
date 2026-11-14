import React, { useState } from "react";
import { Mail, Github, Linkedin, Twitter, Copy, Check, Send } from "lucide-react";

export const ContactSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [isSent, setIsSent] = useState(false);

  const emailAddress = "kinyuaviktor@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSent(true);
    const subject = `Message from ${senderName.trim() || "Tovu Visitor"}`;
    const bodyLines = [
      senderName.trim() ? `From: ${senderName.trim()}` : "",
      senderEmail.trim() ? `Reply-to: ${senderEmail.trim()}` : "",
      "",
      message.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    setTimeout(() => {
      window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(bodyLines)}`;
    }, 350);
  };

  return (
    <section
      id="contact"
      className="relative py-24 sm:py-32 px-5 sm:px-8 lg:px-10 max-w-7xl mx-auto text-[var(--tovu-text-primary)] border-t border-[var(--tovu-border-hairline)]"
    >
      {/* Header */}
      <div className="mb-14 max-w-3xl">
        <p className="text-[13px] font-mono tracking-[0.14em] uppercase text-[var(--tovu-accent)] mb-3">
          06 · Contact
        </p>
        <h2 className="font-display font-semibold tracking-[-0.025em] text-[var(--tovu-text-primary)] leading-[1.06] text-[clamp(2.25rem,4.4vw,4rem)] mb-5">
          Have a problem worth solving?
        </h2>
        <p className="text-[17px] sm:text-[18px] text-[var(--tovu-text-secondary)] max-w-2xl leading-[1.65]">
          Whether you are exploring distributed systems, architecting applied AI pipelines, or building a product from zero to one, feel free to reach out.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Direct Channels */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-6 sm:p-8 space-y-4">
            <h3 className="text-[13px] font-mono text-[var(--tovu-text-muted)] uppercase tracking-wider">
              Direct Email
            </h3>

            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--tovu-bg-inset)] border border-[var(--tovu-border-hairline)]">
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="w-4 h-4 text-[var(--tovu-accent)] shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:${emailAddress}`}
                  className="text-sm sm:text-[15px] font-mono text-[var(--tovu-text-primary)] hover:text-[var(--tovu-accent)] transition-colors truncate"
                >
                  {emailAddress}
                </a>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label={copied ? "Email copied to clipboard" : "Copy email address"}
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[var(--tovu-bg-elevated)] border border-[var(--tovu-border-hairline)] hover:border-[var(--tovu-border-strong)] text-[13px] font-medium text-[var(--tovu-text-primary)] transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[var(--tovu-accent)]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="sr-only sm:not-sr-only">Copy</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[15px] text-[var(--tovu-text-muted)] leading-relaxed">
              Fastest channel for engineering inquiries, technical collaboration, and advisory work.
            </p>
            <div aria-live="polite" className="sr-only">
              {copied ? "Email address copied to clipboard." : ""}
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-3 gap-3.5">
            <a
              href="https://github.com/BeingKinyua"
              target="_blank"
              rel="noreferrer"
              className="min-h-[88px] p-4 rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] hover:border-[var(--tovu-accent-border)] transition-colors flex flex-col items-center justify-center text-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
            >
              <Github className="w-5 h-5 text-[var(--tovu-text-muted)] group-hover:text-[var(--tovu-text-primary)] transition-colors" />
              <span className="text-sm font-medium text-[var(--tovu-text-secondary)] group-hover:text-[var(--tovu-text-primary)]">
                GitHub
              </span>
            </a>

            <a
              href="https://linkedin.com/in/victor-kinyua-46aa80183"
              target="_blank"
              rel="noreferrer"
              className="min-h-[88px] p-4 rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] hover:border-[var(--tovu-accent-border)] transition-colors flex flex-col items-center justify-center text-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
            >
              <Linkedin className="w-5 h-5 text-[var(--tovu-text-muted)] group-hover:text-[var(--tovu-text-primary)] transition-colors" />
              <span className="text-sm font-medium text-[var(--tovu-text-secondary)] group-hover:text-[var(--tovu-text-primary)]">
                LinkedIn
              </span>
            </a>

            <a
              href="https://x.com/Viktorkinyua98"
              target="_blank"
              rel="noreferrer"
              className="min-h-[88px] p-4 rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] hover:border-[var(--tovu-accent-border)] transition-colors flex flex-col items-center justify-center text-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
            >
              <Twitter className="w-5 h-5 text-[var(--tovu-text-muted)] group-hover:text-[var(--tovu-text-primary)] transition-colors" />
              <span className="text-sm font-medium text-[var(--tovu-text-secondary)] group-hover:text-[var(--tovu-text-primary)]">
                X
              </span>
            </a>
          </div>
        </div>

        {/* Right: Compose Message Form */}
        <div className="lg:col-span-7 rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-6 sm:p-9">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--tovu-border-hairline)]">
            <h3 className="font-display text-xl font-semibold text-[var(--tovu-text-primary)]">
              Send a Note
            </h3>
            <span className="text-[13px] font-mono text-[var(--tovu-text-muted)]">
              Opens your mail client
            </span>
          </div>

          {isSent ? (
            <div className="py-14 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[var(--tovu-accent-soft)] border border-[var(--tovu-accent-border)] text-[var(--tovu-accent)] flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-display text-xl font-semibold text-[var(--tovu-text-primary)]">
                Draft Ready
              </h4>
              <p className="text-[16px] text-[var(--tovu-text-secondary)] max-w-md mx-auto">
                Opening your email client to send your message to Victor.
              </p>
              <button
                type="button"
                onClick={() => setIsSent(false)}
                className="min-h-[44px] px-5 py-2 rounded-xl border border-[var(--tovu-border-hairline)] text-sm font-medium text-[var(--tovu-accent)] hover:border-[var(--tovu-accent-border)] cursor-pointer transition-colors"
              >
                Write another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="text-[13px] font-mono text-[var(--tovu-text-muted)] uppercase tracking-wider block mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Ada Lovelace"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full min-h-[48px] bg-[var(--tovu-bg-inset)] border border-[var(--tovu-border-hairline)] rounded-xl px-4 py-3 text-base text-[var(--tovu-text-primary)] placeholder-[var(--tovu-text-muted)] focus:outline-none focus:border-[var(--tovu-accent)] transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="text-[13px] font-mono text-[var(--tovu-text-muted)] uppercase tracking-wider block mb-2"
                  >
                    Your Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="ada@analytical.org"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full min-h-[48px] bg-[var(--tovu-bg-inset)] border border-[var(--tovu-border-hairline)] rounded-xl px-4 py-3 text-base text-[var(--tovu-text-primary)] placeholder-[var(--tovu-text-muted)] focus:outline-none focus:border-[var(--tovu-accent)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="text-[13px] font-mono text-[var(--tovu-text-muted)] uppercase tracking-wider block mb-2"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Describe the project, architectural challenge, or idea you want to discuss..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full bg-[var(--tovu-bg-inset)] border border-[var(--tovu-border-hairline)] rounded-xl px-4 py-3.5 text-base text-[var(--tovu-text-primary)] placeholder-[var(--tovu-text-muted)] focus:outline-none focus:border-[var(--tovu-accent)] resize-none leading-relaxed transition-colors"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <span className="text-[13px] text-[var(--tovu-text-muted)]">
                  No tracking or third-party form scripts.
                </span>

                <button
                  type="submit"
                  className="min-h-[48px] inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] font-medium text-[15px] hover:opacity-90 transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
                >
                  <span>Send Message</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
