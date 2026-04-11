// Renders the bookmark grid on the main page.

const Bookmarks = (() => {
  function getDomain(url) {
    try { return new URL(url).hostname; }
    catch { return ''; }
  }

  function isTruncated(el) {
    return el.scrollWidth > el.clientWidth;
  }

  function render() {
    const bookmarks = Storage.getBookmarks();
    const grid = document.getElementById('bookmark-grid');
    if (!grid) return;

    const cats = {};
    for (const bm of bookmarks) {
      const cat = (bm.category || 'Other').trim();
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(bm);
    }

    const sortedCats = Object.keys(cats).sort((a, b) => a.localeCompare(b));
    for (const cat of sortedCats) {
      cats[cat].sort((a, b) => a.title.localeCompare(b.title));
    }

    grid.innerHTML = '';

    for (const cat of sortedCats) {
      const col = document.createElement('div');
      col.className = 'bm-category';

      const lbl = document.createElement('div');
      lbl.className = 'bm-cat-label';
      lbl.textContent = cat;
      col.appendChild(lbl);

      const list = document.createElement('div');
      list.className = 'bm-list';

      for (const bm of cats[cat]) {
        const a = document.createElement('a');
        a.className = 'bm-link';
        a.href = bm.url;

        const domain = getDomain(bm.url);
        if (domain) {
          const favUrl = Storage.getFavicon(domain);
          if (favUrl) {
            const img = document.createElement('img');
            img.className = 'bm-fav';
            img.src = favUrl;
            img.alt = '';
            img.loading = 'lazy';
            img.onload  = () => Storage.markFaviconOk(domain);
            img.onerror = () => { Storage.markFaviconFailed(domain); img.remove(); };
            a.appendChild(img);
          }
        }

        const titleSpan = document.createElement('span');
        titleSpan.className = 'bm-title';
        titleSpan.textContent = bm.title;
        a.appendChild(titleSpan);

        const tooltip = document.createElement('span');
        tooltip.className = 'bm-tooltip';
        tooltip.textContent = bm.title;
        a.appendChild(tooltip);

        a.addEventListener('mouseenter', () => {
          tooltip.style.display = isTruncated(titleSpan) ? 'block' : 'none';
        });

        list.appendChild(a);
      }

      col.appendChild(list);
      grid.appendChild(col);
    }
  }

  return { render };
})();