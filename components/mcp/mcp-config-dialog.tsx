"use client";

import { useState, type FC } from "react";
import { useAuiState } from "@assistant-ui/react";
import {
  McpAddFormPrimitive,
  McpElicitationPrimitive,
  McpManagerPrimitive,
  McpServerPrimitive,
  type MCPConnectionState,
} from "@assistant-ui/react-mcp";
import { ArrowUpRightIcon, CableIcon, PlusIcon } from "lucide-react";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const inputClasses =
  "bg-muted/60 focus-visible:bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full min-w-0 rounded-lg border border-transparent px-3 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-1";

const selectClasses = cn(inputClasses, "appearance-none");

const statusLabels: Record<MCPConnectionState, string> = {
  disconnected: "Disconnected",
  authRequired: "Sign-in required",
  authPending: "Finishing sign-in…",
  connecting: "Connecting…",
  connected: "Connected",
  error: "Error",
};

export const McpConfigDialog: FC = () => {
  const [addFormOpen, setAddFormOpen] = useState(false);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <TooltipIconButton tooltip="MCP servers" side="bottom">
            <CableIcon className="size-4" />
            <span className="sr-only">Manage MCP servers</span>
          </TooltipIconButton>
        }
      />
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>MCP Servers</DialogTitle>
          <DialogDescription>
            Connect tools to your assistant. Connected tools become available
            in chat automatically.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mx-1 max-h-[60dvh]">
          <div className="flex flex-col gap-4 px-1 py-1">
            <section className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-medium">
                Connectors
              </h3>
              <McpManagerPrimitive.Connectors>
                {() => <ServerCard />}
              </McpManagerPrimitive.Connectors>
            </section>

            <CustomServersSection />

            {addFormOpen ? (
              <AddServerForm onDone={() => setAddFormOpen(false)} />
            ) : (
              <McpManagerPrimitive.AddCustomTrigger
                className={buttonVariants({ variant: "outline" })}
                onClick={() => setAddFormOpen(true)}
              >
                <PlusIcon data-icon="inline-start" />
                Add custom server
              </McpManagerPrimitive.AddCustomTrigger>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const CustomServersSection: FC = () => {
  const isHydrated = useAuiState((s) => s.mcp.isHydrated);
  const customServers = useAuiState((s) => s.mcp.customServers);

  if (!isHydrated) return null;
  if (customServers.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium">Your servers</h3>
      <McpManagerPrimitive.CustomServers>
        {() => <ServerCard />}
      </McpManagerPrimitive.CustomServers>
    </section>
  );
};

const ServerCard: FC = () => {
  const server = useAuiState((s) => s.mcpServer);

  return (
    <McpServerPrimitive.Root
      className="rounded-xl border border-[#e5e5e5] p-3 transition-colors dark:border-[#2a2a2a]"
      data-state={server.connectionState}
    >
      <div className="flex items-center gap-3">
        <div className="bg-muted flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {server.icon ? (
            <McpServerPrimitive.Icon className="size-5 rounded object-contain" />
          ) : (
            <CableIcon className="text-muted-foreground size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <McpServerPrimitive.Name className="truncate text-sm font-medium" />
            <StatusBadge />
          </div>
          <span className="text-muted-foreground block truncate text-xs">
            {server.url}
          </span>
        </div>
      </div>

      {server.connectionState === "connected" && server.tools.length > 0 && (
        <p
          className="text-muted-foreground mt-2 truncate text-xs"
          title={server.tools.map((tool) => tool.name).join(", ")}
        >
          {server.tools.length} tool{server.tools.length === 1 ? "" : "s"}{" "}
          available
        </p>
      )}

      <McpServerPrimitive.Error className="mt-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-2 text-xs text-destructive" />

      <ServerActions />

      <ElicitationForms />
    </McpServerPrimitive.Root>
  );
};

const StatusBadge: FC = () => {
  const connectionState = useAuiState((s) => s.mcpServer.connectionState);

  return (
    <span
      data-state={connectionState}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] leading-none font-medium",
        "data-[state=connected]:bg-green-500/10 data-[state=connected]:text-green-600 dark:data-[state=connected]:text-green-400",
        "data-[state=disconnected]:bg-muted-foreground/10 data-[state=disconnected]:text-muted-foreground",
        "data-[state=connecting]:bg-amber-500/10 data-[state=connecting]:text-amber-600 dark:data-[state=connecting]:text-amber-400",
        "data-[state=authPending]:bg-amber-500/10 data-[state=authPending]:text-amber-600 dark:data-[state=authPending]:text-amber-400",
        "data-[state=authRequired]:bg-blue-500/10 data-[state=authRequired]:text-blue-600 dark:data-[state=authRequired]:text-blue-400",
        "data-[state=error]:bg-destructive/10 data-[state=error]:text-destructive",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabels[connectionState]}
    </span>
  );
};

const ConnectLabel: FC = () => {
  const state = useAuiState((s) => s.mcpServer.connectionState);
  return <>{state === "authRequired" ? "Sign in" : "Connect"}</>;
};

const ServerActions: FC = () => (
  <div className="mt-2.5 flex flex-wrap items-center gap-2">
    <McpServerPrimitive.ConnectButton
      className={buttonVariants({ variant: "default", size: "sm" })}
    >
      <ConnectLabel />
    </McpServerPrimitive.ConnectButton>
    <McpServerPrimitive.DisconnectButton
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      Disconnect
    </McpServerPrimitive.DisconnectButton>
    <McpServerPrimitive.OAuthLink
      className={buttonVariants({
        variant: "outline",
        size: "sm",
        className: "[&_svg:not([class*='size-'])]:size-3.5",
      })}
    >
      Authorize
      <ArrowUpRightIcon />
    </McpServerPrimitive.OAuthLink>
    <McpServerPrimitive.RemoveButton
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className: "ml-auto text-destructive hover:text-destructive",
      })}
    >
      Remove
    </McpServerPrimitive.RemoveButton>
  </div>
);

