// Centralized storage.
// Credentials → chrome.storage.session (RAM only).
// Everything else → localStorage (no credentials ever).

const DEFAULTS = {
  name:            'User',
  clock_format:    '24h',
  greeting_custom: '',
  font:            'JetBrains Mono',
  color_bg:        '#0d0d0d',
  color_surface:   '#161616',
  color_border:    '#2a2a2a',
  color_text:      '#e0e0e0',
  color_muted:     '#555555',
  color_accent:    '#7fba00',
  show_tasks:      true,
  tasks_list_id:   '',
  saved_palettes:  [],
};

const DEFAULT_BOOKMARKS = [
  { id: '1', title: 'GitHub',        url: 'https://github.com',            category: 'Dev'     },
  { id: '2', title: 'Hacker News',   url: 'https://news.ycombinator.com',  category: 'Reading' },
  { id: '3', title: 'MDN Web Docs',  url: 'https://developer.mozilla.org', category: 'Dev'     },
  { id: '4', title: 'Stack Overflow',url: 'https://stackoverflow.com',     category: 'Dev'     },
  { id: '5', title: 'The Verge',     url: 'https://theverge.com',          category: 'Reading' },
  { id: '6', title: 'Lobste.rs',     url: 'https://lobste.rs',             category: 'Reading' },
];

const FAVICON_TTL = 7  * 24 * 60 * 60 * 1000;
const TASKS_TTL   = 5  * 60 * 1000;

const Storage = (() => {
  // ── Settings ──────────────────────────────────────────────────────────────

  function getSettings() {
    try {
      const raw = localStorage.getItem('sp_settings');
      const s = Object.assign({}, DEFAULTS, raw ? JSON.parse(raw) : {});
      if (!Array.isArray(s.saved_palettes)) s.saved_palettes = [];
      return s;
    } catch { return Object.assign({}, DEFAULTS); }
  }

  function saveSettings(s) {
    const safe = Object.assign({}, s);
    delete safe.tasks_token;
    localStorage.setItem('sp_settings', JSON.stringify(safe));
  }

  // ── Bookmarks ──────────────────────────────────────────────────────────────

  function getBookmarks() {
    try {
      const raw = localStorage.getItem('sp_bookmarks');
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS));
    } catch { return JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS)); }
  }

  function saveBookmarks(bms) {
    localStorage.setItem('sp_bookmarks', JSON.stringify(bms));
  }

  // ── Favicon cache ──────────────────────────────────────────────────────────
  // Entries: { url, ts, failed? }
  // failed entries are kept with a shorter TTL (1 day) to avoid hammering 404s

  const FAVICON_FAIL_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days — do not retry missing favicons

  function getFaviconCache() {
    try {
      const raw = localStorage.getItem('sp_favicons');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function getFavicon(domain) {
    const cache = getFaviconCache();
    const now   = Date.now();
    const entry = cache[domain];

    if (entry) {
      const ttl = entry.failed ? FAVICON_FAIL_TTL : FAVICON_TTL;
      if ((now - entry.ts) < ttl) {
        return entry.failed ? null : entry.url;
      }
    }

    // Not in cache yet — return URL without caching.
    // bookmarks.js will call markFaviconOk on img.onload, or markFaviconFailed on img.onerror.
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
  }

  function markFaviconFailed(domain) {
    const cache = getFaviconCache();
    cache[domain] = { url: null, ts: Date.now(), failed: true };
    localStorage.setItem('sp_favicons', JSON.stringify(cache));
  }

  function markFaviconOk(domain) {
    const url   = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
    const cache = getFaviconCache();
    cache[domain] = { url, ts: Date.now(), failed: false };
    localStorage.setItem('sp_favicons', JSON.stringify(cache));
  }

  // ── Tasks cache ────────────────────────────────────────────────────────────

  function getTasksCache() {
    try {
      const raw = localStorage.getItem('sp_tasks_cache');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function getCachedTasks(key) {
    const entry = getTasksCache()[key];
    if (entry && (Date.now() - entry.ts) < TASKS_TTL) return entry.tasks;
    return null;
  }

  function setCachedTasks(key, tasks) {
    const cache = getTasksCache();
    cache[key] = { tasks, ts: Date.now() };
    localStorage.setItem('sp_tasks_cache', JSON.stringify(cache));
  }

  function invalidateTasksCache(key) {
    const cache = getTasksCache();
    delete cache[key];
    localStorage.setItem('sp_tasks_cache', JSON.stringify(cache));
  }

  // ── On-device tasks ────────────────────────────────────────────────────────

  function getLocalTasks() {
    try {
      const raw = localStorage.getItem('sp_local_tasks');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveLocalTasks(tasks) {
    localStorage.setItem('sp_local_tasks', JSON.stringify(tasks));
  }

  // ── Session token (RAM only) ───────────────────────────────────────────────

  async function getSessionToken() {
    return new Promise(resolve =>
      chrome.storage.session.get('auth_token', r => resolve(r.auth_token || null))
    );
  }

  async function setSessionToken(token) {
    return new Promise(resolve =>
      chrome.storage.session.set({ auth_token: token }, resolve)
    );
  }

  async function clearSessionToken() {
    return new Promise(resolve =>
      chrome.storage.session.remove('auth_token', resolve)
    );
  }

  return {
    getSettings, saveSettings,
    getBookmarks, saveBookmarks,
    getFavicon, markFaviconFailed, markFaviconOk,
    getCachedTasks, setCachedTasks, invalidateTasksCache,
    getLocalTasks, saveLocalTasks,
    getSessionToken, setSessionToken, clearSessionToken,
    DEFAULTS,
  };
})();