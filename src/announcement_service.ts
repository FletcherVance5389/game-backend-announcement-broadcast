import { decideAnnouncement, type AnnouncementRequest } from "./announcement_policy.js";
import { infrai } from "./infrai_realtime.js";

export const backendChannel = "game-backend-members";

export type Publisher = typeof infrai.realtime.publish;

export async function broadcastAnnouncement(
  input: AnnouncementRequest,
  requestId: string,
  publish: Publisher = infrai.realtime.publish,
) {
  const decision = decideAnnouncement(input);
  if (decision.action === "hold") {
    return { status: decision.reason } as const;
  }

  const delivery = await publish(
    { channel: backendChannel, event: decision.event, data: decision.data },
    `announcement:${requestId}`,
  );
  return { status: "broadcast", event: decision.event, delivery } as const;
}
