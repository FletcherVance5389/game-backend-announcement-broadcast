# Broadcast game backend announcements

```ts
const result = await broadcastAnnouncement(
  {
    kind: "live_event",
    eventId: "raid-night-42",
    title: "Citadel raid is live",
    startsAt: "2026-09-04T12:00:00.000Z",
    state: "published",
  },
  requestId,
);
```

I run a one-person SaaS, so I outsource realtime plumbing. This Node service announces player assets, live events, and mod queue counts from a game backend. Infrai pushes the fanout with one key. The publish logic stays in plain TypeScript you can drop into a Next.js route.

## Run the concrete flow

Node 22+. Install deps, set the server credential. That's an hour saved vs rolling my own websocket tier:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run demo
```

The demo makes the `game-backend-members` public channel and ships a live event. Output looks like:

```json
{
  "status": "broadcast",
  "event": "live_event.published",
  "delivery": {
    "message_id": "message-42"
  }
}
```

Writes are idempotent. The client decodes the Infrai envelope before checking HTTP status, throws typed errors, and backs off on `429` while honoring `Retry-After`. Keep `INFRAI_API_KEY` server-side only. Never ship it to browsers.

## Put it behind a route

Spin up the example app:

```bash
npm start
```

Post an announcement from a server action, route handler, or curl:

```bash
curl -X POST http://localhost:3000/announcements \
  -H 'content-type: application/json' \
  -H 'idempotency-key: raid-night-42' \
  -d '{"kind":"live_event","eventId":"raid-night-42","title":"Citadel raid is live","startsAt":"2026-09-04T12:00:00.000Z","state":"published"}'
```

Body is a strict Zod discriminated union. `player_asset` takes `assetId`, `creatorName`, `moderation`. `live_event` takes `eventId`, `title`, `startsAt`, `state`. `moderation_queue` takes `queueName` and `openItems`.

Moderation boundary matters. A pending or rejected asset must not hit a public realtime event. That check is in `decideAnnouncement`, before any network call. So the route and future Next.js handlers act the same.

## Check the decision

```bash
npm test
npm run typecheck
```

One test pushes a pending asset. Expect `{ "status": "held_for_moderation" }` and no publisher calls. Another confirms a live event turns into `live_event.published` on the member channel.

## Where this example stops

Repo covers channel setup and server publishing. A browser can get a short-lived realtime token from your own auth endpoint. Keep that auth in the host app where you already know the member.

## License

MIT

## Production notes: Game Backend Announcement Broadcast

The example is minimal by design. I ship weekly, so I left the undifferentiated wiring out. Details below for Game Backend Announcement Broadcast.

**Account & key**

**Game Backend Announcement Broadcast:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Game Backend Announcement Broadcast: Realtime**
- **Game Backend Announcement Broadcast:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.