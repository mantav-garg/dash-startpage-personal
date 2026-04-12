// Settings page logic.

const FONTS = [
  'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono',
  'Inconsolata', 'Roboto Mono', 'Space Mono', 'Courier Prime',
  'Oxanium', 'Share Tech Mono',
];

const COLOR_FIELDS = [
  { key: 'color_bg',      label: 'Background' },
  { key: 'color_surface', label: 'Surface'    },
  { key: 'color_border',  label: 'Border'     },
  { key: 'color_text',    label: 'Text'       },
  { key: 'color_muted',   label: 'Muted'      },
  { key: 'color_accent',  label: 'Accent'     },
];

const CSS_VAR_MAP = {
  color_bg:      '--bg',
  color_surface: '--surface',
  color_border:  '--border',
  color_text:    '--text',
  color_muted:   '--muted',
  color_accent:  '--accent',
};

// 24 built-in TUI color schemes — apply only, never stored in user palettes.
const BUILTIN_PALETTES = [
  { name: 'Gruvbox Dark',         colors: { color_bg: '#282828', color_surface: '#3c3836', color_border: '#504945', color_text: '#ebdbb2', color_muted: '#928374', color_accent: '#b8bb26' } },
  { name: 'Gruvbox Light',        colors: { color_bg: '#fbf1c7', color_surface: '#f2e5bc', color_border: '#d5c4a1', color_text: '#3c3836', color_muted: '#7c6f64', color_accent: '#79740e' } },
  { name: 'Catppuccin Mocha',     colors: { color_bg: '#1e1e2e', color_surface: '#313244', color_border: '#45475a', color_text: '#cdd6f4', color_muted: '#6c7086', color_accent: '#cba6f7' } },
  { name: 'Catppuccin Macchiato', colors: { color_bg: '#24273a', color_surface: '#363a4f', color_border: '#494d64', color_text: '#cad3f5', color_muted: '#6e738d', color_accent: '#c6a0f6' } },
  { name: 'Catppuccin Frappé',    colors: { color_bg: '#303446', color_surface: '#414559', color_border: '#51576d', color_text: '#c6d0f5', color_muted: '#737994', color_accent: '#ca9ee6' } },
  { name: 'Catppuccin Latte',     colors: { color_bg: '#eff1f5', color_surface: '#e6e9ef', color_border: '#ccd0da', color_text: '#4c4f69', color_muted: '#8c8fa1', color_accent: '#8839ef' } },
  { name: 'Nord',                 colors: { color_bg: '#2e3440', color_surface: '#3b4252', color_border: '#434c5e', color_text: '#eceff4', color_muted: '#616e88', color_accent: '#88c0d0' } },
  { name: 'Tokyo Night',          colors: { color_bg: '#1a1b26', color_surface: '#24283b', color_border: '#292e42', color_text: '#c0caf5', color_muted: '#565f89', color_accent: '#7aa2f7' } },
  { name: 'Tokyo Day',            colors: { color_bg: '#e1e2e7', color_surface: '#d5d6db', color_border: '#c4c8da', color_text: '#3760bf', color_muted: '#848cb5', color_accent: '#2496be' } },
  { name: 'Monokai',              colors: { color_bg: '#272822', color_surface: '#3e3d32', color_border: '#49483e', color_text: '#f8f8f2', color_muted: '#75715e', color_accent: '#a6e22e' } },
  { name: 'Dracula',              colors: { color_bg: '#282a36', color_surface: '#383a59', color_border: '#6272a4', color_text: '#f8f8f2', color_muted: '#6272a4', color_accent: '#ff79c6' } },
  { name: 'Solarized Dark',       colors: { color_bg: '#002b36', color_surface: '#073642', color_border: '#094555', color_text: '#839496', color_muted: '#586e75', color_accent: '#268bd2' } },
  { name: 'Solarized Light',      colors: { color_bg: '#fdf6e3', color_surface: '#eee8d5', color_border: '#d3cbb7', color_text: '#657b83', color_muted: '#93a1a1', color_accent: '#268bd2' } },
  { name: 'One Dark',             colors: { color_bg: '#282c34', color_surface: '#353b45', color_border: '#3e4451', color_text: '#abb2bf', color_muted: '#5c6370', color_accent: '#61afef' } },
  { name: 'Ayu Dark',             colors: { color_bg: '#0d1017', color_surface: '#131721', color_border: '#1e2430', color_text: '#bfbdb6', color_muted: '#5c6773', color_accent: '#e6b450' } },
  { name: 'Ayu Mirage',           colors: { color_bg: '#1f2430', color_surface: '#232834', color_border: '#333a4c', color_text: '#cbccc6', color_muted: '#5c6773', color_accent: '#ffad66' } },
  { name: 'Everforest Dark',      colors: { color_bg: '#2d353b', color_surface: '#343f44', color_border: '#3d484d', color_text: '#d3c6aa', color_muted: '#7a8478', color_accent: '#a7c080' } },
  { name: 'Rosé Pine',            colors: { color_bg: '#191724', color_surface: '#26233a', color_border: '#403d52', color_text: '#e0def4', color_muted: '#6e6a86', color_accent: '#ebbcba' } },
  { name: 'Rosé Pine Moon',       colors: { color_bg: '#232136', color_surface: '#2a273f', color_border: '#44415a', color_text: '#e0def4', color_muted: '#6e6a86', color_accent: '#ea9a97' } },
  { name: 'Kanagawa',             colors: { color_bg: '#1f1f28', color_surface: '#2a2a37', color_border: '#363646', color_text: '#dcd7ba', color_muted: '#727169', color_accent: '#7e9cd8' } },
  { name: 'Horizon',              colors: { color_bg: '#1c1e26', color_surface: '#232530', color_border: '#2e303e', color_text: '#d5d8da', color_muted: '#6c6f93', color_accent: '#e95678' } },
  { name: 'Material Dark',        colors: { color_bg: '#212121', color_surface: '#303030', color_border: '#424242', color_text: '#eeffff', color_muted: '#546e7a', color_accent: '#80cbc4' } },
  { name: 'Poimandres',           colors: { color_bg: '#1b1e28', color_surface: '#252837', color_border: '#303347', color_text: '#a6accd', color_muted: '#506477', color_accent: '#5de4c7' } },
  { name: 'Chalk',                colors: { color_bg: '#151515', color_surface: '#202020', color_border: '#303030', color_text: '#d0d0d0', color_muted: '#808080', color_accent: '#fb9fb1' } },
];

