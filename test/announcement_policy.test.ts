import assert from "node:assert/strict";
import test from "node:test";
import { broadcastAnnouncement, type Publisher } from "../src/announcement_service.js";

test("pending player assets stay in moderation and are not published", async () => {
  let publishCalls = 0;
  const publish: Publisher = async () => {
    publishCalls += 1;
    return { message_id: "unexpected" };
  };

  const result = await broadcastAnnouncement(
    { kind: "player_asset", assetId: "skin-77", creatorName: "Mina", moderation: "pending" },
    "request-123",
    publish,
  );

  assert.deepEqual(result, { status: "held_for_moderation" });
  assert.equal(publishCalls, 0);
});

test("a published live event is fanned out with its public fields", async () => {
  let sent: Parameters<Publisher>[0] | undefined;
  const publish: Publisher = async (input) => {
    sent = input;
    return { message_id: "message-42" };
  };

  const result = await broadcastAnnouncement(
    {
      kind: "live_event",
      eventId: "raid-42",
      title: "Citadel raid",
      startsAt: "2026-09-04T12:00:00.000Z",
      state: "published",
    },
    "request-456",
    publish,
  );

  assert.equal(result.status, "broadcast");
  assert.deepEqual(sent, {
    channel: "game-backend-members",
    event: "live_event.published",
    data: {
      eventId: "raid-42",
      title: "Citadel raid",
      startsAt: "2026-09-04T12:00:00.000Z",
    },
  });
});
