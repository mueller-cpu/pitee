import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateStreamingCompletion } from "@/lib/ai/claude-client";
import { COACHING_CHAT_SYSTEM_PROMPT } from "@/lib/ai/system-prompts";
import { buildChatContext } from "@/lib/ai/context-builder";
import { NextRequest, NextResponse } from "next/server";

// GET: Return conversation history (last 50 messages)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }

    // Find existing conversation or return empty
    const conversation = await prisma.aIConversation.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        nachrichten: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ nachrichten: [] });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      nachrichten: conversation.nachrichten.map((n) => ({
        id: n.id,
        rolle: n.rolle,
        inhalt: n.inhalt,
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json({ error: "Interner Serverfehler." }, { status: 500 });
  }
}

// POST: Send message and stream response
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }

    const body = await request.json();
    const { nachricht } = body;

    if (!nachricht || typeof nachricht !== "string" || nachricht.trim().length === 0) {
      return NextResponse.json({ error: "Nachricht darf nicht leer sein." }, { status: 400 });
    }

    // Get or create conversation
    let conversation = await prisma.aIConversation.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          userId: user.id,
          titel: "Coaching Chat",
        },
      });
    }

    // Save user message
    await prisma.aINachricht.create({
      data: {
        aiConversationId: conversation.id,
        rolle: "user",
        inhalt: nachricht.trim(),
      },
    });

    // Update conversation timestamp
    await prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Build context
    const chatContext = await buildChatContext(user.id);

    // Load last 20 messages for conversation history
    const recentMessages = await prisma.aINachricht.findMany({
      where: { aiConversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    // Build messages array for Claude
    const messages: Array<{ role: "user" | "assistant"; content: string }> = recentMessages.map(
      (msg) => ({
        role: msg.rolle as "user" | "assistant",
        content: msg.inhalt,
      })
    );

    // Build system prompt with user context
    const systemPrompt = `${COACHING_CHAT_SYSTEM_PROMPT}

## Aktueller Nutzer-Kontext

${chatContext}`;

    const conversationId = conversation.id;

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = "";

        try {
          const claudeStream = await generateStreamingCompletion(systemPrompt, messages);

          claudeStream.on("text", (text) => {
            fullResponse += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          });

          claudeStream.on("end", async () => {
            try {
              // Save assistant response to DB
              await prisma.aINachricht.create({
                data: {
                  aiConversationId: conversationId,
                  rolle: "assistant",
                  inhalt: fullResponse,
                },
              });

              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (dbError) {
              console.error("Error saving assistant message:", dbError);
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          });

          claudeStream.on("error", (error) => {
            console.error("Claude stream error:", error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: "Fehler bei der Antwortgenerierung." })}\n\n`
              )
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          });
        } catch (error) {
          console.error("Stream setup error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Verbindungsfehler zum KI-Service." })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat POST error:", error);
    return NextResponse.json({ error: "Interner Serverfehler." }, { status: 500 });
  }
}