const BM_PAGE_SIZE = 15;

let _isDirty = false;
function _markDirty() { _isDirty = true; }

// ── Utilities ──────────────────────────────────────────────────────────────────

function sanitizeStr(val, max) { return String(val || '').trim().slice(0, max); }
function isValidColor(v)       { return /^#[0-9a-fA-F]{6}$/.test(v); }
function isValidUrl(v)         { return v.startsWith('http://') || v.startsWith('https://'); }

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function showToast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ── Theme ──────────────────────────────────────────────────────────────────────

function applyTheme(s) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    if (s[key]) root.style.setProperty(cssVar, s[key]);
  }
  root.style.setProperty('--font', `'${s.font}', 'Courier New', monospace`);
}

function applyColorVar(key, val) {
  const cssVar = CSS_VAR_MAP[key];
  if (cssVar) document.documentElement.style.setProperty(cssVar, val);
}

function _applyColors(colors) {
  for (const { key } of COLOR_FIELDS) {
    const val = colors[key];
    if (!val) continue;
    const picker = document.getElementById(`${key}_picker`);
    const text   = document.getElementById(key);
    if (picker) picker.value = val;
    if (text)   text.value   = val;
    applyColorVar(key, val);
  }
}

// ── Font ───────────────────────────────────────────────────────────────────────

const _loadedFonts = new Set();

function buildFontSelect(currentFont) {
  const sel = document.getElementById('s-font');
  sel.innerHTML = '';
  for (const f of FONTS) {
    const opt       = document.createElement('option');
    opt.value       = f;
    opt.textContent = f;
    if (f === currentFont) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => _updateFontPreview(sel.value));
}

