import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handle = webhookCallback(bot, "std/http", {
  secretToken: process.env.WEBHOOK_SECRET,
});

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    console.error("bot webhook error", e);
    return new Response("ok", { status: 200 });
  }
}
