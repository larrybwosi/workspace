import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import {
    getSecurityContext,
    checkRateLimit,
    logAssistantActivity,
} from "@/lib/ai/assistant-security";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;
        const { messages } = await req.json();

        // Security & Rate Limiting
        if (!(await checkRateLimit(userId))) {
            return new Response("Too many requests", { status: 429 });
        }

        const securityContext = await getSecurityContext(userId);

        await logAssistantActivity({
            userId,
            action: "chat.start",
            query: messages[messages.length - 1].content,
        });

        const result = await streamText({
            model: google("gemini-3-flash-preview"),
            messages,
            system: `You are Dealio AI, a helpful assistant integrated into the Dealio messaging platform.
      You help users manage their workspaces, channels, and messages.
      Current user: ${session.user.name}.
      Keep responses professional, concise, and focused on helping the user within the platform context.`,
            onFinish: async (event) => {
                await logAssistantActivity({
                    userId,
                    action: "chat.finish",
                    response: event.text,
                });
            },
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Assistant Chat Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