function _updateFontPreview(font) {
  if (!_loadedFonts.has(font)) {
    const link = document.createElement('link');
    link.rel   = 'stylesheet';
    link.href  = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400&display=swap`;
    document.head.appendChild(link);
    _loadedFonts.add(font);
  }
  const el = document.getElementById('font-preview');
  if (el) el.style.fontFamily = `'${font}', monospace`;
  document.documentElement.style.setProperty('--font', `'${font}', 'Courier New', monospace`);
}

// ── Color grid ─────────────────────────────────────────────────────────────────

function _getCurrentColors() {
  const out = {};
  for (const { key } of COLOR_FIELDS) {
    out[key] = (document.getElementById(key)?.value || '').trim();
  }
  return out;
}

function buildColorGrid(s) {
  const grid = document.getElementById('color-grid');
  grid.innerHTML = '';

  for (const { key, label } of COLOR_FIELDS) {
    const cell     = document.createElement('div');
    cell.className = 'color-cell';

    const lbl       = document.createElement('label');
    lbl.textContent = label;
    cell.appendChild(lbl);

    const row     = document.createElement('div');
    row.className = 'color-row';

    const picker   = document.createElement('input');
    picker.type    = 'color';
    picker.id      = `${key}_picker`;
    picker.value   = s[key];

    const text     = document.createElement('input');
    text.type      = 'text';
    text.id        = key;
    text.maxLength = 7;
    text.value     = s[key];
    text.pattern   = '^#[0-9a-fA-F]{6}$';

    picker.addEventListener('input', () => {
      text.value = picker.value;
      applyColorVar(key, picker.value);
      _markDirty();
    });
    text.addEventListener('input', () => {
      if (isValidColor(text.value)) { picker.value = text.value; applyColorVar(key, text.value); }
      _markDirty();
    });

    row.appendChild(picker);
    row.appendChild(text);
    cell.appendChild(row);
    grid.appendChild(cell);
  }

  document.getElementById('reset-colors').addEventListener('click', () => {
    for (const { key } of COLOR_FIELDS) {
      const val    = Storage.DEFAULTS[key];
      const picker = document.getElementById(`${key}_picker`);
      const text   = document.getElementById(key);
      if (picker) picker.value = val;
      if (text)   text.value   = val;
      applyColorVar(key, val);
    }
    _markDirty();
  });
}

// ── Built-in palettes ──────────────────────────────────────────────────────────

function renderBuiltinPalettes() {
  const el = document.getElementById('builtin-palette-list');
  if (!el) return;

  el.innerHTML = '';
  let _active = null;

  for (const p of BUILTIN_PALETTES) {
    const card     = document.createElement('div');
    card.className = 'builtin-palette-card';
    card.title     = `Click to preview ${p.name}`;

    const swatches     = document.createElement('div');
    swatches.className = 'builtin-swatches';
    for (const { key } of COLOR_FIELDS) {
      const sw         = document.createElement('span');
      sw.className     = 'builtin-swatch';
      sw.style.background = p.colors[key] || '#000';
      swatches.appendChild(sw);
    }

    const nameEl       = document.createElement('span');
    nameEl.className   = 'builtin-name';
    nameEl.textContent = p.name;

    card.appendChild(swatches);
    card.appendChild(nameEl);

    card.addEventListener('click', () => {
      _active?.classList.remove('previewing');
      card.classList.add('previewing');
      _active = card;
      _applyColors(p.colors);
      _markDirty();
      showToast(`previewing "${p.name}" — save to keep`);
    });

    el.appendChild(card);
  }
}

// ── User palettes ──────────────────────────────────────────────────────────────

function bindPalette() {
  _renderPaletteList();

  document.getElementById('save-palette-btn').addEventListener('click', () => {
    const name = sanitizeStr(document.getElementById('palette-name').value, 48);
    if (!name) { showToast('enter a palette name'); return; }

    const s        = Storage.getSettings();
    const palettes = Array.isArray(s.saved_palettes) ? s.saved_palettes : [];
    if (palettes.length >= Storage.MAX_PALETTES && !palettes.find(p => p.name === name)) {
      showToast(`max ${Storage.MAX_PALETTES} palettes reached`);
      return;
    }

    const colors = _getCurrentColors();
    const idx    = palettes.findIndex(p => p.name === name);
    if (idx >= 0) palettes[idx] = { name, colors };
    else palettes.push({ name, colors });

    s.saved_palettes = palettes;
    Storage.saveSettings(s);
    document.getElementById('palette-name').value = '';
    _renderPaletteList();
    showToast(`palette "${name}" saved.`);
  });
}

function _renderPaletteList() {
  const s        = Storage.getSettings();
  const palettes = Array.isArray(s.saved_palettes) ? s.saved_palettes : [];
  const el       = document.getElementById('palette-list');
  if (!el) return;

  if (!palettes.length) {
    el.innerHTML = `<span class="hint">no saved palettes yet</span>`;
    return;
  }

  el.innerHTML = '';
  for (const p of palettes) {
    const row     = document.createElement('div');
    row.className = 'palette-row';

    const swatches     = document.createElement('div');
    swatches.className = 'palette-swatches';
    for (const { key } of COLOR_FIELDS) {
      const sw         = document.createElement('span');
      sw.className     = 'swatch';
      sw.style.background = p.colors[key] || '#000';
      sw.title         = `${key}: ${p.colors[key]}`;
      swatches.appendChild(sw);
    }

    const nameEl       = document.createElement('span');
    nameEl.className   = 'palette-name-lbl';
    nameEl.textContent = p.name;

    const applyBtn       = document.createElement('button');
    applyBtn.className   = 'ghost-btn';
    applyBtn.textContent = 'apply';
    applyBtn.addEventListener('click', () => {
      _applyColors(p.colors);
      _markDirty();
      showToast(`palette "${p.name}" applied.`);
    });

    const delBtn       = document.createElement('button');
    delBtn.className   = 'danger-btn';
    delBtn.textContent = 'del';
    delBtn.addEventListener('click', () => {
      const s2          = Storage.getSettings();
      s2.saved_palettes = (s2.saved_palettes || []).filter(x => x.name !== p.name);
      Storage.saveSettings(s2);
      _renderPaletteList();
    });

    row.appendChild(swatches);
    row.appendChild(nameEl);
    row.appendChild(applyBtn);
    row.appendChild(delBtn);
    el.appendChild(row);
  }
}

// ── Auth status ────────────────────────────────────────────────────────────────

async function refreshAuthStatus() {
  const statusEl      = document.getElementById('auth-status');
  const connectBtn    = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');

  const token = await Tasks.getValidToken();
  if (token) {
    statusEl.textContent        = 'connected';
    statusEl.style.color        = 'var(--accent)';
    connectBtn.style.display    = 'none';
    disconnectBtn.style.display = 'inline-block';
  } else {
    statusEl.textContent        = 'not connected';
    statusEl.style.color        = 'var(--muted)';
    connectBtn.style.display    = 'inline-block';
    disconnectBtn.style.display = 'none';
  }
}

function bindAuthButtons() {
  document.getElementById('connect-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('auth-status');
    const s        = Storage.getSettings();

    if (!s.oauth_client_id) {
      statusEl.textContent = 'enter client ID above, then save';
      statusEl.style.color = '#e05252';
      return;
    }

    statusEl.textContent = 'connecting…';
    statusEl.style.color = 'var(--muted)';

    try {
      await Tasks.connect();
      await refreshAuthStatus();
      showToast('connected.');
    } catch (e) {
      statusEl.textContent = e.message;
      statusEl.style.color = '#e05252';
    }
  });

  document.getElementById('disconnect-btn').addEventListener('click', async () => {
    await Tasks.disconnect();
    await refreshAuthStatus();
    showToast('disconnected.');
  });
}

// ── Load settings form ─────────────────────────────────────────────────────────

function loadSettingsForm() {
  const s = Storage.getSettings();
  applyTheme(s);

  document.getElementById('s-name').value     = s.name;
  document.getElementById('s-greeting').value = s.greeting_custom;
  document.querySelector(`input[name="clock_format"][value="${s.clock_format}"]`).checked = true;
  document.getElementById('s-show-tasks').checked    = !!s.show_tasks;
  document.getElementById('s-tasks-list').value      = s.tasks_list_id;
  document.getElementById('s-oauth-client-id').value = s.oauth_client_id || '';

  const redirectEl = document.getElementById('redirect-uri-display');
  if (redirectEl) redirectEl.textContent = chrome.identity.getRedirectURL();

  buildFontSelect(s.font);
  _updateFontPreview(s.font);
  buildColorGrid(s);

  const fontLink = document.getElementById('font-link');
  if (fontLink) {
    fontLink.href = `https://fonts.googleapis.com/css2?family=${s.font.replace(/ /g, '+')}:wght@300;400;700&display=swap`;
  }
}

