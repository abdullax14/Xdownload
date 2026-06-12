import express from "express";
import { Telegraf } from "telegraf";
import Redis from "ioredis";

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const REDIS_URL = process.env.REDIS_URL;
const ADMIN_ID = process.env.ADMIN_ID;

const bot = new Telegraf(BOT_TOKEN);
const app = express();

const redis = new Redis(REDIS_URL);

app.use(express.json());

bot.start(async (ctx) => {
  const userId = ctx.from.id;

  await redis.sadd("users", userId);

  await ctx.reply(
    "👋 ارسل رابط X (Twitter) لتحميل الفيديو."
  );
});

bot.command("stats", async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID))
    return;

  const users = await redis.scard("users");

  await ctx.reply(
`📊 احصائيات البوت

👥 المستخدمين الكلي: ${users}`
  );
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text;

  if (
    !text.includes("x.com") &&
    !text.includes("twitter.com")
  ) {
    return;
  }

  await ctx.reply(
    "⏳ تم استلام الرابط وجاري المعالجة..."
  );

  // هنا تضيف منطق استخراج الفيديو
  // ثم:
  // await ctx.replyWithVideo(...)
});

app.get("/", (req, res) => {
  res.send("Bot Running");
});

app.use(bot.webhookCallback("/webhook"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await bot.telegram.setWebhook(
    `${BASE_URL}/webhook`
  );

  console.log("Bot Started");
});
