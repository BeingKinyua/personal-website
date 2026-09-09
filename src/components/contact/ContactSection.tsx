import React, { useState } from "react";
import { Mail, Github, Linkedin, Twitter, Copy, Check, Send, Terminal, MessageSquareCode } from "lucide-react";
import { TextReveal } from "../motion/TextReveal";
import { WordReveal } from "../motion/WordReveal";
import { ParallaxBackgroundText } from "../motion/ParallaxBackgroundText";

export const ContactSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [isSent, setIsSent] = useState(false);

  const emailAddress = "victor.kinyua@victoros.io";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Direct mailto bridge or simulated transmission
    setIsSent(true);
    setTimeout(() => {
      window.location.href = `mailto:${emailAddress}?subject=Transmission from ${encodeURIComponent(
        senderName || "VictorOS Visitor"
      )}&body=${encodeURIComponent(message)}`;
    }, 600);
  };

  return (
    <section id="contact" className="relative py-24 px-4 sm:px-6 max-w-7xl mx-auto text-zinc-100 overflow-hidden">
      {/* Architectural Background Typography Parallax */}
      <ParallaxBackgroundText className="text-[16vw] absolute top-6 right-6 z-0" triggerId="contact">
        CONNECT
      </ParallaxBackgroundText>

      {/* Header */}
      <div className="mb-14 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
            CONTACT // DIRECT CHANNELS
          </span>
        </div>
        <TextReveal
          as="h2"
          trigger="scroll"
          duration={0.9}
          className="text-3xl sm:text-5xl font-mono font-medium text-white tracking-tight mb-4"
        >
          Have a problem worth solving?
        </TextReveal>
        <WordReveal
          trigger="scroll"
          delay={0.2}
          className="text-base sm:text-lg text-zinc-400 max-w-xl font-normal leading-relaxed"
        >
          Whether you are exploring hard distributed systems, architecting high-throughput AI pipelines, or building a startup from zero to one.
        </WordReveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Direct Channels & 1-Click Copy */}
        <div className="lg:col-span-5 space-y-6">
          {/* Email Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0d0f12] p-6 sm:p-8 space-y-4">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
              PRIMARY COMMUNICATION
            </span>

            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#08090c] border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs sm:text-sm font-mono text-white truncate">
                  {emailAddress}
                </span>
              </div>

              <button
                onClick={handleCopyEmail}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer shrink-0"
                title="Copy email to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Fastest response for engineering inquiries, advisory, and technical collaboration.
            </p>
          </div>

          {/* Social Profiles Grid */}
          <div className="grid grid-cols-3 gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl border border-white/10 bg-[#0d0f12] hover:bg-[#13161b] hover:border-white/20 transition-all flex flex-col items-center justify-center text-center gap-2 group"
            >
              <Github className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="text-xs font-mono text-zinc-400 group-hover:text-white">GitHub</span>
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl border border-white/10 bg-[#0d0f12] hover:bg-[#13161b] hover:border-white/20 transition-all flex flex-col items-center justify-center text-center gap-2 group"
            >
              <Linkedin className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
              <span className="text-xs font-mono text-zinc-400 group-hover:text-white">LinkedIn</span>
            </a>

            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl border border-white/10 bg-[#0d0f12] hover:bg-[#13161b] hover:border-white/20 transition-all flex flex-col items-center justify-center text-center gap-2 group"
            >
              <Twitter className="w-5 h-5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
              <span className="text-xs font-mono text-zinc-400 group-hover:text-white">Twitter/X</span>
            </a>
          </div>
        </div>

        {/* Right: Interactive Transmission Terminal */}
        <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#0d0f12] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>COMPOSE TRANSMISSION // ENCRYPTED BRIDGE</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                STATUS: READY
              </span>
            </div>

            {isSent ? (
              <div className="py-16 text-center space-y-3 font-mono">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base text-white">Transmission Prepared</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Redirecting your mail client to initiate communication with Victor.
                </p>
                <button
                  onClick={() => setIsSent(false)}
                  className="text-xs text-blue-400 underline pt-2 cursor-pointer"
                >
                  Compose another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-500 uppercase block mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Ada Lovelace"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full bg-[#08090c] border border-white/10 rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-500 uppercase block mb-1.5">
                      Your Email
                    </label>
                    <input
                      type="email"
                      placeholder="ada@analytical.org"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full bg-[#08090c] border border-white/10 rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-500 uppercase block mb-1.5">
                    Transmission Content
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the architectural challenge, research opportunity, or system you want to discuss..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="w-full bg-[#08090c] border border-white/10 rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none font-sans text-sm"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Direct PGP / Mailto Handshake
                  </span>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-medium text-xs tracking-wider hover:bg-zinc-200 transition-all cursor-pointer active:scale-95 shadow-md"
                  >
                    <span>TRANSMIT</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
