import { Bot, InlineKeyboard, Keyboard } from "grammy";
import type { Context } from "grammy";
import {
  getBranches,
  getTeacher,
  getTeachersByBranch,
  getUserByTelegramId,
  getUserVotes,
  linkReferral,
  setUserPhone,
  setUserSubscribed,
  upsertUser,
  type User,
} from "./db";
import { castVote, getVoteBudget, VOTE_ERROR_TEXT } from "./votes";
import { BOT_TOKEN, isSubscribed, referralLink } from "./telegram";
import {
  MAIN_VOTES,
  MAX_BONUS_VOTES,
  NOMINATIONS,
  NOMINATION_MAP,
  SITE,
  isNominationKey,
  votingOpen,
} from "./config";

export const bot = new Bot(BOT_TOKEN || "0:placeholder");

const CHANNEL_LINK = `https://t.me/${SITE.channel}`;
const PER_PAGE = 8;

/* ============================================================
   Ovoz berish botning o'zida bo'ladi — sayt, kirish, cookie yo'q.
   Telegram har bosishda kim bosganini aniq aytadi.
   ============================================================ */

/**
 * Xabarni tahrirlash. Telegram bir xil matnni qayta yozishga ruxsat bermaydi —
 * bunday holatda jim o'tib ketamiz, foydalanuvchi xato ko'rmaydi.
 */
async function safeEdit(ctx: Context, text: string, kb?: InlineKeyboard) {
  try {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: kb,
    });
  } catch {
    try {
      await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
    } catch {
      /* xabar yuborib bo'lmasa ham oqim to'xtamasin */
    }
  }
}

const phoneKeyboard = new Keyboard()
  .requestContact("📱 Telefon raqamni yuborish")
  .resized()
  .oneTime();

const menuKeyboard = new Keyboard()
  .text("🗳 Ovoz berish")
  .row()
  .text("👥 Do'stlarni taklif qilish")
  .text("📊 Mening ovozlarim")
  .resized();

function subscribeKeyboard() {
  return new InlineKeyboard()
    .url("📢 Kanalga obuna bo'lish", CHANNEL_LINK)
    .row()
    .text("✅ Obuna bo'ldim", "sub");
}

/* ---------- Kirish shartlari ---------- */

/**
 * Telefon va obunani tekshiradi.
 * Shartlar bajarilgan bo'lsa foydalanuvchini qaytaradi, aks holda null
 * va kerakli xabarni o'zi yuboradi.
 */
async function requireReady(ctx: Context): Promise<User | null> {
  const from = ctx.from;
  if (!from) return null;

  const user = await getUserByTelegramId(from.id);
  if (!user) {
    await ctx.reply("Boshlash uchun /start yuboring.");
    return null;
  }

  if (user.is_blocked) {
    await ctx.reply("Akkauntingiz vaqtincha cheklangan.");
    return null;
  }

  if (!user.phone) {
    await ctx.reply(
      "Ovozingiz haqiqiy bo'lishi uchun telefon raqamingizni tasdiqlang.\n" +
        "Pastdagi tugmani bosing 👇",
      { reply_markup: phoneKeyboard },
    );
    return null;
  }

  if (!user.subscribed) {
    if (await isSubscribed(from.id)) {
      await setUserSubscribed(user.id, true);
      user.subscribed = true;
    } else {
      await ctx.reply(
        "Ovoz berishdan oldin kanalimizga obuna bo'ling — natijalar " +
          "va ustozlar haqidagi postlar o'sha yerda chiqadi.",
        { reply_markup: subscribeKeyboard() },
      );
      return null;
    }
  }

  return user;
}

/* ---------- 1-qadam: filiallar ---------- */

async function showBranches(ctx: Context, edit = false) {
  const branches = await getBranches();
  if (branches.length === 0) {
    await ctx.reply("Filiallar hali qo'shilmagan.");
    return;
  }

  const kb = new InlineKeyboard();
  for (const b of branches) kb.text(b.name, `b:${b.id}:0`).row();

  const text = "🏫 <b>Filialni tanlang</b>\n\nUstozingiz qaysi filialda dars beradi?";
  if (edit) {
    await safeEdit(ctx, text, kb);
  } else {
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  }
}

