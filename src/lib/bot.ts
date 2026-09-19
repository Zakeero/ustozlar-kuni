import { Bot, InlineKeyboard, Keyboard } from "grammy";
import {
  getUserByTelegramId,
  linkReferral,
  setUserPhone,
  setUserSubscribed,
  upsertUser,
} from "./db";
import { getVoteBudget } from "./votes";
import {
  BOT_TOKEN,
  createAuthToken,
  isSubscribed,
  loginUrl,
  referralLink,
} from "./telegram";
import { SITE, MAIN_VOTES, MAX_BONUS_VOTES } from "./config";

// Build vaqtida token bo'lmasligi mumkin — o'rinbosar qiymat bilan quriladi,
// haqiqiy so'rovlar faqat runtime'da BOT_TOKEN bilan ketadi.
export const bot = new Bot(BOT_TOKEN || "0:placeholder");

const CHANNEL_LINK = `https://t.me/${SITE.channel}`;

const phoneKeyboard = new Keyboard()
  .requestContact("📱 Telefon raqamni yuborish")
  .resized()
  .oneTime();

function subscribeKeyboard() {
  return new InlineKeyboard()
    .url("📢 Kanalga obuna bo'lish", CHANNEL_LINK)
    .row()
    .text("✅ Obuna bo'ldim", "check_sub");
}

async function sendLoginLink(ctx: {
  reply: (t: string, o?: object) => Promise<unknown>;
}, userId: number) {
  const token = await createAuthToken(userId);
  const kb = new InlineKeyboard().url("🗳 Ovoz berish", loginUrl(token));
  await ctx.reply(
    `Ajoyib! Endi ovoz berishingiz mumkin.\n\n` +
      `Sizda <b>${MAIN_VOTES} ta ovoz</b> bor — har birini boshqa ustozga berasiz.\n` +
      `Do'stingizni taklif qilsangiz, har biri uchun <b>+1 ovoz</b> qo'shiladi ` +
      `(ko'pi bilan ${MAX_BONUS_VOTES} ta).`,
    { parse_mode: "HTML", reply_markup: kb },
  );
}

/** Foydalanuvchini bosqichma-bosqich olib boradi */
async function advance(ctx: any, telegramId: number) {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  if (!user.phone) {
    await ctx.reply(
      "Ovozingiz haqiqiy bo'lishi uchun telefon raqamingizni tasdiqlang.\n" +
        "Pastdagi tugmani bosing 👇",
      { reply_markup: phoneKeyboard },
    );
    return;
  }

  if (!user.subscribed) {
    const sub = await isSubscribed(telegramId);
    if (sub) {
      await setUserSubscribed(user.id, true);
    } else {
      await ctx.reply(
        "Ovoz berishdan oldin kanalimizga obuna bo'ling — " +
          "barcha natijalar va ustozlar haqidagi postlar o'sha yerda chiqadi.",
        { reply_markup: subscribeKeyboard() },
      );
      return;
    }
  }

  await sendLoginLink(ctx, user.id);
}

/* ---------- /start ---------- */

bot.command("start", async (ctx) => {
  const from = ctx.from;
  if (!from) return;

  const user = await upsertUser({
    telegramId: from.id,
    firstName: from.first_name,
    lastName: from.last_name,
    username: from.username,
  });

  // Referal: /start ref_123
  const payload = ctx.match?.toString().trim() ?? "";
  const m = /^ref_(\d+)$/.exec(payload);
  if (m) {
    const inviterId = Number(m[1]);
    if (inviterId && inviterId !== user.id) {
      await linkReferral(inviterId, user.id);
    }
  }

  await ctx.reply(
    `Assalomu alaykum, <b>${from.first_name ?? "do'stim"}</b>! 👋\n\n` +
      `<b>${SITE.org}</b> 1-oktyabr — Ustozlar va murabbiylar kuni munosabati bilan ` +
      `“Yilning eng yaxshi ustozi” loyihasini boshladi.\n\n` +
      `Bu yerda siz o'z ustozingizga minnatdorchilik bildirasiz va ` +
      `uni nominatsiyalardan biriga nomzod qilib ko'rsatasiz.`,
    { parse_mode: "HTML" },
  );

  await advance(ctx, from.id);
});

