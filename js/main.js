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

// Click the clock to toggle 12h / 24h format.
(function () {
  const clockEl = document.getElementById('clock');
  if (!clockEl) return;
  clockEl.style.cursor = 'pointer';
  clockEl.title        = 'click to toggle 12h / 24h';
  clockEl.addEventListener('click', () => Clock.toggle());
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

// Keyboard shortcuts for bookmark search.
// /  or Ctrl+K → focus input
// ↓  from input → move into results
// ↑/↓ within results → navigate
// Enter on a result → open link
// Esc → clear + blur (or return to input from a result)
(function () {
  const input = document.getElementById('bm-search');
  if (!input) return;

  function visibleLinks() {
    return [...document.querySelectorAll('#bookmark-grid .bm-link')]
      .filter(a => a.style.display !== 'none');
  }

  document.addEventListener('keydown', (e) => {
    const tag     = document.activeElement?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

    // Esc from search → clear + blur
    if (e.key === 'Escape' && document.activeElement === input) {
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.blur();
      return;
    }

    // Esc from a bookmark → back to search
    if (e.key === 'Escape' && document.activeElement?.classList.contains('bm-link')) {
      e.preventDefault();
      input.focus();
      return;
    }

    // ↓ from search input → first visible link
    if (e.key === 'ArrowDown' && document.activeElement === input) {
      e.preventDefault();
      visibleLinks()[0]?.focus();
      return;
    }

    // ↑ / ↓ within bookmark links
    if (document.activeElement?.classList.contains('bm-link')) {
      const links = visibleLinks();
      const idx   = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        links[idx + 1]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx === 0) input.focus();
        else links[idx - 1]?.focus();
      }
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
    const q    = input.value.trim().toLowerCase();
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