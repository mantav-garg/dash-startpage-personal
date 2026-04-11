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
  color_bg: '--bg', color_surface: '--surface', color_border: '--border',
  color_text: '--text', color_muted: '--muted', color_accent: '--accent',
};

function sanitizeStr(val, max) { return String(val || '').trim().slice(0, max); }
function isValidColor(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }
function isValidUrl(v) { return v.startsWith('http://') || v.startsWith('https://'); }

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function showToast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
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

// ── Font ───────────────────────────────────────────────────────────────────────

function buildFontSelect(currentFont) {
  const sel = document.getElementById('s-font');
  sel.innerHTML = '';
  for (const f of FONTS) {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f;
    if (f === currentFont) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => updateFontPreview(sel.value));
}

const loadedFonts = new Set();
function updateFontPreview(font) {
  if (!loadedFonts.has(font)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400&display=swap`;
    document.head.appendChild(link);
    loadedFonts.add(font);
  }
  const el = document.getElementById('font-preview');
  if (el) el.style.fontFamily = `'${font}', monospace`;
  document.documentElement.style.setProperty('--font', `'${font}', 'Courier New', monospace`);
}

// ── Color grid + palette save ──────────────────────────────────────────────────

function getCurrentColors() {
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
    const cell   = document.createElement('div');
    cell.className = 'color-cell';
    const lbl    = document.createElement('label');
    lbl.textContent = label;
    cell.appendChild(lbl);
    const row    = document.createElement('div');
    row.className = 'color-row';
    const picker = document.createElement('input');
    picker.type  = 'color';
    picker.id    = `${key}_picker`;
    picker.value = s[key];
    const text   = document.createElement('input');
    text.type    = 'text';
    text.id      = key;
    text.maxLength = 7;
    text.value   = s[key];
    text.pattern = '^#[0-9a-fA-F]{6}$';
    picker.addEventListener('input', () => { text.value = picker.value; applyColorVar(key, picker.value); });
    text.addEventListener('input', () => {
      if (isValidColor(text.value)) { picker.value = text.value; applyColorVar(key, text.value); }
    });
    row.appendChild(picker);
    row.appendChild(text);
    cell.appendChild(row);
    grid.appendChild(cell);
  }

  document.getElementById('reset-colors').addEventListener('click', () => {
    for (const { key } of COLOR_FIELDS) {
      const val = Storage.DEFAULTS[key];
      const picker = document.getElementById(`${key}_picker`);
      const text   = document.getElementById(key);
      if (picker) picker.value = val;
      if (text)   text.value   = val;
      applyColorVar(key, val);
    }
  });
}

function bindPalette() {
  renderPaletteList();

  document.getElementById('save-palette-btn').addEventListener('click', () => {
    const name = sanitizeStr(document.getElementById('palette-name').value, 48);
    if (!name) { showToast('enter a palette name'); return; }
    const s        = Storage.getSettings();
    const palettes = Array.isArray(s.saved_palettes) ? s.saved_palettes : [];
    const colors   = getCurrentColors();
    const idx = palettes.findIndex(p => p.name === name);
    if (idx >= 0) palettes[idx] = { name, colors };
    else palettes.push({ name, colors });
    s.saved_palettes = palettes;
    Storage.saveSettings(s);
    document.getElementById('palette-name').value = '';
    renderPaletteList();
    showToast(`palette "${name}" saved.`);
  });
}

function renderPaletteList() {
  const s        = Storage.getSettings();
  const palettes = Array.isArray(s.saved_palettes) ? s.saved_palettes : [];
  const el       = document.getElementById('palette-list');
  if (!el) return;

  if (!palettes.length) {
    el.innerHTML = `<span class="hint">no saved palettes</span>`;
    return;
  }

  el.innerHTML = '';
  for (const p of palettes) {
    const row = document.createElement('div');
    row.className = 'palette-row';

    const swatches = document.createElement('div');
    swatches.className = 'palette-swatches';
    for (const { key } of COLOR_FIELDS) {
      const sw = document.createElement('span');
      sw.className = 'swatch';
      sw.style.background = p.colors[key] || '#000'; // JS property — not blocked by CSP
      sw.title = `${key}: ${p.colors[key]}`;
      swatches.appendChild(sw);
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'palette-name-lbl';
    nameEl.textContent = p.name;

    const applyBtn = document.createElement('button');
    applyBtn.className = 'ghost-btn';
    applyBtn.textContent = 'apply';
    applyBtn.addEventListener('click', () => {
      for (const { key } of COLOR_FIELDS) {
        const val = p.colors[key];
        if (!val) continue;
        const picker = document.getElementById(`${key}_picker`);
        const text   = document.getElementById(key);
        if (picker) picker.value = val;
        if (text)   text.value   = val;
        applyColorVar(key, val);
      }
      showToast(`palette "${p.name}" applied.`);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'danger-btn';
    delBtn.textContent = 'del';
    delBtn.addEventListener('click', () => {
      const s2 = Storage.getSettings();
      s2.saved_palettes = (s2.saved_palettes || []).filter(x => x.name !== p.name);
      Storage.saveSettings(s2);
      renderPaletteList();
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

  function setConnected() {
    statusEl.textContent        = 'connected';
    statusEl.style.color        = 'var(--accent)';
    connectBtn.style.display    = 'none';
    disconnectBtn.style.display = 'inline-block';
  }
  function setDisconnected() {
    statusEl.textContent        = 'not connected';
    statusEl.style.color        = 'var(--muted)';
    connectBtn.style.display    = 'inline-block';
    disconnectBtn.style.display = 'none';
  }

  const token = await Tasks.getValidToken();
  if (token) setConnected(); else setDisconnected();
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
  document.getElementById('s-name').value      = s.name;
  document.getElementById('s-greeting').value  = s.greeting_custom;
  document.querySelector(`input[name="clock_format"][value="${s.clock_format}"]`).checked = true;
  document.getElementById('s-show-tasks').checked    = !!s.show_tasks;
  document.getElementById('s-tasks-list').value      = s.tasks_list_id;
  document.getElementById('s-oauth-client-id').value = s.oauth_client_id || '';

  const redirectEl = document.getElementById('redirect-uri-display');
  if (redirectEl) redirectEl.textContent = chrome.identity.getRedirectURL();

  buildFontSelect(s.font);
  updateFontPreview(s.font);
  buildColorGrid(s);
  const fontLink = document.getElementById('font-link');
  if (fontLink) fontLink.href = `https://fonts.googleapis.com/css2?family=${s.font.replace(/ /g, '+')}:wght@300;400;700&display=swap`;
}

// ── Save settings ──────────────────────────────────────────────────────────────

function bindSave() {
  document.getElementById('save-btn').addEventListener('click', () => {
    const s = Storage.getSettings();
    s.name            = sanitizeStr(document.getElementById('s-name').value, 64) || 'User';
    s.greeting_custom = sanitizeStr(document.getElementById('s-greeting').value, 128);
    s.clock_format    = document.querySelector('input[name="clock_format"]:checked')?.value === '12h' ? '12h' : '24h';
    s.show_tasks      = document.getElementById('s-show-tasks').checked;
    s.tasks_list_id   = sanitizeStr(document.getElementById('s-tasks-list').value, 128);
    s.oauth_client_id = sanitizeStr(document.getElementById('s-oauth-client-id').value, 256);
    // oauth_client_secret intentionally not stored — implicit flow needs no secret
    const selFont     = document.getElementById('s-font').value;
    s.font            = FONTS.includes(selFont) ? selFont : 'JetBrains Mono';
    for (const { key } of COLOR_FIELDS) {
      const val = (document.getElementById(key)?.value || '').trim();
      if (isValidColor(val)) s[key] = val;
    }
    Storage.saveSettings(s);
    applyTheme(s);
    showToast('saved.');
  });
}

// ── Bookmarks ──────────────────────────────────────────────────────────────────

let editingId = null;

function renderBookmarkTable() {
  const bms      = Storage.getBookmarks();
  const tbody    = document.getElementById('bm-tbody');
  const datalist = document.getElementById('cat-list');

  const sorted = [...bms].sort((a, b) => {
    const cc = a.category.localeCompare(b.category);
    return cc !== 0 ? cc : a.title.localeCompare(b.title);
  });

  const cats = [...new Set(bms.map(b => b.category))].sort();
  datalist.innerHTML = cats.map(c => `<option value="${escHtml(c)}">`).join('');

  tbody.innerHTML = '';
  for (const bm of sorted) {
    const isEditing = editingId === bm.id;
    const tr = document.createElement('tr');
    tr.dataset.id = bm.id;

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
    btn.addEventListener('click', () => { editingId = btn.dataset.id; renderBookmarkTable(); });
  });

  tbody.querySelectorAll('.cancel-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => { editingId = null; renderBookmarkTable(); });
  });

  tbody.querySelectorAll('.save-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.id;
      const tr2   = btn.closest('tr');
      const title = sanitizeStr(tr2.querySelector('.edit-title').value, 128);
      const url   = sanitizeStr(tr2.querySelector('.edit-url').value, 512);
      const cat   = sanitizeStr(tr2.querySelector('.edit-cat').value, 64) || 'Other';
      const errEl = document.getElementById('bm-error');

      if (!title || !url) { errEl.textContent = 'title and url are required'; return; }
      if (!isValidUrl(url)) { errEl.textContent = 'url must start with http:// or https://'; return; }
      errEl.textContent = '';

      const bms2 = Storage.getBookmarks().map(b =>
        b.id === id ? { ...b, title, url, category: cat } : b
      );
      Storage.saveBookmarks(bms2);
      editingId = null;
      renderBookmarkTable();
      showToast('bookmark updated.');
    });
  });

  tbody.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const updated = Storage.getBookmarks().filter(b => b.id !== btn.dataset.id);
      Storage.saveBookmarks(updated);
      if (editingId === btn.dataset.id) editingId = null;
      renderBookmarkTable();
      showToast('removed.');
    });
  });
}

