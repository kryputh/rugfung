// Rugs.fun Sniper Bot
// Full Telegraf bot with advanced menus, welcome message, PK import flow, logging, extended settings, analytics, leaderboard, tips, multi-wallet, and referral system.

const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // e.g. https://rugfung-1.onrender.com
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/webhook';
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN not set');
if (!WEBHOOK_URL) console.warn('Warning: WEBHOOK_URL not set; set it in Render env');

const bot = new Telegraf(BOT_TOKEN);

// minimal handlers (same as before)
const welcomeMessage = `🌟 Welcome to the official **SOLPOT TELEGRAM MINI APP**! 🌟

🚀 Open app to access the *MIN app Quest SOL box*.
Complete quests, earn rewards, and explore exciting challenges! 🎯`;
const MINI_APP_DEEPLINK = 'https://t.me/SolpotMiniAppBot?startapp=Solpot';

bot.start((ctx) => ctx.reply(welcomeMessage,
  { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
    [{ text: '🧭 QUEST', callback_data: 'quest' }],
    [{ text: '🏠 HOME', url: MINI_APP_DEEPLINK }]
  ] } }
));

bot.action('quest', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithPhoto({ url: 'https://i.postimg.cc/VNqgM1j6/download.webp' }, {
    caption: '🎁 Open Quest Box on Mini App to check your Mini App Quest Reward!',
    reply_markup: { inline_keyboard: [[{ text:'🏠 OPEN MINI APP', url: MINI_APP_DEEPLINK }]] }
  });
});

// Express app
const app = express();
app.use(bot.webhookCallback(WEBHOOK_PATH));
app.get('/', (req, res) => res.send('SOLPOT webhook running'));
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  if (WEBHOOK_URL) {
    const full = `${WEBHOOK_URL}${WEBHOOK_PATH}`;
    try {
      await bot.telegram.setWebhook(full);
      console.log('Webhook set to', full);
    } catch (err) {
      console.error('Failed to set webhook:', err);
      process.exit(1);
    }
  } else {
    console.warn('WEBHOOK_URL not configured, webhook not set. Set WEBHOOK_URL to your service URL.');
  }
});

