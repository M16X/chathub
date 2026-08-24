"use client";

import { AuiConfig, AuiProvider, useAui } from "@assistant-ui/react";
import { McpManagerResource } from "@assistant-ui/react-mcp";

import { mcpConnectors } from "@/lib/mcp-connectors";

/**
 * Mounts the MCP manager as an `mcp` scope on top of the surrounding chat
 * runtime. Connected servers register their tools as frontend tools, so the
 * chat sees them automatically.
 */
export function McpProvider({ children }: { children: React.ReactNode }) {
  const aui = useAui();
  const config = AuiConfig({
    mcp: McpManagerResource({
      connectors: mcpConnectors,
      connectionTimeout: 15_000,
    }),
  });

  return (
    <AuiProvider extends={aui} config={config}>
      {children}
    </AuiProvider>
  );
}
