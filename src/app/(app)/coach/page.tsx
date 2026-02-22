"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  rolle: "user" | "assistant";
  inhalt: string;
  isStreaming?: boolean;
}

const WELCOME_MESSAGE =
  "Hallo! Ich bin dein persönlicher <span class=\"text-primary font-semibold\">KI-Coach</span>. Ich kenne dein Profil, deine Trainingsdaten und deinen Gesundheitszustand. Frag mich alles rund um Training, Ernährung oder Regeneration!";

function renderMarkdown(text: string) {
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((paragraph, pIdx) => {
    const lines = paragraph.split("\n");
    const isListBlock = lines.every(
      (line) => line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim() === ""
    );

    if (isListBlock) {
      const listItems = lines.filter(
        (line) => line.trim().startsWith("- ") || line.trim().startsWith("* ")
      );
      return (
        <ul key={pIdx} className="space-y-4 my-4">
          {listItems.map((item, i) => {
            // Parse bold title and description
            const rawText = item.replace(/^[\s]*[-*]\s/, "");
            let title = "";
            let desc = rawText;
            const boldMatch = rawText.match(/^\*\*([^*]+)\*\*(.*)/);
            if (boldMatch) {
              title = boldMatch[1].trim();
              desc = boldMatch[2].replace(/^:/, '').trim(); // Remove leading colon if exists
            }

            // Extract optional icon hints based on text (for styling dynamically)
            let icon = "info";
            let colorClass = "bg-primary/10 border-primary/20 text-primary";
            if (title.toLowerCase().includes("pause") || title.toLowerCase().includes("achtung")) {
              icon = "block";
              colorClass = "bg-red-500/10 border-red-500/20 text-red-400";
            } else if (title.toLowerCase().includes("ernährung") || title.toLowerCase().includes("protein")) {
              icon = "restaurant";
              colorClass = "bg-green-500/10 border-green-500/20 text-green-400";
            } else if (title.toLowerCase().includes("alternative") || title.toLowerCase().includes("training")) {
              icon = "fitness_center";
            } else if (title.toLowerCase().includes("mobilisation") || title.toLowerCase().includes("schlaf")) {
              icon = "spa";
              colorClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
            }

            return (
              <li key={i} className="flex gap-4 items-start">
                <div className={cn("mt-1 h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border", colorClass)}>
                  <span className="material-symbols-outlined text-xl ai-icon-neon">{icon}</span>
                </div>
                <div>
                  {title && <strong className="text-white block mb-0.5">{title}</strong>}
                  <span className="text-slate-400 text-base">{desc}</span>
                </div>
              </li>
            );
          })}
        </ul>
      );
    }

    const headingMatch = paragraph.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      return (
        <Tag key={pIdx} className="text-white font-semibold mt-4 mb-2">
          {renderInlineMarkdown(headingText)}
        </Tag>
      );
    }

    return (
      <p key={pIdx} className="my-2 text-slate-200">
        {lines.map((line, lIdx) => (
          <span key={lIdx}>
            {lIdx > 0 && <br />}
            {renderInlineMarkdown(line)}
          </span>
        ))}
      </p>
    );
  });
}

