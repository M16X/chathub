"use client";

import {
  RuntimeAdapterProvider,
  useAui,
  type RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
} from "@assistant-ui/react";
import { createAssistantStream } from "assistant-stream";
import { useMemo } from "react";

const THREADS_KEY = "@assistant-ui:threads";
const messagesKey = (threadId: string) => `@assistant-ui:messages:${threadId}`;

type StoredThread = {
  remoteId: string;
  status: "regular" | "archived";
  title?: string;
  custom?: Record<string, unknown>;
};

type StoredRow = {
  id: string;
  parent_id: string | null;
  format: string;
  content: Record<string, unknown>;
};

function parseThreads(raw: string | null): StoredThread[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is StoredThread =>
        !!t && typeof t === "object" && typeof t.remoteId === "string",
    );
  } catch {
    return [];
  }
}

function parseRows(raw: string | null): StoredRow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is StoredRow => !!r && typeof r === "object" && typeof r.id === "string",
    );
  } catch {
    return [];
  }
}

function useThreadListAdapters() {
  const aui = useAui();
  const history = useMemo<ThreadHistoryAdapter>(
    () => ({
      async load() {
        return { messages: [] };
      },
      async append() {},
      withFormat: (fmt) => ({
        async load() {
          const { remoteId } = aui.threadListItem.getState();
          if (!remoteId) return { messages: [] };
          const rows = parseRows(window.localStorage.getItem(messagesKey(remoteId)));
          return {
            messages: rows.map(
              (row) => fmt.decode(row as Parameters<typeof fmt.decode>[0]),
            ),
          };
        },
        async append(item) {
          const { remoteId } = await aui.threadListItem.initialize();
          const key = messagesKey(remoteId);
          const rows = parseRows(window.localStorage.getItem(key));
          rows.push({
            id: fmt.getId(item.message),
            parent_id: item.parentId,
            format: fmt.format,
            content: fmt.encode(item),
          });
          window.localStorage.setItem(key, JSON.stringify(rows));
        },
      }),
    }),
    [aui],
  );
  return useMemo(() => ({ history }), [history]);
}

export const localStorageThreadAdapter: RemoteThreadListAdapter = {
  async list() {
    return { threads: parseThreads(window.localStorage.getItem(THREADS_KEY)) };
  },
  async initialize(threadId) {
    const threads = parseThreads(window.localStorage.getItem(THREADS_KEY));
    if (!threads.some((t) => t.remoteId === threadId)) {
      threads.unshift({ remoteId: threadId, status: "regular" });
      window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    }
    return { remoteId: threadId };
  },
  async rename(remoteId, title) {
    const threads = parseThreads(window.localStorage.getItem(THREADS_KEY));
    const thread = threads.find((t) => t.remoteId === remoteId);
    if (thread) {
      thread.title = title;
      window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    }
  },
  async archive(remoteId) {
    const threads = parseThreads(window.localStorage.getItem(THREADS_KEY));
    const thread = threads.find((t) => t.remoteId === remoteId);
    if (thread) {
      thread.status = "archived";
      window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    }
  },
  async unarchive(remoteId) {
    const threads = parseThreads(window.localStorage.getItem(THREADS_KEY));
    const thread = threads.find((t) => t.remoteId === remoteId);
    if (thread) {
      thread.status = "regular";
      window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    }
  },
  async delete(remoteId) {
    const threads = parseThreads(window.localStorage.getItem(THREADS_KEY));
    window.localStorage.setItem(
      THREADS_KEY,
      JSON.stringify(threads.filter((t) => t.remoteId !== remoteId)),
    );
    window.localStorage.removeItem(messagesKey(remoteId));
  },
  async fetch(remoteId) {
    const thread = parseThreads(window.localStorage.getItem(THREADS_KEY)).find(
      (t) => t.remoteId === remoteId,
    );
    if (!thread) {
      throw new Error(`Stored thread "${remoteId}" not found while fetching thread metadata.`);
    }
    return {
      status: thread.status,
      remoteId: thread.remoteId,
      title: thread.title,
      custom: thread.custom,
    };
  },
  async generateTitle() {
    return createAssistantStream(() => {});
  },
  unstable_useAdapters: useThreadListAdapters,
  unstable_Provider({ children }) {
    const adapters = useThreadListAdapters();
    return <RuntimeAdapterProvider adapters={adapters}>{children}</RuntimeAdapterProvider>;
  },
};