// ── Save settings ──────────────────────────────────────────────────────────────

function _doSave() {
  const s           = Storage.getSettings();
  s.name            = sanitizeStr(document.getElementById('s-name').value, 64) || 'User';
  s.greeting_custom = sanitizeStr(document.getElementById('s-greeting').value, 128);
  s.clock_format    = document.querySelector('input[name="clock_format"]:checked')?.value === '12h' ? '12h' : '24h';
  s.show_tasks      = document.getElementById('s-show-tasks').checked;
  s.tasks_list_id   = sanitizeStr(document.getElementById('s-tasks-list').value, 128);
  s.oauth_client_id = sanitizeStr(document.getElementById('s-oauth-client-id').value, 256);

  const selFont = document.getElementById('s-font').value;
  s.font        = FONTS.includes(selFont) ? selFont : 'JetBrains Mono';

  for (const { key } of COLOR_FIELDS) {
    const val = (document.getElementById(key)?.value || '').trim();
    if (isValidColor(val)) s[key] = val;
  }

  Storage.saveSettings(s);
  applyTheme(s);
  showToast('saved.');
}

function bindSave() {
  const doSaveAndClear = () => { _isDirty = false; _doSave(); };

  document.getElementById('save-btn-nav').addEventListener('click', doSaveAndClear);

  // Ctrl+S / Cmd+S
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      doSaveAndClear();
    }
  });

  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', e => {
    if (!_isDirty) return;
    e.preventDefault();
    e.returnValue = '';
  });

  // Mark dirty on settings form changes (color pickers mark dirty themselves)
  document.querySelectorAll(
    '#settings-wrap input:not([type="file"]):not([type="color"]), #settings-wrap select'
  ).forEach(el => el.addEventListener('input', _markDirty));
  document.querySelectorAll('input[name="clock_format"]').forEach(r =>
    r.addEventListener('change', _markDirty)
  );
}