/* ---------- 2-qadam: ustozlar ---------- */

async function showTeachers(ctx: Context, branchId: number, page: number) {
  const [teachers, branches] = await Promise.all([
    getTeachersByBranch(branchId),
    getBranches(),
  ]);
  const branch = branches.find((b) => b.id === branchId);

  if (teachers.length === 0) {
    await safeEdit(
      ctx,
      "Bu filialda ustozlar hali qo'shilmagan.",
      new InlineKeyboard().text("⬅️ Orqaga", "branches"),
    );
    return;
  }

  const pages = Math.ceil(teachers.length / PER_PAGE);
  const safePage = Math.min(Math.max(page, 0), pages - 1);
  const slice = teachers.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  const kb = new InlineKeyboard();
  for (const t of slice) {
    const label = t.subject ? `${t.full_name} · ${t.subject}` : t.full_name;
    kb.text(label.slice(0, 60), `t:${t.id}`).row();
  }

  if (pages > 1) {
    if (safePage > 0) kb.text("◀️", `b:${branchId}:${safePage - 1}`);
    kb.text(`${safePage + 1}/${pages}`, "noop");
    if (safePage < pages - 1) kb.text("▶️", `b:${branchId}:${safePage + 1}`);
    kb.row();
  }
  kb.text("⬅️ Filiallar", "branches");

  await safeEdit(
    ctx,
    `🏫 <b>${branch?.name ?? "Filial"}</b>\n\n` +
      `Ustozingizni tanlang (${teachers.length} ta):`,
    kb,
  );
}

/* ---------- 3-qadam: nominatsiyalar ---------- */

async function showNominations(ctx: Context, teacherId: number) {
  const teacher = await getTeacher(teacherId);
  if (!teacher) {
    await ctx.answerCallbackQuery({ text: "Ustoz topilmadi", show_alert: true });
    return;
  }

  const kb = new InlineKeyboard();
  for (const n of NOMINATIONS) {
    kb.text(`${n.emoji} ${n.title}`, `v:${teacherId}:${n.key}`).row();
  }
  kb.text("⬅️ Orqaga", `b:${teacher.branch_id}:0`);

  await safeEdit(
    ctx,
    `👨‍🏫 <b>${teacher.full_name}</b>\n` +
      (teacher.subject ? `${teacher.subject}\n` : "") +
      `\nQaysi nominatsiyaga ovoz berasiz?`,
    kb,
  );
}

/* ---------- 4-qadam: ovoz ---------- */

