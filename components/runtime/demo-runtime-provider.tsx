"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/ai-sdk";
import { useRemoteThreadListRuntime } from "@assistant-ui/core/react";
import { localStorageThreadAdapter } from "./local-storage-thread-adapter";

export function DemoRuntimeProvider({ children }: { children: React.ReactNode }) {
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: () =>
      useChatRuntime({
        transport: new AssistantChatTransport({ api: "/api/chat" }),
      }),
    adapter: localStorageThreadAdapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
