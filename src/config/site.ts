/**
 * ============================================================
 *  SITE SETTINGS — EDIT THIS ONE FILE
 * ============================================================
 *  Change your brand name, tagline, social links, footer credit
 *  and "follow tasks" here. These values are used everywhere on
 *  the website automatically (nav, footer, SEO, download gate).
 * ============================================================
 */

export interface FollowTask {
  id: string;
  label: string;
  url: string;
  icon: string;
}

export const site = {
  // --- Brand ---
  name: 'Checklist',
  logoEmoji: '✓',
  tagline: 'Checklist Template Maker Online',
  shortDescription:
    'Free checklist template maker online. Create your own checklist and download ready-made templates as PDF & JPG.',

  // --- Contact (optional, shown in footer if set) ---
  email: 'palcscuno@gmail.com,

  // --- Footer credit (change to your brand / name) ---
  credit: {
    text: 'Checklist',
    url: '/',
  },

  // --- Social links (leave '' to hide) ---
  social: {
    instagram: 'https://instagram.com/jitendrauno,
    whatsapp: 'https://whatsapp.com/channel/your_channel',
    telegram: 'https://t.me/igjitendra,
    youtube: 'https://youtube.com/@jitendrauno,
  },

  // --- "Follow to unlock" tasks for PRO template downloads ---
  // A template with `pro: true` will require the visitor to click each
  // of these before the download button unlocks.
  followTasks: [
    { id: 'instagram', label: 'Follow us on Instagram', url: 'https://instagram.com/jitendrauno', icon: '📸' },
    { id: 'whatsapp', label: 'Join our WhatsApp channel', url: 'https://whatsapp.com/channel/jitendrauno', icon: '💬' },
    { id: 'telegram', label: 'Join our Telegram', url: 'https://t.me/jitendrauno', icon: '✈️' },
    { id: 'youtube', label: 'Subscribe on YouTube', url: 'https://youtube.com/@jitendrauno', icon: '▶️' },
  ] as FollowTask[],
} as const;

export type Site = typeof site;