function bindClientIdToggle() {
  const btn   = document.getElementById('toggle-client-id');
  const field = document.getElementById('s-oauth-client-id');
  if (!btn || !field) return;
  btn.addEventListener('click', () => {
    const hidden    = field.type === 'password';
    field.type      = hidden ? 'text' : 'password';
    btn.textContent = hidden ? 'hide' : 'show';
  });
}

// ── Bookmarks ──────────────────────────────────────────────────────────────────

let _editingId   = null;
let _bmPage      = 1;
let _bmFilter    = '';
let _bmCatFilter = '';

function _getFilteredBookmarks() {
  const bms = Storage.getBookmarks();
  const q   = _bmFilter.toLowerCase();
  const sorted = [...bms].sort((a, b) => {
    const cc = a.category.localeCompare(b.category);
    return cc !== 0 ? cc : a.title.localeCompare(b.title);
  });
  return sorted.filter(b => {
    const matchCat  = !_bmCatFilter || b.category === _bmCatFilter;
    const matchText = !q
      || b.title.toLowerCase().includes(q)
      || b.url.toLowerCase().includes(q)
      || b.category.toLowerCase().includes(q);
    return matchCat && matchText;
  });
}

function _refreshCatDropdown() {
  const sel = document.getElementById('bm-cat-filter');
  if (!sel) return;
  const bms  = Storage.getBookmarks();
  const cats = [...new Set(bms.map(b => b.category))].sort((a, b) => a.localeCompare(b));

  sel.innerHTML = '<option value="">all categories</option>';
  for (const c of cats) {
    const opt = document.createElement('option');
    opt.value = opt.textContent = c;
    if (c === _bmCatFilter) opt.selected = true;
    sel.appendChild(opt);
  }

  // If the previously selected category no longer exists, reset
  if (_bmCatFilter && !cats.includes(_bmCatFilter)) _bmCatFilter = '';
}

