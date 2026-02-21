"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import ChatMessage from "@/components/coach/ChatMessage";
import QuickActions from "@/components/coach/QuickActions";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  rolle: "user" | "assistant";
  inhalt: string;
  isStreaming?: boolean;
}

const WELCOME_MESSAGE =
  "Hallo! Ich bin dein persönlicher KI-Coach. Ich kenne dein Profil, deine Trainingsdaten und deinen Gesundheitszustand. Frag mich alles rund um Training, Ernährung oder Regeneration!";

export default function CoachPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Load conversation history
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
          // Show welcome message
          setMessages([
            {
              id: "welcome",
              rolle: "assistant",
              inhalt: WELCOME_MESSAGE,
            },
          ]);
        }
      } catch {
        // Show welcome message on error
        setMessages([
          {
            id: "welcome",
            rolle: "assistant",
            inhalt: WELCOME_MESSAGE,
          },
        ]);
      } finally {
        setInitialLoading(false);
      }
    }

    loadHistory();
  }, [router]);

  // Send message
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

    // Add placeholder assistant message for streaming
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
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Fehler beim Senden der Nachricht.");
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
              // Stream complete
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, isStreaming: false } : m
                )
              );
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
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, inhalt: fullText } : m
                  )
                );
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten.";
      toast.error(message);
      // Remove empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }

  // Handle quick action
  function handleQuickAction(text: string) {
    if (text) {
      setInput(text);
    }
    // Always focus textarea
    textareaRef.current?.focus();
  }

  // Handle Enter key
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (initialLoading) {
    return (
      <div className="flex flex-col h-[100dvh]">
        <Header title="KI-Coach" showBack />
        <div className="flex items-center justify-center flex-1">
          <div className="animate-pulse text-muted-foreground text-lg">Laden...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      <Header title="KI-Coach" showBack />

      {/* Quick Actions */}
      <div className="pt-3 pb-1 border-b border-border bg-background">
        <QuickActions onAction={handleQuickAction} />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            rolle={message.rolle}
            inhalt={message.inhalt}
            isStreaming={message.isStreaming}
          />
        ))}

        {/* Loading indicator */}
        {isLoading &&
          messages.length > 0 &&
          !messages[messages.length - 1]?.isStreaming && (
            <div className="flex justify-start mb-3">
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground block mb-1">
                  pitee
                </span>
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div
        className={cn(
          "border-t border-border bg-background",
          "px-4 py-3",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        )}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben..."
            rows={1}
            className={cn(
              "flex-1 resize-none",
              "min-h-[48px] max-h-[120px]",
              "rounded-2xl border border-border",
              "bg-card text-card-foreground",
              "px-4 py-3",
              "text-[16px] leading-relaxed",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "transition-all"
            )}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex items-center justify-center",
              "h-12 w-12 shrink-0",
              "rounded-full",
              "bg-primary text-primary-foreground",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "active:scale-95 transition-all",
              "hover:bg-primary/90"
            )}
            aria-label="Nachricht senden"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
