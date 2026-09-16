import { deleteThread, getThread, toCloudThread, updateThread } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { threadId } = await params;
  const thread = getThread(threadId);
  if (!thread) {
    return Response.json({ message: "Thread not found" }, { status: 404 });
  }
  return Response.json({ thread: toCloudThread(thread) });
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { threadId } = await params;
  const body = await req.json();

  const updated = updateThread(threadId, {
    title: body.title,
    lastMessageAt: body.last_message_at,
    metadata: body.metadata,
    isArchived: body.is_archived,
  });
  if (!updated) {
    return Response.json({ message: "Thread not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { threadId } = await params;
  const deleted = deleteThread(threadId);
  if (!deleted) {
    return Response.json({ message: "Thread not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