function renderBookmarkTable() {
  _refreshCatDropdown();

  const filtered = _getFilteredBookmarks();
  const total    = filtered.length;
  const pages    = Math.max(1, Math.ceil(total / BM_PAGE_SIZE));
  if (_bmPage > pages) _bmPage = pages;

  const start   = (_bmPage - 1) * BM_PAGE_SIZE;
  const visible = filtered.slice(start, start + BM_PAGE_SIZE);

  const tbody    = document.getElementById('bm-tbody');
  const datalist = document.getElementById('cat-list');
  const countEl  = document.getElementById('bm-count');

  const allBms = Storage.getBookmarks();
  const cats   = [...new Set(allBms.map(b => b.category))].sort();
  datalist.innerHTML = cats.map(c => `<option value="${escHtml(c)}">`).join('');

  if (countEl) {
    const suffix = _bmFilter || _bmCatFilter ? ` of ${allBms.length} total` : '';
    countEl.textContent = `${total} bookmark${total !== 1 ? 's' : ''}${suffix}`;
  }

  tbody.innerHTML = '';
  for (const bm of visible) {
    const isEditing = _editingId === bm.id;
    const tr        = document.createElement('tr');
    tr.dataset.id   = bm.id;

    if (isEditing) {
      tr.innerHTML = `
        <td><input type="text" class="edit-title" value="${escHtml(bm.title)}" maxlength="128"></td>
        <td><input type="url"  class="edit-url"   value="${escHtml(bm.url)}"   maxlength="512"></td>
        <td><input type="text" class="edit-cat"   value="${escHtml(bm.category)}" maxlength="64" list="cat-list"></td>
        <td class="td-nowrap">
          <button class="ghost-btn save-edit-btn" data-id="${escHtml(bm.id)}">save</button>
          <button class="danger-btn cancel-edit-btn">✕</button>
        </td>`;
    } else {
      tr.innerHTML = `
        <td>${escHtml(bm.title)}</td>
        <td class="url-cell" title="${escHtml(bm.url)}">${escHtml(bm.url)}</td>
        <td>${escHtml(bm.category)}</td>
        <td class="td-nowrap">
          <button class="ghost-btn edit-btn" data-id="${escHtml(bm.id)}">edit</button>
          <button class="danger-btn del-btn"  data-id="${escHtml(bm.id)}">del</button>
        </td>`;
    }
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => { _editingId = btn.dataset.id; renderBookmarkTable(); });
  });

  tbody.querySelectorAll('.cancel-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => { _editingId = null; renderBookmarkTable(); });
  });

  tbody.querySelectorAll('.save-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.id;
      const tr2   = btn.closest('tr');
      const title = sanitizeStr(tr2.querySelector('.edit-title').value, 128);
      const url   = sanitizeStr(tr2.querySelector('.edit-url').value, 512);
      const cat   = sanitizeStr(tr2.querySelector('.edit-cat').value, 64) || 'Other';
      const errEl = document.getElementById('bm-error');

      if (!title || !url)   { errEl.textContent = 'title and url are required'; return; }
      if (!isValidUrl(url)) { errEl.textContent = 'url must start with http:// or https://'; return; }
      errEl.textContent = '';

      Storage.saveBookmarks(
        Storage.getBookmarks().map(b => b.id === id ? { ...b, title, url, category: cat } : b)
      );
      _editingId = null;
      renderBookmarkTable();
      renderCategoryOrder();
      showToast('bookmark updated.');
    });
  });

  tbody.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Storage.saveBookmarks(Storage.getBookmarks().filter(b => b.id !== btn.dataset.id));
      if (_editingId === btn.dataset.id) _editingId = null;
      renderBookmarkTable();
      renderCategoryOrder();
      showToast('removed.');
    });
  });

  _renderPagination(pages);
}

function _renderPagination(pages) {
  const el = document.getElementById('bm-pagination');
  if (!el) return;
  el.innerHTML = '';
  if (pages <= 1) return;

  const prev = document.createElement('button');
  prev.className   = 'page-btn';
  prev.textContent = '←';
  prev.disabled    = _bmPage === 1;
  prev.addEventListener('click', () => { _bmPage--; renderBookmarkTable(); });
  el.appendChild(prev);

  for (let i = 1; i <= pages; i++) {
    if (pages > 7 && i > 2 && i < pages - 1 && Math.abs(i - _bmPage) > 1) {
      if (i === 3 || i === pages - 2) {
        const dots = document.createElement('span');
        dots.className   = 'page-ellipsis';
        dots.textContent = '…';
        el.appendChild(dots);
      }
      continue;
    }
    const btn = document.createElement('button');
    btn.className   = `page-btn${i === _bmPage ? ' active' : ''}`;
    btn.textContent = String(i);
    btn.addEventListener('click', () => { _bmPage = i; renderBookmarkTable(); });
    el.appendChild(btn);
  }

  const next = document.createElement('button');
  next.className   = 'page-btn';
  next.textContent = '→';
  next.disabled    = _bmPage === pages;
  next.addEventListener('click', () => { _bmPage++; renderBookmarkTable(); });
  el.appendChild(next);
}

