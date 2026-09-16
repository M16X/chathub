import { createThread, listThreads, toCloudThread } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isArchived = url.searchParams.get("is_archived") === "true";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
  const after = url.searchParams.get("after") ?? undefined;

  const threads = listThreads({
    isArchived,
    limit: Number.isInteger(limit) ? limit : undefined,
    after,
  });

  return Response.json({ threads: threads.map(toCloudThread) });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (typeof body.last_message_at !== "string") {
    return Response.json(
      { message: "last_message_at (ISO string) is required" },
      { status: 400 },
    );
  }

  const threadId = createThread({
    title: body.title,
    lastMessageAt: body.last_message_at,
    metadata: body.metadata,
    externalId: body.external_id,
  });

  return Response.json({ thread_id: threadId });
}
