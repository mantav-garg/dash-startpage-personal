// Drives the clock and date display on the main page.

const Clock = (() => {
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  let fmt      = '24h';
  let _timer   = null;

  function tick() {
    const now = new Date();
    let h     = now.getHours();
    const m   = now.getMinutes();
    let ampm  = '';

    if (fmt === '12h') {
      ampm = h >= 12 ? ' pm' : ' am';
      h    = h % 12 || 12;
    }

    document.getElementById('clock-h').textContent    = String(h).padStart(2, '0');
    document.getElementById('clock-m').textContent    = String(m).padStart(2, '0');
    document.getElementById('clock-ampm').textContent = ampm;

    const sep = document.querySelector('.sep');
    if (sep) sep.style.opacity = now.getSeconds() % 2 === 0 ? '1' : '0.15';

    document.getElementById('date-line').textContent =
      `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }

  function init(format) {
    fmt = format || '24h';
    if (_timer) clearInterval(_timer);
    tick();
    _timer = setInterval(tick, 1000);
  }

  function toggle() {
    const s  = Storage.getSettings();
    fmt      = fmt === '24h' ? '12h' : '24h';
    s.clock_format = fmt;
    Storage.saveSettings(s);
    tick();
  }

  return { init, toggle };
})();