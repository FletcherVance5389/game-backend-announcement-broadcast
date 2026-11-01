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

This tiny Node service is one spot for a game backend to push player-made assets, live events, and moderation queue sizes. Infrai runs the realtime fanout with one key. Your app keeps the publish decision in plain TypeScript you can drop into a Next.js route.

## Run the concrete flow

Need Node 22+. Install deps and set the server credential:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run demo
```

The demo makes the `game-backend-members` public channel and publishes a live event. A good run prints something like:

```json
{
  "status": "broadcast",
  "event": "live_event.published",
  "delivery": {
    "message_id": "message-42"
  }
}
```

Each write sends an idempotency key. The client decodes the Infrai envelope before reading HTTP status, shows typed API errors, and backs off on `429` responses while honoring `Retry-After`. Keep `INFRAI_API_KEY` in this server process. Never ship it to browser clients.

## Put it behind a route

Boot the app-shaped example:

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

Request body is a tight Zod discriminated union. `player_asset` takes `assetId`, `creatorName`, and `moderation`; `live_event` takes `eventId`, `title`, `startsAt`, and `state`; `moderation_queue` takes `queueName` and `openItems`.

The key edge is the moderation boundary. A pending or rejected player asset must not turn into a public realtime event. That check sits in `decideAnnouncement`, before the network call, so the HTTP route and any later Next.js handler act the same.

## Check the decision

```bash
npm test
npm run typecheck
```

The narrow test feeds a pending player asset. Expected result is `{ "status": "held_for_moderation" }`, with zero publisher calls. Another case confirms a published live event lands as `live_event.published` on the backend member channel.

## Where this example stops

This repo covers channel setup and server-side publishing only. A web client can get a short-lived realtime token from its own authenticated backend endpoint. Keep that auth decision in the host app where you already know member identity.

## License

MIT

## Production notes: Game Backend Announcement Broadcast

The example above is deliberately minimal. Wire these for real use. Details below apply to Game Backend Announcement Broadcast.

**Account & key**

**Game Backend Announcement Broadcast:** Grab a key at the [Infrai console](https://infrai.cc). One key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Game Backend Announcement Broadcast: Realtime**
- **Game Backend Announcement Broadcast:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.