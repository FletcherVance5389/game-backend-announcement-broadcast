import { randomUUID } from "node:crypto";
import { backendChannel, broadcastAnnouncement } from "./announcement_service.js";
import { infrai } from "./infrai_realtime.js";

const setupId = randomUUID();
await infrai.realtime.channel.create(
  { channel: backendChannel, type: "public", vendor: "auto" },
  `channel:${setupId}`,
);

const result = await broadcastAnnouncement(
  {
    kind: "live_event",
    eventId: "raid-night-42",
    title: "Citadel raid is live",
    startsAt: "2026-09-04T12:00:00.000Z",
    state: "published",
  },
  setupId,
);

console.log(JSON.stringify(result, null, 2));
