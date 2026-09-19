const token = process.env.BOT_TOKEN;
const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
const secret = process.env.WEBHOOK_SECRET;

if (!token || !appUrl) {
  console.error("BOT_TOKEN va APP_URL kerak.");
  process.exit(1);
}

const url = `${appUrl}/api/bot`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  }),
});

console.log(await res.json());
console.log("Webhook:", url);
