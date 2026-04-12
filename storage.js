// Centralized storage.
// Credentials → chrome.storage.session (RAM only).
// Everything else → localStorage (no credentials ever).

const DEFAULTS = Object.freeze({
  name:                'Jane Doe',
  clock_format:        '12h',
  greeting_custom:     '',
  font:                'JetBrains Mono',
  color_bg:            '#1e2326',
  color_surface:       '#374145',
  color_border:        '#272e33',
  color_text:          '#e0e0e0',
  color_muted:         '#7a8478',
  color_accent:        '#a7c080',
  show_tasks:          true,
  tasks_list_id:       '',
  saved_palettes:      [],
  google_auth_enabled: false,
});

const DEFAULT_BOOKMARKS = [
  { id: '1', title: 'GitHub',         url: 'https://github.com',            category: 'Dev'     },
  { id: '2', title: 'Hacker News',    url: 'https://news.ycombinator.com',  category: 'Reading' },
  { id: '3', title: 'MDN Web Docs',   url: 'https://developer.mozilla.org', category: 'Dev'     },
  { id: '4', title: 'Stack Overflow', url: 'https://stackoverflow.com',     category: 'Dev'     },
  { id: '5', title: 'The Verge',      url: 'https://theverge.com',          category: 'Reading' },
  { id: '6', title: 'Lobste.rs',      url: 'https://lobste.rs',             category: 'Reading' },
];

const FAVICON_TTL      =  7 * 24 * 60 * 60 * 1000;
const FAVICON_FAIL_TTL = 90 * 24 * 60 * 60 * 1000;
const TASKS_TTL        =  5 * 60 * 1000;
const MAX_PALETTES     = 20;

const Storage = (() => {
  // In-memory write-through caches — avoids repeated JSON.parse on hot paths.
  let _faviconCache = null;
  let _tasksCache   = null;

  function _loadFaviconCache() {
    if (_faviconCache) return _faviconCache;
    try {
      const raw = localStorage.getItem('sp_favicons');
      _faviconCache = raw ? JSON.parse(raw) : {};
    } catch { _faviconCache = {}; }
    return _faviconCache;
  }

  function _saveFaviconCache() {
    localStorage.setItem('sp_favicons', JSON.stringify(_faviconCache));
  }

  function _loadTasksCache() {
    if (_tasksCache) return _tasksCache;
    try {
      const raw = localStorage.getItem('sp_tasks_cache');
      _tasksCache = raw ? JSON.parse(raw) : {};
    } catch { _tasksCache = {}; }
    return _tasksCache;
  }

  function _saveTasksCache() {
    localStorage.setItem('sp_tasks_cache', JSON.stringify(_tasksCache));
  }

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
    delete safe.oauth_client_secret;
    localStorage.setItem('sp_settings', JSON.stringify(safe));
  }

  // ── Bookmarks ──────────────────────────────────────────────────────────────

  function getBookmarks() {
    try {
      const raw = localStorage.getItem('sp_bookmarks');
      return raw ? JSON.parse(raw) : structuredClone(DEFAULT_BOOKMARKS);
    } catch { return structuredClone(DEFAULT_BOOKMARKS); }
  }

  function saveBookmarks(bms) {
    localStorage.setItem('sp_bookmarks', JSON.stringify(bms));
  }

  // ── Category order ─────────────────────────────────────────────────────────

  function getCategoryOrder() {
    try {
      const raw = localStorage.getItem('sp_cat_order');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveCategoryOrder(order) {
    localStorage.setItem('sp_cat_order', JSON.stringify(order));
  }

  // ── Favicon cache ──────────────────────────────────────────────────────────
  //
  // getFavicon return contract:
  //   undefined → not cached or TTL expired; caller must fetch
  //   null      → confirmed 4xx; show placeholder, never re-fetch for 90 days
  //   string    → cached data URL; use directly

  function getFavicon(domain) {
    const cache = _loadFaviconCache();
    const entry = cache[domain];
    if (!entry) return undefined;
    const ttl = entry.failed ? FAVICON_FAIL_TTL : FAVICON_TTL;
    if (Date.now() - entry.ts >= ttl) return undefined;
    return entry.failed ? null : (entry.dataUrl || undefined);
  }

  function markFaviconOk(domain, dataUrl) {
    const cache = _loadFaviconCache();
    cache[domain] = { dataUrl, ts: Date.now(), failed: false };
    _saveFaviconCache();
  }

  function markFaviconFailed(domain) {
    const cache = _loadFaviconCache();
    cache[domain] = { dataUrl: null, ts: Date.now(), failed: true };
    _saveFaviconCache();
  }

  function getFaviconCacheStats() {
    const cache   = _loadFaviconCache();
    const entries = Object.values(cache);
    const raw     = localStorage.getItem('sp_favicons') || '';
    return {
      count:  entries.length,
      ok:     entries.filter(e => !e.failed).length,
      failed: entries.filter(e => e.failed).length,
      sizeKb: Math.round(raw.length / 1024),
    };
  }

  function clearFaviconCache() {
    _faviconCache = {};
    localStorage.removeItem('sp_favicons');
  }

  // ── Tasks cache ────────────────────────────────────────────────────────────

  function getCachedTasks(key) {
    const cache = _loadTasksCache();
    const entry = cache[key];
    if (entry && (Date.now() - entry.ts) < TASKS_TTL) return entry.tasks;
    return null;
  }

  function setCachedTasks(key, tasks) {
    const cache = _loadTasksCache();
    cache[key] = { tasks, ts: Date.now() };
    _saveTasksCache();
  }

  function invalidateTasksCache(key) {
    const cache = _loadTasksCache();
    delete cache[key];
    _saveTasksCache();
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
    DEFAULTS,
    MAX_PALETTES,
    getSettings, saveSettings,
    getBookmarks, saveBookmarks,
    getCategoryOrder, saveCategoryOrder,
    getFavicon, markFaviconOk, markFaviconFailed,
    getFaviconCacheStats, clearFaviconCache,
    getCachedTasks, setCachedTasks, invalidateTasksCache,
    getLocalTasks, saveLocalTasks,
    getSessionToken, setSessionToken, clearSessionToken,
  };
})();