function bindAddBookmark() {
  document.getElementById('bm-add').addEventListener('click', () => {
    const title = sanitizeStr(document.getElementById('bm-title').value, 128);
    const url   = sanitizeStr(document.getElementById('bm-url').value, 512);
    const cat   = sanitizeStr(document.getElementById('bm-cat').value, 64) || 'Other';
    const errEl = document.getElementById('bm-error');

    if (!title || !url) { errEl.textContent = 'title and url are required'; return; }
    if (!isValidUrl(url)) { errEl.textContent = 'url must start with http:// or https://'; return; }
    errEl.textContent = '';

    const bms = Storage.getBookmarks();
    bms.push({ id: String(Date.now()), title, url, category: cat });
    Storage.saveBookmarks(bms);
    document.getElementById('bm-title').value = '';
    document.getElementById('bm-url').value   = '';
    document.getElementById('bm-cat').value   = '';
    renderBookmarkTable();
    showToast('bookmark added.');
  });
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
      // Use CSS classes — no inline style="" attributes
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
    a.download = `startpage-backup-${new Date().toISOString().slice(0,10)}.json`;
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
        if (!data.settings && !data.bookmarks)
          throw new Error('unrecognized format');

        let imported = 0;

        if (data.settings && typeof data.settings === 'object') {
          const s = Object.assign({}, Storage.DEFAULTS, data.settings);
          delete s.tasks_token;
          delete s.oauth_client_secret;
          delete s.oauth_client_id;
          delete s.google_auth_enabled;
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
        loadSettingsForm();
        renderBookmarkTable();
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

// ── Init ───────────────────────────────────────────────────────────────────────

loadSettingsForm();
bindSave();
bindPalette();
bindAuthButtons();
refreshAuthStatus();
renderBookmarkTable();
bindAddBookmark();
bindFetchLists();
bindExportImport();