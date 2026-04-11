// Tasks module.
// Auth: chrome.identity.launchWebAuthFlow, implicit flow (token only — no secret needed).
// Token in chrome.storage.session (RAM only, cleared on browser close).
// Falls back to on-device tasks when not connected.

const Tasks = (() => {
  const CACHE_PREFIX = 'tasks_v1:';
  const SCOPE = 'https://www.googleapis.com/auth/tasks';
  const API   = 'https://tasks.googleapis.com/tasks/v1';

  function sanitize(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function renderList(tasks, error, mode) {
    const el = document.getElementById('task-list');
    if (!el) return;

    if (mode === 'local') { renderLocalTasks(el); return; }

    if (error) {
      el.innerHTML = `<div class="task-item task-error-msg"><span>${sanitize(error)}</span></div>`;
      return;
    }

    renderGoogleTasks(el, tasks || []);
  }

  // ── Google Tasks render ────────────────────────────────────────────────────

  function renderGoogleTasks(el, tasks) {
    const s      = Storage.getSettings();
    const listId = s.tasks_list_id || '@default';

    const pending = tasks.filter(t => t.status !== 'completed');
    const done    = tasks.filter(t => t.status === 'completed');

    let html = '';

    if (pending.length) {
      html += pending.map(t => {
        const due = t.due
          ? new Date(t.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : '';
        return `
        <div class="task-item gtask" data-id="${sanitize(t.id)}">
          <span class="gtask-check" data-id="${sanitize(t.id)}" data-list="${sanitize(listId)}" title="mark complete">✅</span>
          <span class="local-task-title" title="${sanitize(t.title)}">${sanitize(t.title)}</span>
          ${due ? `<span class="gtask-due">${sanitize(due)}</span>` : ''}
          <span class="local-task-del gtask-del" data-id="${sanitize(t.id)}" data-list="${sanitize(listId)}" title="delete">❌</span>
        </div>`;
      }).join('');
    } else {
      html += `<div class="task-item muted"><span>no pending tasks</span></div>`;
    }

    if (done.length) {
      html += done.map(t => `
        <div class="task-item gtask task-done" data-id="${sanitize(t.id)}">
          <span class="gtask-check" data-id="${sanitize(t.id)}" data-list="${sanitize(listId)}" data-done="true" title="mark incomplete">↩️</span>
          <span class="local-task-title task-strikethrough">${sanitize(t.title)}</span>
          <span class="local-task-del gtask-del" data-id="${sanitize(t.id)}" data-list="${sanitize(listId)}" title="delete">❌</span>
        </div>`).join('');
    }

    // All layout handled by #gtask-add-row and .gtask-add-controls in style.css
    html += `
      <div id="gtask-add-row">
        <div class="gtask-add-controls">
          <input type="text" id="gtask-input" class="task-text-input" placeholder="new task…">
          <button id="gtask-add-btn" class="ghost-btn gtask-add-btn">➕</button>
        </div>
        <input type="datetime-local" id="gtask-due" class="gtask-due-input">
      </div>`;

    el.innerHTML = html;
    bindGoogleTaskEvents(listId);
  }

  function bindGoogleTaskEvents(listId) {
    const addBtn = document.getElementById('gtask-add-btn');
    const input  = document.getElementById('gtask-input');
    const dueEl  = document.getElementById('gtask-due');

    const doAdd = async () => {
      const title = (input?.value || '').trim().slice(0, 256);
      if (!title) return;
      const due = dueEl?.value ? new Date(dueEl.value).toISOString() : null;
      addBtn.disabled = true;
      try {
        await apiAddTask(listId, title, due);
        input.value = '';
        dueEl.value = '';
        await reloadGoogleTasks(listId);
      } catch (e) {
        showInlineError(e.message);
      } finally {
        addBtn.disabled = false;
      }
    };

    addBtn?.addEventListener('click', doAdd);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });

    document.querySelectorAll('.gtask-check').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id     = btn.dataset.id;
        const isDone = btn.dataset.done === 'true';
        btn.style.opacity = '0.4';
        try {
          await apiPatchTask(listId, id, { status: isDone ? 'needsAction' : 'completed' });
          await reloadGoogleTasks(listId);
        } catch (e) {
          showInlineError(e.message);
          btn.style.opacity = '';
        }
      });
    });

    document.querySelectorAll('.gtask-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          await apiDeleteTask(listId, id);
          await reloadGoogleTasks(listId);
        } catch (e) {
          showInlineError(e.message);
        }
      });
    });
  }

  function showInlineError(msg) {
    const el = document.getElementById('task-list');
    if (!el) return;
    const err = document.createElement('div');
    err.className = 'task-item task-inline-err';
    err.textContent = msg;
    el.prepend(err);
    setTimeout(() => err.remove(), 4000);
  }

  async function reloadGoogleTasks(listId) {
    Storage.invalidateTasksCache(`${CACHE_PREFIX}${listId}`);
    await loadGoogleTasks(listId, true);
  }

  // ── On-device tasks ────────────────────────────────────────────────────────

  function renderLocalTasks(el) {
    const all     = Storage.getLocalTasks();
    const pending = all.filter(t => !t.done);
    const done    = all.filter(t =>  t.done);
    let html = '';

    if (pending.length) {
      html += pending.map(t => `
        <div class="task-item local-task">
          <span class="local-task-check" data-id="${sanitize(t.id)}" data-done="false" title="mark done">✅</span>
          <span class="local-task-title">${sanitize(t.title)}</span>
          <span class="local-task-del" data-id="${sanitize(t.id)}" title="delete">❌</span>
        </div>`).join('');
    } else {
      html += `<div class="task-item muted"><span>no pending tasks</span></div>`;
    }

    if (done.length) {
      html += done.map(t => `
        <div class="task-item local-task task-done">
          <span class="local-task-check" data-id="${sanitize(t.id)}" data-done="true" title="mark undone">↩️</span>
          <span class="local-task-title task-strikethrough">${sanitize(t.title)}</span>
          <span class="local-task-del" data-id="${sanitize(t.id)}" title="delete">❌</span>
        </div>`).join('');
    }

    // Layout handled by #local-task-input-row in style.css
    html += `
      <div id="local-task-input-row">
        <input type="text" id="local-task-input" class="task-text-input" placeholder="new task…">
        <button id="local-task-add" class="ghost-btn gtask-add-btn">➕</button>
      </div>`;

    el.innerHTML = html;
    bindLocalTaskEvents();
  }

  function bindLocalTaskEvents() {
    document.getElementById('local-task-add')?.addEventListener('click', addLocalTask);
    document.getElementById('local-task-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') addLocalTask();
    });
    document.querySelectorAll('.local-task-check').forEach(btn => {
      btn.addEventListener('click', () => {
        const isDone = btn.dataset.done === 'true';
        Storage.saveLocalTasks(
          Storage.getLocalTasks().map(t => t.id === btn.dataset.id ? { ...t, done: !isDone } : t)
        );
        renderList(null, null, 'local');
      });
    });
    document.querySelectorAll('.local-task-del').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.saveLocalTasks(Storage.getLocalTasks().filter(t => t.id !== btn.dataset.id));
        renderList(null, null, 'local');
      });
    });
  }

  function addLocalTask() {
    const input = document.getElementById('local-task-input');
    const title = (input?.value || '').trim().slice(0, 256);
    if (!title) return;
    const tasks = Storage.getLocalTasks();
    tasks.push({ id: String(Date.now()), title, done: false });
    Storage.saveLocalTasks(tasks);
    renderList(null, null, 'local');
  }

  // ── Google Tasks API calls ─────────────────────────────────────────────────

  async function apiFetch(method, path, body) {
    const token = await getValidToken();
    if (!token) throw new Error('not connected');
    const opts = {
      method,
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const resp = await fetch(`${API}${path}`, opts);
    if (resp.status === 204) return null;
    if (resp.status === 401) {
      await Storage.clearSessionToken();
      throw new Error('session expired — click ↻ to reconnect');
    }
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API error ${resp.status}: ${text}`);
    }
    return resp.json();
  }

  function apiAddTask(listId, title, due) {
    const body = { title };
    if (due) body.due = due;
    return apiFetch('POST', `/lists/${encodeURIComponent(listId)}/tasks`, body);
  }

  function apiPatchTask(listId, taskId, fields) {
    return apiFetch('PATCH', `/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`, fields);
  }

  function apiDeleteTask(listId, taskId) {
    return apiFetch('DELETE', `/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`);
  }

  // ── OAuth implicit flow ────────────────────────────────────────────────────

  async function launchAuth(clientId) {
    const redirectUrl = chrome.identity.getRedirectURL();
    const state       = crypto.randomUUID();

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id',     clientId);
    authUrl.searchParams.set('redirect_uri',  redirectUrl);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope',         SCOPE);
    authUrl.searchParams.set('state',         state);

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl.toString(), interactive: true },
        (responseUrl) => {
          if (chrome.runtime.lastError || !responseUrl) {
            reject(new Error(chrome.runtime.lastError?.message || 'auth cancelled'));
            return;
          }
          const params        = new URLSearchParams(new URL(responseUrl).hash.slice(1));
          const returnedState = params.get('state');
          const token         = params.get('access_token');
          const error         = params.get('error');

          if (error)                   { reject(new Error(error)); return; }
          if (returnedState !== state) { reject(new Error('state mismatch')); return; }
          if (!token)                  { reject(new Error('no token returned')); return; }

          const expiresIn = parseInt(params.get('expires_in') || '3600', 10);
          resolve({ access_token: token, expires_at: Date.now() + expiresIn * 1000 });
        }
      );
    });
  }

  async function getValidToken() {
    const creds = await Storage.getSessionToken();
    if (!creds) return null;
    if (creds.expires_at && Date.now() < creds.expires_at - 60_000) return creds.access_token;
    await Storage.clearSessionToken();
    return null;
  }

  async function connect() {
    const s = Storage.getSettings();
    if (!s.oauth_client_id) throw new Error('set client ID in Settings → Tasks first');
    const tokens = await launchAuth(s.oauth_client_id);
    await Storage.setSessionToken(tokens);
    s.google_auth_enabled = true;
    Storage.saveSettings(s);
  }

  async function disconnect() {
    await Storage.clearSessionToken();
    const s = Storage.getSettings();
    s.google_auth_enabled = false;
    Storage.saveSettings(s);
  }

  async function reloadOrReconnect(listId) {
    const token = await getValidToken();
    if (token) { await loadGoogleTasks(listId, true); return; }

    const el = document.getElementById('task-list');
    if (el) el.innerHTML = `<div class="task-item muted"><span>reconnecting…</span></div>`;
    try {
      await connect();
      await loadGoogleTasks(listId, true);
    } catch (e) {
      renderList(null, e.message, null);
    }
  }

  // ── Google Tasks fetch ─────────────────────────────────────────────────────

  async function loadGoogleTasks(listId, forceRefresh) {
    const cacheKey = `${CACHE_PREFIX}${listId || '@default'}`;

    if (!forceRefresh) {
      const cached = Storage.getCachedTasks(cacheKey);
      if (cached) { renderList(cached, null, null); return; }
    } else {
      Storage.invalidateTasksCache(cacheKey);
    }

    const el = document.getElementById('task-list');
    if (el) el.innerHTML = `<div class="task-item muted"><span>fetching…</span></div>`;

    const token = await getValidToken();
    if (!token) {
      renderList(null, 'session expired — click ↻ to reconnect', null);
      return;
    }

    const id   = encodeURIComponent(listId || '@default');
    const url  = `${API}/lists/${id}/tasks?showCompleted=true&maxResults=20`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (resp.status === 401) {
      await Storage.clearSessionToken();
      renderList(null, 'session expired — click ↻ to reconnect', null);
      return;
    }
    if (!resp.ok) { renderList(null, `error ${resp.status}`, null); return; }

    const data  = await resp.json();
    const tasks = (data.items || []).filter(t => t.title);
    Storage.setCachedTasks(cacheKey, tasks);
    renderList(tasks, null, null);
  }

  async function fetchLists() {
    const token = await getValidToken();
    if (!token) throw new Error('not connected');
    const resp = await fetch(`${API}/users/@me/lists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.status === 401) {
      await Storage.clearSessionToken();
      throw new Error('session expired — reconnect in Settings');
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  async function init() {
    const s   = Storage.getSettings();
    const col = document.getElementById('tasks-col');
    const btn = document.getElementById('task-refresh');

    if (!s.show_tasks) { if (col) col.style.display = 'none'; return; }

    if (s.google_auth_enabled) {
      const token = await getValidToken();
      if (token) {
        await loadGoogleTasks(s.tasks_list_id, false);
      } else {
        const cacheKey = `${CACHE_PREFIX}${s.tasks_list_id || '@default'}`;
        const cached   = Storage.getCachedTasks(cacheKey);
        if (cached) renderList(cached, null, null);
        else        renderList(null, 'session expired — click ↻ to reconnect', null);
      }
      if (btn) btn.addEventListener('click', () => reloadOrReconnect(s.tasks_list_id));
    } else {
      renderList(null, null, 'local');
      if (btn) btn.addEventListener('click', () => renderList(null, null, 'local'));
    }
  }

  return { init, connect, disconnect, fetchLists, getValidToken };
})();