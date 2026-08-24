import { defineConnector } from "@assistant-ui/react-mcp";

/**
 * Preset connectors offered to users in the MCP config dialog. Users just
 * click Connect (and complete auth); custom servers are added via the form.
 */
export const mcpConnectors = [
  defineConnector({
    id: "deepwiki",
    name: "DeepWiki",
    url: "https://mcp.deepwiki.com/",
    auth: { type: "none" },
  }),
  defineConnector({
    id: "linear",
    name: "Linear",
    url: "https://mcp.linear.app",
    auth: { type: "oauth", scopes: ["read"] },
  }),
];
