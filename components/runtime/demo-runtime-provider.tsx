"use client";

import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/ai-sdk";
import { useRemoteThreadListRuntime } from "@assistant-ui/core/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";

import { McpProvider } from "@/components/mcp/mcp-provider";
import { localStorageThreadAdapter } from "./local-storage-thread-adapter";

export function DemoRuntimeProvider({ children }: { children: React.ReactNode }) {
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: () =>
      useChatRuntime({
        transport: new AssistantChatTransport({ api: "/api/chat" }),
        // Sends completed frontend tool results (e.g. MCP tools) back so the
        // model can continue after a tool call.
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      }),
    adapter: localStorageThreadAdapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <McpProvider>{children}</McpProvider>
    </AssistantRuntimeProvider>
  );
}
