import { getLiveSnapshot } from "@/lib/live-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();
const SNAPSHOT_INTERVAL_MS = 1000;
const KEEPALIVE_INTERVAL_MS = 15000;

function encodeEvent(event: string, data: string) {
  return encoder.encode(`event: ${event}\ndata: ${data}\n\n`);
}

function encodeComment(comment: string) {
  return encoder.encode(`: ${comment}\n\n`);
}

export async function GET() {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let keepAliveId: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  let previousPayload = "";

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      async function sendSnapshot() {
        if (closed) {
          return;
        }

        try {
          const snapshot = await getLiveSnapshot();
          const payload = JSON.stringify(snapshot);

          if (payload !== previousPayload) {
            controller.enqueue(encodeEvent("snapshot", payload));
            previousPayload = payload;
          }
        } catch {
          controller.enqueue(encodeEvent("error", JSON.stringify({ message: "live_snapshot_failed" })));
        }
      }

      controller.enqueue(encodeComment("code-relay-live"));
      void sendSnapshot();

      intervalId = setInterval(() => {
        void sendSnapshot();
      }, SNAPSHOT_INTERVAL_MS);

      keepAliveId = setInterval(() => {
        controller.enqueue(encodeComment("keepalive"));
      }, KEEPALIVE_INTERVAL_MS);
    },
    cancel() {
      closed = true;

      if (intervalId) {
        clearInterval(intervalId);
      }

      if (keepAliveId) {
        clearInterval(keepAliveId);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
