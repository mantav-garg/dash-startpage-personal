// Entry point for the startpage. Applies theme then initializes all modules.

(function () {
  const s    = Storage.getSettings();
  const root = document.documentElement;

  root.style.setProperty('--bg',      s.color_bg);
  root.style.setProperty('--surface', s.color_surface);
  root.style.setProperty('--border',  s.color_border);
  root.style.setProperty('--text',    s.color_text);
  root.style.setProperty('--muted',   s.color_muted);
  root.style.setProperty('--accent',  s.color_accent);
  root.style.setProperty('--font',    `'${s.font}', 'Courier New', monospace`);

  const fontLink = document.getElementById('font-link');
  if (fontLink && s.font) {
    fontLink.href = `https://fonts.googleapis.com/css2?family=${s.font.replace(/ /g, '+')}:wght@300;400;700&display=swap`;
  }

  // Time-aware greeting with emoji
  const greetingEl = document.getElementById('greeting');
  if (greetingEl) {
    if (s.greeting_custom) {
      greetingEl.textContent = `${s.greeting_custom} ${s.name}`;
    } else {
      const h = new Date().getHours();
      let phrase, emoji;
      if (h >= 5 && h < 12)       { phrase = 'good morning';   emoji = '☀️'; }
      else if (h >= 12 && h < 17) { phrase = 'good afternoon'; emoji = '🌤️'; }
      else if (h >= 17 && h < 21) { phrase = 'good evening';   emoji = '🌆'; }
      else                         { phrase = 'good night';     emoji = '🌙'; }
      greetingEl.textContent = `${emoji} ${phrase}, ${s.name}`;
    }
  }

  Clock.init(s.clock_format);
  Bookmarks.render();
  Tasks.init();
})();

// Translate vertical wheel scroll → horizontal scroll on the bookmark column.
(function () {
  const col = document.getElementById('bookmarks-col');
  if (!col) return;
  col.addEventListener('wheel', (e) => {
    if (e.deltaX !== 0) return;
    e.preventDefault();
    col.scrollLeft += e.deltaY;
  }, { passive: false });
})();

// Keyboard shortcut: / or Ctrl+K → focus bookmark search input.
// Esc → clear and blur.
(function () {
  const input = document.getElementById('bm-search');
  if (!input) return;

  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

    if (e.key === 'Escape' && document.activeElement === input) {
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.blur();
      return;
    }

    if (inInput) return;

    if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const grid = document.getElementById('bookmark-grid');
    if (!grid) return;

    grid.querySelectorAll('.bm-category').forEach(col => {
      let anyVisible = false;
      col.querySelectorAll('.bm-link').forEach(a => {
        const title = a.querySelector('.bm-title')?.textContent.toLowerCase() || '';
        const match = !q || title.includes(q);
        a.style.display = match ? '' : 'none';
        if (match) anyVisible = true;
      });
      col.style.display = anyVisible ? '' : 'none';
    });
  });
})();