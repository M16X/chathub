import { createMessage, getThread, listMessages, toCloudMessage } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function GET(req: Request, { params }: RouteContext) {
  const { threadId } = await params;
  if (!getThread(threadId)) {
    return Response.json({ message: "Thread not found" }, { status: 404 });
  }

  const format = new URL(req.url).searchParams.get("format") ?? undefined;
  const messages = listMessages(threadId, format);

  return Response.json({ messages: messages.map(toCloudMessage) });
}

export async function POST(req: Request, { params }: RouteContext) {
  const { threadId } = await params;
  const body = await req.json();

  if (typeof body.format !== "string" || typeof body.content !== "object" || body.content === null) {
    return Response.json(
      { message: "format (string) and content (object) are required" },
      { status: 400 },
    );
  }

  const messageId = createMessage(threadId, {
    parentId: body.parent_id ?? null,
    format: body.format,
    content: body.content,
  });
  if (!messageId) {
    return Response.json({ message: "Thread not found" }, { status: 404 });
  }

  return Response.json({ message_id: messageId });
}
