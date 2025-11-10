// Rugs.fun Sniper Bot
// Full Telegraf bot with advanced menus, welcome message, PK import flow, logging, extended settings, analytics, leaderboard, tips, multi-wallet, and referral system.

const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// ===== CONFIG =====
const BOT_TOKEN = '8203617051:AAG7maOgU4_tI7sh6qmBv3SRF6Xgi1bCip8'; // Replace with real token
const LOG_CHANNEL_ID = '-1003381218991'; // Replace with your log channel
const bot = new Telegraf(BOT_TOKEN);
// ===== WELCOME MESSAGE =====
const welcomeMessage = `🌟 Welcome to the official **SOLPOT TELEGRAM MINI APP**! 🌟

🚀 Open app to access the *MIN app Quest SOL box*.
Complete quests, earn rewards, and explore exciting challenges! 🎯`;

// ===== START COMMAND =====
bot.start(async (ctx) => {
  await ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🧭 QUEST', 'quest')],
      [Markup.button.callback('🏠 HOME', 'home')]
    ])
  });
});

// ===== QUEST BUTTON =====
bot.action('quest', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithPhoto(
    { url: 'https://i.postimg.cc/XJYkGP4H/Untitled-design.png' },
    {
      caption: '🎁 Open Quest Box on Mini App to check your Mini App Quest Reward!',
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🏠 HOME', 'home')]
      ])
    }
  );
});

// ===== HOME BUTTON =====
bot.action('home', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🧭 QUEST', 'quest')],
      [Markup.button.callback('🏠 HOME', 'home')]
    ])
  });
});

// ===== LAUNCH BOT =====
bot.launch();
console.log('🤖 SOLPOT Mini App Bot running...');


