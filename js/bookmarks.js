// Renders the bookmark grid on the main page.

const FAVICON_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='2' fill='%231e1e1e'/%3E%3Crect x='4' y='4' width='8' height='1.5' rx='.75' fill='%23555'/%3E%3Crect x='4' y='7' width='6' height='1.5' rx='.75' fill='%23444'/%3E%3Crect x='4' y='10' width='4' height='1.5' rx='.75' fill='%23333'/%3E%3C/svg%3E";

const Bookmarks = (() => {
  const _inflight = new Map();

  function _getDomain(url) {
    try { return new URL(url).hostname; }
    catch { return ''; }
  }

  function _isTruncated(el) {
    return el.scrollWidth > el.clientWidth;
  }

  // Returns an ordered array of category names.
  // Saved order is respected; new categories are appended alphabetically.
  function _sortedCategories(cats) {
    const saved   = Storage.getCategoryOrder();
    const all     = Object.keys(cats).sort((a, b) => a.localeCompare(b));
    const ordered = saved.filter(c => cats[c]);
    const rest    = all.filter(c => !ordered.includes(c));
    return [...ordered, ...rest];
  }

  // Fetches favicon for a domain, converts to data URL, writes to cache.
  // Returns data URL on success or null on failure.
  // Deduplicates concurrent fetches for the same domain.
  async function _fetchFavicon(domain) {
    if (_inflight.has(domain)) return _inflight.get(domain);

    const promise = (async () => {
      const url = `https://favicon.im/${encodeURIComponent(domain)}?throw-error-on-404=true`;
      let resp;
      try {
        resp = await fetch(url, { cache: 'force-cache' });
      } catch {
        return null;
      } finally {
        _inflight.delete(domain);
      }

      if (!resp.ok) {
        if (resp.status >= 400 && resp.status < 500) Storage.markFaviconFailed(domain);
        return null;
      }

      try {
        const blob   = await resp.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload  = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (dataUrl) Storage.markFaviconOk(domain, dataUrl);
        return dataUrl;
      } catch {
        return null;
      }
    })();

    _inflight.set(domain, promise);
    return promise;
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

    const sortedCats = _sortedCategories(cats);
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

        const domain = _getDomain(bm.url);
        if (domain) {
          const img = document.createElement('img');
          img.className = 'bm-fav';
          img.alt = '';

          const cached = Storage.getFavicon(domain);
          if (cached === null) {
            img.src = FAVICON_PLACEHOLDER;
          } else if (typeof cached === 'string') {
            img.src = cached;
          } else {
            img.src = FAVICON_PLACEHOLDER;
            _fetchFavicon(domain).then(dataUrl => { if (dataUrl) img.src = dataUrl; });
          }

          a.appendChild(img);
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
          tooltip.style.display = _isTruncated(titleSpan) ? 'block' : 'none';
        });

        list.appendChild(a);
      }

      col.appendChild(list);
      grid.appendChild(col);
    }
  }

  return { render };
})();