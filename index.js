import { Telegraf } from "telegraf";
import Redis from "ioredis";
import { exec } from "child_process";
import fs from "fs";

console.log("🔥 BOT FILE STARTED");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const REDIS_URL = process.env.REDIS_URL;

const bot = new Telegraf(BOT_TOKEN);

/* =========================
   REDIS SAFE (FIXED)
========================= */
let redis = null;

if (REDIS_URL && REDIS_URL.startsWith("redis")) {
  try {
    redis = new Redis(REDIS_URL);
    console.log("✅ Redis connected");
  } catch (e) {
    console.log("⚠️ Redis disabled");
  }
} else {
  console.log("⚠️ Redis not configured - skipping");
}

/* =========================
   START
========================= */
bot.start(async (ctx) => {
  if (redis) await redis.sadd("users", ctx.from.id);
  await ctx.reply("👋 أرسل رابط X لتحميل الفيديو");
});

/* =========================
   STATS
========================= */
bot.command("stats", async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;

  let users = 0;
  if (redis) users = await redis.scard("users");

  await ctx.reply(`📊 Stats

👥 Users: ${users}`);
});

/* =========================
   DOWNLOAD X VIDEO
========================= */
bot.on("text", async (ctx) => {
  const text = ctx.message.text;

  if (!text.includes("x.com") && !text.includes("twitter.com")) return;

  await ctx.reply("⏳ جاري التحميل...");

  const file = `video_${Date.now()}.mp4`;

  const cmd = `npx yt-dlp -f mp4 -o "${file}" "${text}"`;

  exec(cmd, async (err) => {
    if (err) {
      console.log("YT-DLP ERROR:", err);
      return ctx.reply("❌ فشل التحميل");
    }

    try {
      await ctx.replyWithVideo({ source: file });
      fs.unlinkSync(file);
    } catch (e) {
      ctx.reply("❌ خطأ بالإرسال");
    }
  });
});

/* =========================
   FIX TELEGRAM CONFLICT
========================= */
bot.launch({
  dropPendingUpdates: true
});

console.log("🤖 BOT RUNNING");
