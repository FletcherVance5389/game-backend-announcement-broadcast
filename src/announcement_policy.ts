import { z } from "zod";

export const announcementRequest = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("player_asset"),
    assetId: z.string().min(1),
    creatorName: z.string().min(1),
    moderation: z.enum(["approved", "pending", "rejected"]),
  }).strict(),
  z.object({
    kind: z.literal("live_event"),
    eventId: z.string().min(1),
    title: z.string().min(1),
    startsAt: z.string().datetime(),
    state: z.enum(["draft", "published", "ended"]),
  }).strict(),
  z.object({
    kind: z.literal("moderation_queue"),
    queueName: z.string().min(1),
    openItems: z.number().int().nonnegative(),
  }).strict(),
]);

export type AnnouncementRequest = z.infer<typeof announcementRequest>;

export type AnnouncementDecision =
  | { action: "broadcast"; event: string; data: Record<string, unknown> }
  | { action: "hold"; reason: "held_for_moderation" | "event_not_live" };

export function decideAnnouncement(input: AnnouncementRequest): AnnouncementDecision {
  if (input.kind === "player_asset") {
    if (input.moderation !== "approved") {
      return { action: "hold", reason: "held_for_moderation" };
    }
    return {
      action: "broadcast",
      event: "player_asset.approved",
      data: { assetId: input.assetId, creatorName: input.creatorName },
    };
  }

  if (input.kind === "live_event") {
    if (input.state !== "published") return { action: "hold", reason: "event_not_live" };
    return {
      action: "broadcast",
      event: "live_event.published",
      data: { eventId: input.eventId, title: input.title, startsAt: input.startsAt },
    };
  }

  return {
    action: "broadcast",
    event: "moderation_queue.updated",
    data: { queueName: input.queueName, openItems: input.openItems },
  };
}
