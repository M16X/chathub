import { updateMessage } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ threadId: string; messageId: string }>;
};

export async function PUT(req: Request, { params }: RouteContext) {
  const { threadId, messageId } = await params;
  const body = await req.json();

  if (typeof body.content !== "object" || body.content === null) {
    return Response.json(
      { message: "content (object) is required" },
      { status: 400 },
    );
  }

  const updated = updateMessage(threadId, messageId, body.content);
  if (!updated) {
    return Response.json({ message: "Message not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
