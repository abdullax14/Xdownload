import { Telegraf } from "telegraf";
import Redis from "ioredis";
import { exec } from "child_process";
import fs from "fs";

console.log("🔥 BOT STARTED");

const bot = new Telegraf(process.env.BOT_TOKEN);
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

bot.start(async (ctx) => {
  await ctx.reply("👋 أرسل رابط X");
});

bot.command("stats", async (ctx) => {
  if (String(ctx.from.id) !== String(process.env.ADMIN_ID)) return;

  const users = redis ? await redis.scard("users") : 0;

  await ctx.reply(`👥 Users: ${users}`);
});

bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  if (!url.includes("x.com") && !url.includes("twitter.com")) return;

  await ctx.reply("⏳ جاري التحميل...");

  const file = `video_${Date.now()}.mp4`;

  // IMPORTANT FIX (no system yt-dlp required)
  const cmd = `python3 -m yt_dlp -f mp4 -o "${file}" "${url}"`;

  exec(cmd, async (err) => {
    if (err) {
      console.log(err);
      return ctx.reply("❌ فشل التحميل");
    }

    try {
      await ctx.replyWithVideo({ source: file });
      fs.unlinkSync(file);
    } catch {
      ctx.reply("❌ خطأ بالإرسال");
    }
  });
});

bot.launch({ dropPendingUpdates: true });

console.log("🤖 RUNNING");
