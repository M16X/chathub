import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { DEFAULT_MODEL_ID } from "@/lib/model";
import { openCodeProviderConfig } from "@/lib/provider";
import { updateThread } from "@/lib/db";

export const maxDuration = 30;

type TitleMessage = {
  role?: string;
  content?: readonly { type?: string; text?: string }[];
};

const conversationTranscript = (messages: TitleMessage[]): string =>
  messages
    .map((message) => ({
      role: message.role ?? "user",
      text: (message.content ?? [])
        .filter((part) => part.type === "text" && part.text)
        .map((part) => part.text)
        .join(" ")
        .trim(),
    }))
    .filter((entry) => entry.text.length > 0)
    .map((entry) => `${entry.role}: ${entry.text}`)
    .join("\n")
    .slice(0, 2000);

export async function POST(req: Request) {
  const body = await req.json();
  const messages = (body.messages ?? []) as TitleMessage[];
  const threadId = body.thread_id as string | undefined;

  const openaiCompatible = createOpenAICompatible({
    name: openCodeProviderConfig.name,
    baseURL: openCodeProviderConfig.baseURL,
    apiKey: openCodeProviderConfig.apiKey,
  });

  const result = streamText({
    model: openaiCompatible(DEFAULT_MODEL_ID ?? "hy3-free"),
    system:
      "You generate short chat thread titles. Reply with the title only: " +
      "3-6 words, no quotes, no trailing punctuation, no explanation.",
    prompt: `Summarize this conversation with a short title:\n\n${conversationTranscript(messages)}`,
  });

  // The client applies the streamed title to its own state; persist it here so
  // it survives reloads even if the client never sends a rename.
  Promise.resolve(result.text)
    .then((text) => {
      const title = text.trim();
      if (title && threadId) updateThread(threadId, { title });
    })
    .catch(() => {});

  return result.toTextStreamResponse();
}