function renderInlineMarkdown(text: string) {
  if (text.includes("span class")) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }

  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function ChatMessageComponent({ rolle, inhalt, isStreaming = false }: Message) {
  const isUser = rolle === "user";

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-4 w-full">
        <div className="flex flex-col gap-2 max-w-[85%] items-end">
          <div className="bg-user-bubble text-white rounded-2xl rounded-tr-none px-5 py-4 user-bubble-shadow">
            <p className="text-[17px] font-medium leading-relaxed break-words">{inhalt}</p>
          </div>
          {!isStreaming && <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mr-1">Gelesen</span>}
        </div>
        <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-surface-dark border border-user-bubble/30">
          <span className="material-symbols-outlined text-slate-400">person</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-slate-700 bg-[#0A0C10] flex items-center justify-center text-primary">
        <span className="material-symbols-outlined text-2xl ai-icon-neon">smart_toy</span>
      </div>
      <div className="flex flex-col gap-3 max-w-[88%]">
        <div className="bg-surface-dark rounded-2xl rounded-tl-none px-6 py-5 border border-slate-800">
          <div className="space-y-4 text-[17px] leading-relaxed">
            {renderMarkdown(inhalt)}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-0.5 bg-slate-400 animate-pulse rounded-sm align-text-bottom" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoachPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_ACTIONS = [
    "Wie verbessere ich meinen Schlaf?",
    "Protein-Tipps für heute",
    "Training anpassen",
    "Supplement-Empfehlung"
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/ai/chat");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Fehler beim Laden");

        const data = await res.json();
        if (data.nachrichten && data.nachrichten.length > 0) {
          setMessages(
            data.nachrichten.map((n: { id: string; rolle: string; inhalt: string }) => ({
              id: n.id,
              rolle: n.rolle as "user" | "assistant",
              inhalt: n.inhalt,
            }))
          );
        } else {
          setMessages([{ id: "welcome", rolle: "assistant", inhalt: WELCOME_MESSAGE }]);
        }
      } catch {
        setMessages([{ id: "welcome", rolle: "assistant", inhalt: WELCOME_MESSAGE }]);
      } finally {
        setInitialLoading(false);
      }
    }

    loadHistory();
  }, [router]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      rolle: "user",
      inhalt: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, rolle: "assistant", inhalt: "", isStreaming: true },
    ]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nachricht: text }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Senden der Nachricht.");
      }

      if (!response.body) {
        throw new Error("Keine Streaming-Antwort erhalten.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m));
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                toast.error(parsed.error);
                setMessages((prev) => prev.filter((m) => m.id !== assistantId));
                break;
              }
              if (parsed.text) {
                fullText += parsed.text;
                setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, inhalt: fullText } : m));
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  if (initialLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0A0C10] text-slate-100 pb-20">
        <header className="sticky top-0 z-50 bg-[#0A0C10]/90 backdrop-blur-xl border-b border-slate-800/60 w-full mb-4">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <span className="material-symbols-outlined text-2xl ai-icon-neon">smart_toy</span>
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">pitee Coach</h1>
                <p className="text-[11px] font-medium text-primary/80 uppercase tracking-[0.15em]">Laden...</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-slate-500">Chats werden geladen...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0C10] text-slate-100 font-display pt-safe pb-[80px]">
      <header className="sticky top-0 z-50 bg-[#0A0C10]/90 backdrop-blur-xl border-b border-slate-800/60 w-full mb-4">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <span className="material-symbols-outlined text-2xl ai-icon-neon">smart_toy</span>
              </div>
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#0A0C10]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">pitee Coach</h1>
              <p className="text-[11px] font-medium text-primary/80 uppercase tracking-[0.15em]">System Aktiv</p>
            </div>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-dark border border-slate-700 text-slate-400">
            <span className="material-symbols-outlined text-xl">more_vert</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 space-y-10 max-w-2xl mx-auto w-full">
        {messages.map((m) => (
          <ChatMessageComponent key={m.id} {...m} />
        ))}
        {isLoading && messages.length > 0 && !messages[messages.length - 1]?.isStreaming && (
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-slate-700 bg-[#0A0C10] flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl ai-icon-neon">smart_toy</span>
            </div>
            <div className="flex flex-col gap-3 max-w-[88%]">
              <div className="bg-surface-dark rounded-2xl rounded-tl-none px-6 py-5 border border-slate-800">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="fixed bottom-[80px] left-0 right-0 z-40 bg-[#0A0C10]/95 backdrop-blur-xl border-t border-slate-800/80 pb-safe">
        <div className="overflow-x-auto no-scrollbar py-4 px-4">
          <div className="flex gap-3 min-w-max px-2">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => { setInput(action); }}
                className="px-5 py-2.5 rounded-xl bg-surface-dark border border-slate-700 text-sm font-medium text-slate-300 hover:border-primary/50 hover:text-white transition-all chip-glow"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 pb-6">
          <div className="flex items-center gap-3 bg-surface-dark/50 rounded-[20px] border border-slate-700/50 p-2 pl-4 shadow-2xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none focus:ring-0 text-[17px] text-white placeholder:text-slate-500 py-2 outline-none"
              placeholder="Frag deinen Coach..."
              type="text"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-11 w-11 rounded-2xl bg-primary text-[#0A0C10] flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.4)] active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              <span className="material-symbols-outlined font-bold">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
