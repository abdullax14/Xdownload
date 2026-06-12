import { Telegraf } from "telegraf";
import Redis from "ioredis";
import { exec } from "child_process";
import fs from "fs";

console.log("🔥 FILE STARTED");

const BOT_TOKEN = process.env.BOT_TOKEN;
const REDIS_URL = process.env.REDIS_URL;
const ADMIN_ID = process.env.ADMIN_ID;

const bot = new Telegraf(BOT_TOKEN);

/* =======================
   REDIS SAFE
======================= */
let redis = null;

try {
  if (REDIS_URL) {
    redis = new Redis(REDIS_URL);
    console.log("✅ Redis connected");
  }
} catch (e) {
  console.log("⚠️ Redis disabled");
}

/* =======================
   START
======================= */
bot.start(async (ctx) => {
  const id = ctx.from.id;

  try {
    if (redis) await redis.sadd("users", id);
  } catch {}

  await ctx.reply("👋 أرسل رابط X لتحميل الفيديو");
});

/* =======================
   STATS
======================= */
bot.command("stats", async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;

  let users = 0;

  try {
    if (redis) users = await redis.scard("users");
  } catch {}

  await ctx.reply(`📊 احصائيات البوت

👥 المستخدمين: ${users}`);
});

/* =======================
   DOWNLOAD HANDLER
======================= */
bot.on("text", async (ctx) => {
  const text = ctx.message.text;

  if (!text.includes("x.com") && !text.includes("twitter.com")) return;

  await ctx.reply("⏳ جاري تحميل الفيديو...");

  const file = `video_${Date.now()}.mp4`;

  const cmd = `yt-dlp -f mp4 -o "${file}" "${text}"`;

  exec(cmd, async (err) => {
    if (err) {
      console.log("YT-DLP ERROR:", err);
      return ctx.reply("❌ فشل تحميل الفيديو");
    }

    try {
      await ctx.replyWithVideo({ source: file });
      fs.unlinkSync(file);
    } catch (e) {
      console.log("SEND ERROR:", e);
      ctx.reply("❌ خطأ أثناء الإرسال");
    }
  });
});

/* =======================
   START BOT (NO WEBHOOK)
======================= */
bot.launch();

console.log("🤖 Bot is RUNNING");
