import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { AISDKToolkit } from "@assistant-ui/ai-sdk";
import { DEFAULT_MODEL_ID } from "@/lib/model";
import { openCodeProviderConfig } from "@/lib/provider";
import toolkit from "@/lib/generative-toolkit";

export const maxDuration = 30;

const aiToolkit = new AISDKToolkit({ toolkit });

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages as unknown[] | undefined;

  if (!messages) {
    return new Response("Missing messages in request body", { status: 400 });
  }

  const modelFromConfig = body.config?.modelName as string | undefined;
  const modelFromBody =
    (body.model as string | undefined) ??
    (body.modelName as string | undefined) ??
    (body.modelId as string | undefined);

  const modelId =
    modelFromConfig ?? modelFromBody ?? DEFAULT_MODEL_ID ?? "hy3-free";

  const openaiCompatible = createOpenAICompatible({
    name: openCodeProviderConfig.name,
    baseURL: openCodeProviderConfig.baseURL,
    apiKey: openCodeProviderConfig.apiKey,
  });

  const result = streamText({
    model: openaiCompatible(modelId),
    messages: await convertToModelMessages(messages as any),
    stopWhen: stepCountIs(10),
    tools: await aiToolkit.tools({ frontend: body.tools }),
  });

  return result.toUIMessageStreamResponse();
}
