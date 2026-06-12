import express from "express";
import { Telegraf } from "telegraf";
import Redis from "ioredis";
import { exec } from "child_process";
import fs from "fs";

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const REDIS_URL = process.env.REDIS_URL;
const ADMIN_ID = process.env.ADMIN_ID;

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const redis = new Redis(REDIS_URL);

app.use(express.json());

/* =======================
   START
======================= */
bot.start(async (ctx) => {
  const userId = ctx.from.id;

  await redis.sadd("users", userId);

  await ctx.reply("👋 ارسل رابط X (Twitter) لتحميل الفيديو.");
});

/* =======================
   STATS (ADMIN)
======================= */
bot.command("stats", async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;

  const users = await redis.scard("users");

  await ctx.reply(
`📊 احصائيات البوت

👥 المستخدمين الكلي: ${users}`
  );
});

/* =======================
   HANDLE X LINKS
======================= */
bot.on("text", async (ctx) => {
  const text = ctx.message.text;

  if (!text.includes("x.com") && !text.includes("twitter.com")) {
    return;
  }

  await ctx.reply("⏳ تم استلام الرابط وجاري المعالجة...");

  const fileName = `video_${Date.now()}.mp4`;

  // yt-dlp command
  const command = `yt-dlp -f mp4 -o "${fileName}" "${text}"`;

  exec(command, async (error) => {
    if (error) {
      console.log("YT-DLP ERROR:", error);
      return ctx.reply("❌ فشل تحميل الفيديو");
    }

    try {
      await ctx.replyWithVideo({ source: fileName });

      fs.unlinkSync(fileName);
    } catch (e) {
      console.log("SEND ERROR:", e);
      ctx.reply("❌ حدث خطأ أثناء إرسال الفيديو");
    }
  });
});

/* =======================
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
  res.send("Bot Running");
});

/* =======================
   WEBHOOK
======================= */
app.use(bot.webhookCallback("/webhook"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await bot.telegram.setWebhook(`${BASE_URL}/webhook`);

  console.log("Bot Started");
});