type ElicitationFieldSchema = {
  type?: string;
  enum?: string[];
  description?: string;
};

const ElicitationForms: FC = () => (
  <McpElicitationPrimitive.Items>
    {() => (
      <McpElicitationPrimitive.Root className="mt-3 flex flex-col gap-2.5 rounded-lg bg-muted/50 p-3">
        <McpElicitationPrimitive.Message className="text-sm font-medium" />
        <McpElicitationPrimitive.Error className="flex items-start gap-1.5 text-xs text-destructive" />
        <McpElicitationPrimitive.Fields>
          {({ name, schema, value, setValue }) => (
            <ElicitationField
              name={name}
              schema={schema as ElicitationFieldSchema}
              value={value}
              setValue={setValue}
            />
          )}
        </McpElicitationPrimitive.Fields>
        <div className="flex items-center justify-end gap-2">
          <McpElicitationPrimitive.Cancel
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Cancel
          </McpElicitationPrimitive.Cancel>
          <McpElicitationPrimitive.Decline
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Decline
          </McpElicitationPrimitive.Decline>
          <McpElicitationPrimitive.Accept
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Submit
          </McpElicitationPrimitive.Accept>
        </div>
      </McpElicitationPrimitive.Root>
    )}
  </McpElicitationPrimitive.Items>
);

type ElicitationFieldProps = {
  name: string;
  schema: ElicitationFieldSchema;
  value: unknown;
  setValue: (value: unknown) => void;
};

const ElicitationField: FC<ElicitationFieldProps> = ({
  name,
  schema,
  value,
  setValue,
}) => {
  const label = (
    <span className="mb-1 block text-xs font-medium capitalize">
      {name}
      {schema.description && (
        <span className="text-muted-foreground ml-1.5 font-normal">
          {schema.description}
        </span>
      )}
    </span>
  );

  if (schema.type === "boolean") {
    return (
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => setValue(event.target.checked)}
          className="accent-primary size-4"
        />
        <span className="font-medium">{name}</span>
      </label>
    );
  }

  if (schema.enum) {
    const members = new Set(schema.enum);
    const selected = typeof value === "string" ? value : "";
    return (
      <label className="block">
        {label}
        <select
          value={selected}
          onChange={(event) =>
            setValue(members.has(event.target.value) ? event.target.value : "")
          }
          className={selectClasses}
        >
          {!members.has("") && <option value="">Select…</option>}
          {schema.enum.map((member) => (
            <option key={member} value={member}>
              {member}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="block">
      {label}
      <input
        name={name}
        type="text"
        inputMode={
          schema.type === "number" || schema.type === "integer"
            ? "decimal"
            : undefined
        }
        value={typeof value === "string" ? value : ""}
        onChange={(event) => setValue(event.target.value)}
        placeholder={schema.type === "string" ? undefined : name}
        className={inputClasses}
      />
    </label>
  );
};

const AddServerForm: FC<{ onDone: () => void }> = ({ onDone }) => (
  <McpAddFormPrimitive.Root
    onSubmitted={onDone}
    onCancel={onDone}
    className="flex flex-col gap-3 rounded-xl border border-[#e5e5e5] p-3 dark:border-[#2a2a2a]"
  >
    <h3 className="text-sm font-medium">Add custom server</h3>

    <label className="block">
      <span className="mb-1 block text-xs font-medium">Name</span>
      <McpAddFormPrimitive.NameField
        className={inputClasses}
        placeholder="My server"
      />
    </label>

    <label className="block">
      <span className="mb-1 block text-xs font-medium">URL</span>
      <McpAddFormPrimitive.UrlField
        className={inputClasses}
        placeholder="https://example.com/mcp"
      />
    </label>

    <label className="block">
      <span className="mb-1 block text-xs font-medium">Authentication</span>
      <McpAddFormPrimitive.AuthSelect className={selectClasses} />
    </label>

    {/* Default bearer/oauth inputs are unstyled; style them by attribute. */}
    <div className="[&_[data-mcp-auth-field]]:h-9 [&_[data-mcp-auth-field]]:w-full [&_[data-mcp-auth-field]]:rounded-lg [&_[data-mcp-auth-field]]:border [&_[data-mcp-auth-field]]:border-transparent [&_[data-mcp-auth-field]]:bg-muted/60 [&_[data-mcp-auth-field]]:px-3 [&_[data-mcp-auth-field]]:text-sm [&_[data-mcp-auth-field]]:transition-colors [&_[data-mcp-auth-field]]:outline-none [&_[data-mcp-auth-field]]:placeholder:text-muted-foreground">
      <McpAddFormPrimitive.AuthFields />
    </div>

    <McpAddFormPrimitive.Error className="rounded-lg bg-destructive/10 px-2.5 py-2 text-xs text-destructive" />

    <div className="flex items-center justify-end gap-2">
      <McpAddFormPrimitive.Cancel
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Cancel
      </McpAddFormPrimitive.Cancel>
      <McpAddFormPrimitive.Submit
        className={buttonVariants({ variant: "default", size: "sm" })}
      >
        Add
      </McpAddFormPrimitive.Submit>
    </div>
  </McpAddFormPrimitive.Root>
);