async function doVote(ctx: Context, teacherId: number, nomination: string) {
  const from = ctx.from;
  if (!from) return;

  const user = await getUserByTelegramId(from.id);
  if (!user) return;

  const res = await castVote({ userId: user.id, teacherId, nomination });

  if (!res.ok) {
    await ctx.answerCallbackQuery({
      text: VOTE_ERROR_TEXT[res.error!] ?? "Xatolik",
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery({ text: "Ovozingiz qabul qilindi ✅" });

  const teacher = await getTeacher(teacherId);
  const nom = isNominationKey(nomination) ? NOMINATION_MAP[nomination] : null;
  const left = res.budget?.totalLeft ?? 0;

  const kb = new InlineKeyboard().text("🗳 Yana ovoz berish", "branches");

  await safeEdit(
    ctx,
    `🎉 <b>Ovozingiz qabul qilindi!</b>\n\n` +
      `👨‍🏫 ${teacher?.full_name ?? "Ustoz"}\n` +
      `${nom ? `${nom.emoji} ${nom.title}` : ""}\n\n` +
      (left > 0
        ? `Sizda yana <b>${left} ta ovoz</b> bor — boshqa ustozlarga bering.`
        : `Ovozlaringiz tugadi. Do'stingizni taklif qilsangiz, ` +
          `u ovoz berganda sizga +1 ovoz qo'shiladi.`),
    kb,
  );
}

/* ---------- Buyruqlar ---------- */

bot.command("start", async (ctx) => {
  const from = ctx.from;
  if (!from) return;

  const user = await upsertUser({
    telegramId: from.id,
    firstName: from.first_name,
    lastName: from.last_name,
    username: from.username,
  });

  const payload = ctx.match?.toString().trim() ?? "";
  const m = /^ref_(\d+)$/.exec(payload);
  if (m) {
    const inviterId = Number(m[1]);
    if (inviterId && inviterId !== user.id) await linkReferral(inviterId, user.id);
  }

  await ctx.reply(
    `Assalomu alaykum, <b>${from.first_name ?? "do'stim"}</b>! 👋\n\n` +
      `<b>${SITE.org}</b> 1-oktyabr — Ustozlar va murabbiylar kuni munosabati ` +
      `bilan “Yilning eng yaxshi ustozi” loyihasini boshladi.\n\n` +
      `Sizda <b>${MAIN_VOTES} ta ovoz</b> bor — har birini boshqa ustozga berasiz.`,
    { parse_mode: "HTML", reply_markup: menuKeyboard },
  );

  const ready = await requireReady(ctx);
  if (ready) await showBranches(ctx);
});

bot.command(["ovoz", "sayt"], async (ctx) => {
  if (!votingOpen()) {
    await ctx.reply("Ovoz berish yakunlandi. G'oliblar kanalda e'lon qilinadi.");
    return;
  }
  const user = await requireReady(ctx);
  if (user) await showBranches(ctx);
});

bot.command(["referal", "taklif"], async (ctx) => {
  const user = await requireReady(ctx);
  if (!user) return;
  await sendReferral(ctx, user);
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `<b>Buyruqlar:</b>\n` +
      `/ovoz — ovoz berish\n` +
      `/referal — do'stlarni taklif qilish\n\n` +
      `<b>Qoidalar:</b>\n` +
      `• Har kimda ${MAIN_VOTES} ta ovoz, har biri boshqa ustozga\n` +
      `• Taklif qilgan har bir do'st uchun +1 ovoz (ko'pi bilan ${MAX_BONUS_VOTES})\n` +
      `• Bir telefon raqami — bir marta\n` +
      `• Ovoz berish 1-oktyabr soat 12:00 da yakunlanadi`,
    { parse_mode: "HTML", reply_markup: menuKeyboard },
  );
});

/* ---------- Yordamchi ekranlar ---------- */

async function sendReferral(ctx: Context, user: User) {
  const me = await ctx.api.getMe();
  const link = referralLink(user.id, me.username);
  const budget = await getVoteBudget(user.id);

  await ctx.reply(
    `👥 <b>Do'stlarni taklif qiling</b>\n\n` +
      `Havolangiz orqali kelgan do'stingiz ovoz berganda sizga <b>+1 ovoz</b> ` +
      `qo'shiladi (ko'pi bilan ${MAX_BONUS_VOTES} ta).\n\n` +
      `🔗 <code>${link}</code>\n\n` +
      `Taklif qilinganlar: <b>${budget.referralsTotal}</b>\n` +
      `Ovoz berganlar: <b>${budget.referralsCounted}</b>\n` +
      `Qo'shimcha ovozlaringiz: <b>${budget.bonusLeft}</b> ta`,
    { parse_mode: "HTML" },
  );
}

async function sendMyVotes(ctx: Context, user: User) {
  const [votes, budget] = await Promise.all([
    getUserVotes(user.id),
    getVoteBudget(user.id),
  ]);

  if (votes.length === 0) {
    await ctx.reply("Siz hali ovoz bermagansiz. /ovoz yuboring.");
    return;
  }

  const lines: string[] = [];
  for (const v of votes) {
    const t = await getTeacher(v.teacher_id);
    const nom = isNominationKey(v.nomination) ? NOMINATION_MAP[v.nomination] : null;
    lines.push(
      `${nom?.emoji ?? "•"} <b>${t?.full_name ?? "Ustoz"}</b>` +
        (nom ? ` — ${nom.title}` : ""),
    );
  }

  await ctx.reply(
    `📊 <b>Mening ovozlarim</b>\n\n${lines.join("\n")}\n\n` +
      `Qolgan ovozlar: <b>${budget.totalLeft}</b>`,
    { parse_mode: "HTML" },
  );
}

/* ---------- Tugmalar ---------- */

bot.callbackQuery("noop", (ctx) => ctx.answerCallbackQuery());

bot.callbackQuery("sub", async (ctx) => {
  const from = ctx.from;
  const user = await getUserByTelegramId(from.id);
  if (!user) return;

  if (!(await isSubscribed(from.id))) {
    await ctx.answerCallbackQuery({
      text: "Hali obuna ko'rinmayapti. Kanalga kiring va qayta bosing.",
      show_alert: true,
    });
    return;
  }

  await setUserSubscribed(user.id, true);
  await ctx.answerCallbackQuery({ text: "Obuna tasdiqlandi ✅" });
  await showBranches(ctx);
});

bot.callbackQuery("branches", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showBranches(ctx, true);
});

bot.callbackQuery(/^b:(\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showTeachers(ctx, Number(ctx.match[1]), Number(ctx.match[2]));
});

bot.callbackQuery(/^t:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showNominations(ctx, Number(ctx.match[1]));
});

