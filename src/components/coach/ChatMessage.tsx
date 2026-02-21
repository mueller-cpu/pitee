"use client";

import { cn } from "@/lib/utils";

interface ChatMessageProps {
  rolle: "user" | "assistant";
  inhalt: string;
  isStreaming?: boolean;
}

function renderMarkdown(text: string) {
  // Split into paragraphs by double newlines
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((paragraph, pIdx) => {
    // Check if the paragraph is a list (lines starting with - or *)
    const lines = paragraph.split("\n");
    const isListBlock = lines.every(
      (line) => line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim() === ""
    );

    if (isListBlock) {
      const listItems = lines.filter(
        (line) => line.trim().startsWith("- ") || line.trim().startsWith("* ")
      );
      return (
        <ul key={pIdx} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, i) => (
            <li key={i}>{renderInlineMarkdown(item.replace(/^[\s]*[-*]\s/, ""))}</li>
          ))}
        </ul>
      );
    }

    // Check if it's a heading (### or ## or #)
    const headingMatch = paragraph.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      return (
        <Tag key={pIdx} className="font-semibold mt-3 mb-1">
          {renderInlineMarkdown(headingText)}
        </Tag>
      );
    }

    // Regular paragraph - handle single newlines as line breaks
    return (
      <p key={pIdx} className="my-1.5">
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
  // Handle **bold** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function ChatMessage({ rolle, inhalt, isStreaming = false }: ChatMessageProps) {
  const isUser = rolle === "user";

  return (
    <div className={cn("flex w-full mb-3", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border text-card-foreground rounded-bl-md"
        )}
      >
        {!isUser && (
          <span className="text-xs font-medium text-muted-foreground block mb-1">pitee</span>
        )}
        <div className={cn("text-[15px] leading-relaxed", isUser && "text-right")}>
          {isUser ? inhalt : renderMarkdown(inhalt)}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/70 animate-pulse rounded-sm align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  );
}
