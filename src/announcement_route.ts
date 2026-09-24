import express from "express";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { announcementRequest } from "./announcement_policy.js";
import { broadcastAnnouncement } from "./announcement_service.js";
import { InfraiError } from "./infrai_realtime.js";

const app = express();
app.use(express.json());

app.post("/announcements", async (request, response) => {
  try {
    const input = announcementRequest.parse(request.body);
    const requestId = request.header("idempotency-key") ?? randomUUID();
    const result = await broadcastAnnouncement(input, requestId);
    response.status(result.status === "broadcast" ? 202 : 200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({ error: "invalid_announcement", issues: error.issues });
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      response.status(status).json({ error: error.code, details: error.details });
      return;
    }
    response.status(502).json({ error: "announcement_delivery_failed" });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Announcement route listening on http://localhost:${port}`));
