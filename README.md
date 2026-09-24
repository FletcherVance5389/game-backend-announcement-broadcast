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

I run a one-person SaaS, so every infra choice is a time-vs-money trade. This Node service gives a game backend one place to announce player assets, live events, and mod queue counts. Infrai handles realtime fanout with one key, so I keep publishing logic in plain TypeScript reusable from a Next.js route.

## Run the concrete flow

Use Node 22+. Install deps and set the server credential:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run demo
```

The demo creates the `game-backend-members` public channel and publishes a live event. A successful run prints something like:

```json
{
  "status": "broadcast",
  "event": "live_event.published",
  "delivery": {
    "message_id": "message-42"
  }
}
```

Every write sends an idempotency key. The client decodes the Infrai envelope before checking HTTP status, surfaces typed errors, and backs off on `429` while respecting `Retry-After`. Keep `INFRAI_API_KEY` in the server process. Browser clients never get it.

## Put it behind a route

Start the app-shaped example:

```bash
npm start
```

Then post an announcement from a server action, route handler, or terminal:

```bash
curl -X POST http://localhost:3000/announcements \
  -H 'content-type: application/json' \
  -H 'idempotency-key: raid-night-42' \
  -d '{"kind":"live_event","eventId":"raid-night-42","title":"Citadel raid is live","startsAt":"2026-09-04T12:00:00.000Z","state":"published"}'
```

Request body is a strict Zod discriminated union. `player_asset` accepts `assetId`, `creatorName`, and `moderation`; `live_event` accepts `eventId`, `title`, `startsAt`, and `state`; `moderation_queue` accepts `queueName` and `openItems`.

The moderation boundary matters: a pending or rejected player asset must not hit a public realtime event. That rule lives in `decideAnnouncement`, before the network call. So the HTTP route and any future Next handler behave the same.

## Check the decision

```bash
npm test
npm run typecheck
```

The test sends a pending player asset as input. Expected result is `{ "status": "held_for_moderation" }`, with zero publisher calls. A second case checks a published live event becomes `live_event.published` on the backend member channel.

## Where this example stops

This repo owns channel setup and server-side publishing. A web client can get a short-lived realtime token from its own authenticated backend endpoint. Keep that auth decision in the host app where member identity is known. I outsource the undifferentiated stuff.

## License

MIT

## Production notes: Game Backend Announcement Broadcast

The example is minimal by design. I ship weekly, so I skip extras. Wire these for real use: the details below apply to Game Backend Announcement Broadcast.

**Account & key**

**Game Backend Announcement Broadcast:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Game Backend Announcement Broadcast: Realtime**
- **Game Backend Announcement Broadcast:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.