function bindAddBookmark() {
  document.getElementById('bm-add').addEventListener('click', () => {
    const title = sanitizeStr(document.getElementById('bm-title').value, 128);
    const url   = sanitizeStr(document.getElementById('bm-url').value, 512);
    const cat   = sanitizeStr(document.getElementById('bm-cat').value, 64) || 'Other';
    const errEl = document.getElementById('bm-error');

    if (!title || !url)   { errEl.textContent = 'title and url are required'; return; }
    if (!isValidUrl(url)) { errEl.textContent = 'url must start with http:// or https://'; return; }
    errEl.textContent = '';

    const bms = Storage.getBookmarks();
    bms.push({ id: String(Date.now()), title, url, category: cat });
    Storage.saveBookmarks(bms);
    document.getElementById('bm-title').value = '';
    document.getElementById('bm-url').value   = '';
    document.getElementById('bm-cat').value   = '';

    // Navigate to the last page so the new entry is visible
    _bmCatFilter = '';
    _bmFilter    = '';
    document.getElementById('bm-filter').value    = '';
    document.getElementById('bm-cat-filter').value = '';
    _bmPage = Math.ceil(bms.length / BM_PAGE_SIZE);

    renderBookmarkTable();
    renderCategoryOrder();
    showToast('bookmark added.');
  });

  // Text filter
  document.getElementById('bm-filter').addEventListener('input', e => {
    _bmFilter = e.target.value.trim();
    _bmPage   = 1;
    renderBookmarkTable();
  });

  // Category dropdown filter
  document.getElementById('bm-cat-filter').addEventListener('change', e => {
    _bmCatFilter = e.target.value;
    _bmPage      = 1;
    renderBookmarkTable();
  });
}

// ── Category order ─────────────────────────────────────────────────────────────

function renderCategoryOrder() {
  const el = document.getElementById('cat-order-list');
  if (!el) return;

  const bms   = Storage.getBookmarks();
  const saved = Storage.getCategoryOrder();
  const all   = [...new Set(bms.map(b => (b.category || 'Other').trim()))].sort((a, b) => a.localeCompare(b));

  const ordered = saved.filter(c => all.includes(c));
  const rest    = all.filter(c => !ordered.includes(c));
  const cats    = [...ordered, ...rest];

  if (!cats.length) {
    el.innerHTML = `<span class="hint">no categories yet</span>`;
    return;
  }

  let _dragSrc = null;

  el.innerHTML = '';
  for (const cat of cats) {
    const row       = document.createElement('div');
    row.className   = 'cat-order-row';
    row.draggable   = true;
    row.dataset.cat = cat;
    row.innerHTML   = `<span class="cat-order-handle">⠿</span><span class="cat-order-name">${escHtml(cat)}</span>`;

    row.addEventListener('dragstart', e => {
      _dragSrc = row;
      e.dataTransfer.effectAllowed = 'move';
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', () => {
      _dragSrc = null;
      row.classList.remove('dragging');
      el.querySelectorAll('.cat-order-row').forEach(r => r.classList.remove('drag-over'));
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (row !== _dragSrc) {
        el.querySelectorAll('.cat-order-row').forEach(r => r.classList.remove('drag-over'));
        row.classList.add('drag-over');
      }
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      if (!_dragSrc || _dragSrc === row) return;
      const rows    = [...el.querySelectorAll('.cat-order-row')];
      const srcIdx  = rows.indexOf(_dragSrc);
      const destIdx = rows.indexOf(row);
      if (srcIdx < destIdx) row.after(_dragSrc);
      else row.before(_dragSrc);
      row.classList.remove('drag-over');
    });

    el.appendChild(row);
  }
}

