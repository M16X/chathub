import {
  convertToModelMessages,
  streamText,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { DEFAULT_MODEL_ID } from "@/lib/model";
import {
  openCodeProviderConfig,
} from "@/lib/provider";

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
    instructions: 'You an helpful learning assistant. Render math expressions inside $ and $$ for inline and block expressions.',
    messages: await convertToModelMessages(messages as any),
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === "finish") {
        return {
          usage: part.totalUsage,
        };
      }
      if (part.type === "finish-step") {
        return {
          modelId: part.response.modelId,
        };
      }
      return undefined;
    },
  });
}
