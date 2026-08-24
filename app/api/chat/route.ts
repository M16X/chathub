import {
  convertToModelMessages,
  streamText,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { DEFAULT_MODEL_ID } from "@/lib/model";
import { openCodeProviderConfig } from "@/lib/provider";

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages as unknown[] | undefined;

  if (!messages) {
    return new Response("Missing messages in request body", { status: 400 });
  }

  const openaiCompatible = createOpenAICompatible({
    name: openCodeProviderConfig.name,
    baseURL: openCodeProviderConfig.baseURL,
    apiKey: openCodeProviderConfig.apiKey,
  });

  const result = streamText({
    model: openaiCompatible(DEFAULT_MODEL_ID),
    messages: await convertToModelMessages(messages as any),
  });

  return result.toUIMessageStreamResponse();
}
