// Entry point for the startpage. Applies theme then initializes all modules.

(function () {
  const s = Storage.getSettings();

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

  const greeting = document.getElementById('greeting');
  if (greeting) {
    const text = s.greeting_custom || 'good to see you,';
    greeting.textContent = `${text} ${s.name}`;
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
    // Only intercept pure vertical scrolls (no shift key, no horizontal delta already)
    if (e.deltaX !== 0) return;
    e.preventDefault();
    col.scrollLeft += e.deltaY;
  }, { passive: false });
})();