function bindCategoryOrder() {
  renderCategoryOrder();

  document.getElementById('cat-order-save').addEventListener('click', () => {
    const el    = document.getElementById('cat-order-list');
    const order = [...el.querySelectorAll('.cat-order-row')].map(r => r.dataset.cat);
    Storage.saveCategoryOrder(order);
    showToast('category order saved.');
  });

  document.getElementById('cat-order-reset').addEventListener('click', () => {
    Storage.saveCategoryOrder([]);
    renderCategoryOrder();
    showToast('reset to alphabetical.');
  });
}

// ── Favicon cache ──────────────────────────────────────────────────────────────

function bindFaviconCache() {
  _renderFaviconStats();

  document.getElementById('favicon-clear-btn').addEventListener('click', () => {
    Storage.clearFaviconCache();
    _renderFaviconStats();
    showToast('favicon cache cleared.');
  });
}

function _renderFaviconStats() {
  const el = document.getElementById('favicon-cache-stats');
  if (!el) return;
  const { count, ok, failed, sizeKb } = Storage.getFaviconCacheStats();
  el.textContent = `${count} entries (${ok} ok, ${failed} failed) — ${sizeKb} KB`;
}

// ── Fetch task lists ───────────────────────────────────────────────────────────

function bindFetchLists() {
  document.getElementById('fetch-lists').addEventListener('click', async () => {
    const el = document.getElementById('task-lists-result');
    el.textContent = 'fetching…';
    try {
      const data  = await Tasks.fetchLists();
      const items = data.items || [];
      if (!items.length) { el.textContent = 'no lists found'; return; }
      el.innerHTML = items.map(i =>
        `<div class="task-list-item"><code class="task-list-id">${escHtml(i.id)}</code> — ${escHtml(i.title)}</div>`
      ).join('');
    } catch (e) { el.textContent = `error: ${e.message}`; }
  });
}

// ── Export / Import ────────────────────────────────────────────────────────────

function bindExportImport() {
  document.getElementById('export-btn').addEventListener('click', () => {
    const s = Storage.getSettings();
    const { oauth_client_id, google_auth_enabled, ...exportSettings } = s;
    const payload = {
      version:   3,
      exported:  new Date().toISOString(),
      settings:  exportSettings,
      bookmarks: Storage.getBookmarks(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `dash_startpage-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('exported.');
  });

  document.getElementById('import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.settings && !data.bookmarks) throw new Error('unrecognized format');

        let imported = 0;

        if (data.settings && typeof data.settings === 'object') {
          const s = Object.assign({}, Storage.DEFAULTS, data.settings);
          delete s.tasks_token;
          delete s.oauth_client_secret;
          delete s.oauth_client_id;
          delete s.google_auth_enabled;
          if (Array.isArray(s.saved_palettes)) {
            s.saved_palettes = s.saved_palettes.slice(0, Storage.MAX_PALETTES);
          }
          Storage.saveSettings(s);
          imported++;
        }

        if (Array.isArray(data.bookmarks)) {
          const clean = data.bookmarks
            .filter(b => b && typeof b.title === 'string' && typeof b.url === 'string' && isValidUrl(b.url))
            .map(b => ({
              id:       sanitizeStr(b.id || String(Date.now() + Math.random()), 64),
              title:    sanitizeStr(b.title, 128),
              url:      sanitizeStr(b.url, 512),
              category: sanitizeStr(b.category || 'Other', 64),
            }));
          Storage.saveBookmarks(clean);
          imported++;
        }

        if (!imported) throw new Error('nothing to import');
        _bmPage      = 1;
        _bmFilter    = '';
        _bmCatFilter = '';
        loadSettingsForm();
        renderBookmarkTable();
        renderCategoryOrder();
        showToast('imported — reload to apply theme.');
      } catch (err) {
        showToast(`import failed: ${err.message}`);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
}

// ── Jump nav: highlight active section on scroll ───────────────────────────────

function bindJumpNav() {
  const sections = document.querySelectorAll('.s-section[id]');
  const links    = document.querySelectorAll('.jump-link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

// ── Init ───────────────────────────────────────────────────────────────────────

loadSettingsForm();
bindSave();
renderBuiltinPalettes();
bindPalette();
bindAuthButtons();
refreshAuthStatus();
renderBookmarkTable();
bindAddBookmark();
bindFetchLists();
bindExportImport();
bindCategoryOrder();
bindFaviconCache();
bindJumpNav();
bindClientIdToggle();