/* ---------- Telefon raqami ---------- */

bot.on("message:contact", async (ctx) => {
  const from = ctx.from;
  const contact = ctx.message.contact;
  if (!from) return;

  if (contact.user_id && contact.user_id !== from.id) {
    await ctx.reply(
      "Iltimos, <b>o'zingizning</b> raqamingizni yuboring — tugma orqali.",
      { parse_mode: "HTML", reply_markup: phoneKeyboard },
    );
    return;
  }

  const user = await getUserByTelegramId(from.id);
  if (!user) return;

  const res = await setUserPhone(user.id, contact.phone_number);
  if (!res.ok) {
    await ctx.reply(
      "Bu telefon raqami boshqa akkauntda ro'yxatdan o'tgan. " +
        "Har bir raqam faqat bir marta ovoz bera oladi.",
      { reply_markup: { remove_keyboard: true } },
    );
    return;
  }

  await ctx.reply("Rahmat, raqamingiz tasdiqlandi ✅", {
    reply_markup: { remove_keyboard: true },
  });
  await advance(ctx, from.id);
});

/* ---------- Obunani tekshirish ---------- */

bot.callbackQuery("check_sub", async (ctx) => {
  const from = ctx.from;
  const user = await getUserByTelegramId(from.id);
  if (!user) return;

  const sub = await isSubscribed(from.id);
  if (!sub) {
    await ctx.answerCallbackQuery({
      text: "Hali obuna ko'rinmayapti. Kanalga kiring va qayta bosing.",
      show_alert: true,
    });
    return;
  }

  await setUserSubscribed(user.id, true);
  await ctx.answerCallbackQuery({ text: "Obuna tasdiqlandi ✅" });
  await advance(ctx, from.id);
});

/* ---------- /referal ---------- */

bot.command(["referal", "taklif"], async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  const user = await getUserByTelegramId(from.id);
  if (!user) return;

  const me = await ctx.api.getMe();
  const link = referralLink(user.id, me.username);
  const budget = await getVoteBudget(user.id);

  await ctx.reply(
    `🔗 <b>Sizning havolangiz:</b>\n<code>${link}</code>\n\n` +
      `Taklif qilinganlar: <b>${budget.referralsTotal}</b>\n` +
      `Ovoz berganlar: <b>${budget.referralsCounted}</b>\n` +
      `Qo'shimcha ovozlaringiz: <b>${budget.bonusLeft}</b> ta\n\n` +
      `<i>Bonus ovoz do'stingiz ovoz berganidan keyin qo'shiladi.</i>`,
    { parse_mode: "HTML" },
  );
});

/* ---------- /ovoz — saytga qaytish ---------- */

bot.command(["ovoz", "sayt"], async (ctx) => {
  if (!ctx.from) return;
  await advance(ctx, ctx.from.id);
});

/* ---------- /help ---------- */

bot.command("help", async (ctx) => {
  await ctx.reply(
    `<b>Buyruqlar:</b>\n` +
      `/ovoz — ovoz berish sahifasini ochish\n` +
      `/referal — do'stlarni taklif qilish havolasi\n` +
      `/help — yordam\n\n` +
      `<b>Qoidalar:</b>\n` +
      `• Har bir kishida ${MAIN_VOTES} ta ovoz, har biri boshqa ustozga\n` +
      `• Taklif qilgan har bir do'st uchun +1 ovoz (ko'pi bilan ${MAX_BONUS_VOTES})\n` +
      `• Bir telefon raqami — bir marta\n` +
      `• Ovoz berish 1-oktyabr soat 12:00 da yakunlanadi`,
    { parse_mode: "HTML" },
  );
});

bot.on("message", async (ctx) => {
  if (!ctx.from) return;
  await advance(ctx, ctx.from.id);
});
