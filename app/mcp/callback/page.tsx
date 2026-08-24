"use client";

import { useRouter } from "next/navigation";
import { McpOAuthCallback } from "@assistant-ui/react-mcp";

import { McpProvider } from "@/components/mcp/mcp-provider";

export default function McpOAuthCallbackPage() {
  const router = useRouter();

  return (
    <McpProvider>
      <main className="text-muted-foreground flex h-dvh items-center justify-center text-sm">
        <McpOAuthCallback
          onComplete={() => router.replace("/")}
          onError={() => router.replace("/")}
        >
          {({ status, error }) =>
            status === "error" ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-destructive">Authorization failed.</p>
                <p className="max-w-sm break-all text-xs">{error?.message}</p>
              </div>
            ) : (
              <p>Completing sign-in…</p>
            )
          }
        </McpOAuthCallback>
      </main>
    </McpProvider>
  );
}
