"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AuiConfig, Tools } from "@assistant-ui/react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { AssistantCloud } from "assistant-cloud";
import { useState } from "react";
import toolkit from "@/lib/generative-toolkit";

export function DemoRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cloud] = useState(() => {
    // AssistantCloud builds absolute URLs internally, so a relative
    // "/api/assistant-cloud" would throw. The initializer re-runs on the
    // client during hydration, where the real origin is available.
    const baseUrl =
      typeof window === "undefined"
        ? "http://localhost:3000/api/assistant-cloud"
        : `${window.location.origin}/api/assistant-cloud`;

    return new AssistantCloud({
      baseUrl,
      apiKey: "local",
      userId: "local-user",
      workspaceId: "local-workspace",
      telemetry: false,
    });
  });
  const [transport] = useState(
    () => new AssistantChatTransport({ api: "/api/chat" }),
  );

  const runtime = useChatRuntime({
    transport,
    cloud,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const config = useState(() =>
    AuiConfig({
      tools: Tools({ toolkit }),
    }),
  )[0];

  return (
    <AssistantRuntimeProvider runtime={runtime} config={config}>
      {children}
    </AssistantRuntimeProvider>
  );
}
