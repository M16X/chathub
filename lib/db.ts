import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = path.join(process.cwd(), ".data");
mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "chathub.db"));

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    last_message_at TEXT NOT NULL,
    metadata TEXT,
    external_id TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    parent_id TEXT,
    height INTEGER NOT NULL,
    format TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_thread_height
    ON messages (thread_id, height);

  CREATE INDEX IF NOT EXISTS idx_threads_listing
    ON threads (is_archived, last_message_at DESC, id DESC);
`);

export type ThreadRow = {
  id: string;
  title: string;
  last_message_at: string;
  metadata: string | null;
  external_id: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  thread_id: string;
  parent_id: string | null;
  height: number;
  format: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const now = () => new Date().toISOString();

export type CloudThread = {
  id: string;
  title: string;
  last_message_at: string;
  metadata: unknown;
  external_id: string | null;
  project_id: string;
  workspace_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export function toCloudThread(thread: ThreadRow): CloudThread {
  return {
    id: thread.id,
    title: thread.title,
    last_message_at: thread.last_message_at,
    metadata: thread.metadata === null ? null : JSON.parse(thread.metadata),
    external_id: thread.external_id,
    project_id: "local",
    workspace_id: "local",
    is_archived: thread.is_archived === 1,
    created_at: thread.created_at,
    updated_at: thread.updated_at,
  };
}

export type CloudMessage = {
  id: string;
  parent_id: string | null;
  height: number;
  format: string;
  content: unknown;
  created_at: string;
  updated_at: string;
};

export function toCloudMessage(message: MessageRow): CloudMessage {
  return {
    id: message.id,
    parent_id: message.parent_id,
    height: message.height,
    format: message.format,
    content: JSON.parse(message.content),
    created_at: message.created_at,
    updated_at: message.updated_at,
  };
}

export type ListThreadsOptions = {
  isArchived?: boolean;
  limit?: number;
  after?: string;
};

export function listThreads({
  isArchived,
  limit,
  after,
}: ListThreadsOptions = {}): ThreadRow[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  clauses.push("is_archived = ?");
  params.push(isArchived ? 1 : 0);

  if (after) {
    const cursor = db
      .prepare("SELECT last_message_at FROM threads WHERE id = ?")
      .get(after) as { last_message_at: string } | undefined;
    if (cursor) {
      clauses.push("(last_message_at < ? OR (last_message_at = ? AND id < ?))");
      params.push(cursor.last_message_at, cursor.last_message_at, after);
    }
  }

  const sql = `
    SELECT * FROM threads
    WHERE ${clauses.join(" AND ")}
    ORDER BY last_message_at DESC, id DESC
    LIMIT ?
  `;
  params.push(limit ?? 20);
  return db.prepare(sql).all(...params) as unknown as ThreadRow[];
}

export function getThread(id: string): ThreadRow | undefined {
  return db.prepare("SELECT * FROM threads WHERE id = ?").get(id) as
    | ThreadRow
    | undefined;
}

export function createThread(input: {
  title?: string;
  lastMessageAt: string;
  metadata?: unknown;
  externalId?: string;
}): string {
  const id = randomUUID();
  const timestamp = now();
  db.prepare(
    `INSERT INTO threads (id, title, last_message_at, metadata, external_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.title ?? "",
    input.lastMessageAt,
    input.metadata === undefined ? null : JSON.stringify(input.metadata),
    input.externalId ?? null,
    timestamp,
    timestamp,
  );
  return id;
}

export function updateThread(
  id: string,
  patch: {
    title?: string;
    lastMessageAt?: string;
    metadata?: unknown;
    isArchived?: boolean;
  },
): boolean {
  const thread = getThread(id);
  if (!thread) return false;

  const metadata =
    patch.metadata === undefined
      ? thread.metadata
      : JSON.stringify(patch.metadata);

  db.prepare(
    `UPDATE threads
     SET title = ?, last_message_at = ?, metadata = ?, is_archived = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    patch.title ?? thread.title,
    patch.lastMessageAt ?? thread.last_message_at,
    metadata,
    (patch.isArchived ?? thread.is_archived === 1) ? 1 : 0,
    now(),
    id,
  );
  return true;
}

export function deleteThread(id: string): boolean {
  const result = db.prepare("DELETE FROM threads WHERE id = ?").run(id);
  return result.changes > 0;
}

export function listMessages(
  threadId: string,
  format?: string,
): MessageRow[] {
  // The cloud client reverses this list into chronological order, so rows
  // must come back newest-first.
  if (format) {
    return db
      .prepare(
        "SELECT * FROM messages WHERE thread_id = ? AND format = ? ORDER BY height DESC",
      )
      .all(threadId, format) as unknown as MessageRow[];
  }
  return db
    .prepare("SELECT * FROM messages WHERE thread_id = ? ORDER BY height DESC")
    .all(threadId) as unknown as MessageRow[];
}

export function createMessage(
  threadId: string,
  input: { parentId: string | null; format: string; content: unknown },
): string | undefined {
  if (!getThread(threadId)) return undefined;

  const nextHeight =
    (db
      .prepare(
        "SELECT COALESCE(MAX(height), -1) AS max_height FROM messages WHERE thread_id = ?",
      )
      .get(threadId) as { max_height: number }).max_height + 1;

  const id = randomUUID();
  const timestamp = now();
  db.prepare(
    `INSERT INTO messages (id, thread_id, parent_id, height, format, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    threadId,
    input.parentId,
    nextHeight,
    input.format,
    JSON.stringify(input.content),
    timestamp,
    timestamp,
  );

  // Keep the thread list ordered by recency of conversation.
  db.prepare(
    "UPDATE threads SET last_message_at = ?, updated_at = ? WHERE id = ?",
  ).run(timestamp, timestamp, threadId);

  return id;
}

export function updateMessage(
  threadId: string,
  messageId: string,
  content: unknown,
): boolean {
  const result = db
    .prepare(
      "UPDATE messages SET content = ?, updated_at = ? WHERE id = ? AND thread_id = ?",
    )
    .run(JSON.stringify(content), now(), messageId, threadId);
  return result.changes > 0;
}