bot.callbackQuery(/^v:(\d+):(\w+)$/, async (ctx) => {
  if (!votingOpen()) {
    await ctx.answerCallbackQuery({
      text: "Ovoz berish yakunlandi.",
      show_alert: true,
    });
    return;
  }
  await doVote(ctx, Number(ctx.match[1]), ctx.match[2]);
});

/* ---------- Telefon raqami ---------- */

bot.on("message:contact", async (ctx) => {
  const from = ctx.from;
  const contact = ctx.message.contact;
  if (!from) return;

  if (contact.user_id && contact.user_id !== from.id) {
    await ctx.reply("Iltimos, <b>o'zingizning</b> raqamingizni yuboring.", {
      parse_mode: "HTML",
      reply_markup: phoneKeyboard,
    });
    return;
  }

  const user = await getUserByTelegramId(from.id);
  if (!user) return;

  const res = await setUserPhone(user.id, contact.phone_number);
  if (!res.ok) {
    await ctx.reply(
      "Bu raqam boshqa akkauntda ro'yxatdan o'tgan. " +
        "Har bir raqam faqat bir marta ovoz bera oladi.",
      { reply_markup: { remove_keyboard: true } },
    );
    return;
  }

  await ctx.reply("Rahmat, raqamingiz tasdiqlandi ✅", {
    reply_markup: menuKeyboard,
  });

  const ready = await requireReady(ctx);
  if (ready) await showBranches(ctx);
});

/* ---------- Matnli xabarlar ---------- */

bot.on("message:text", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  const text = ctx.message.text.trim();

  const user = await getUserByTelegramId(from.id);
  if (!user) {
    await ctx.reply("Boshlash uchun /start yuboring.");
    return;
  }

  if (text === "🗳 Ovoz berish") {
    if (!votingOpen()) {
      await ctx.reply("Ovoz berish yakunlandi.");
      return;
    }
    const ready = await requireReady(ctx);
    if (ready) await showBranches(ctx);
    return;
  }

  if (text === "👥 Do'stlarni taklif qilish") {
    const ready = await requireReady(ctx);
    if (ready) await sendReferral(ctx, ready);
    return;
  }

  if (text === "📊 Mening ovozlarim") {
    const ready = await requireReady(ctx);
    if (ready) await sendMyVotes(ctx, ready);
    return;
  }

  // Boshqa har qanday matn
  const ready = await requireReady(ctx);
  if (ready) {
    await ctx.reply("Quyidagi tugmalardan foydalaning 👇", {
      reply_markup: menuKeyboard,
    });
  }
});

/* ---------- Xatolarni yutib yuborish ---------- */

bot.catch((err) => {
  console.error("bot error", err);
});
