# 💀 DashStartpage

> This is a modified version of the original repo, i have added shortcut to open the `tasks input` using shortcut `t` and also the functionality to `esc` from it and keep on entering newe tasks in one go by pressing enter consequentially. 

> A minimal, monospaced browser startpage that gets out of your way - and actually stays out of your way.

Every time you open a new tab, you get exactly what you need: the time, your tasks, and your bookmarks - nothing else. No widgets, no news feed, no distractions. Just a fast, keyboard-driven launchpad with the aesthetic of a terminal and the polish of a product you'd actually pay for.

Syncs your Google Tasks bidirectionally, so the to-do you added on your phone shows up here, and vice versa. Falls back gracefully to on-device tasks when you're offline or unauthenticated. Your OAuth token never touches disk - it lives in RAM and dies when the browser closes.

---

## Browser support

DashStartpage is built on **Manifest V3** and relies on three Chrome extension APIs: `chrome.identity` (OAuth flow), `chrome.storage.session` (RAM-only token), and `chrome.storage` (settings). Any Chromium-based browser that supports MV3 and exposes these APIs will run it without modification.

### ✅ Fully supported

| Browser | Engine | Notes |
| --------- | -------- | ------- |
| **Google Chrome** | Chromium | Primary target. All APIs supported since Chrome 102. |
| **Microsoft Edge** | Chromium | Full MV3 + `chrome.identity` support. Load via *Manage Extensions → Load unpacked*. |
| **Brave** | Chromium | Fully compatible. Load via *Settings → Extensions → Developer mode*. |
| **Opera** | Chromium | Supported via Opera's built-in extension loader (Opera 80+). |
| **Vivaldi** | Chromium | Fully compatible. Load via *Tools → Extensions → Developer mode*. |
| **Arc** | Chromium | Fully compatible. Load via Chrome extension sidebar in developer mode. |
| **Yandex Browser** | Chromium | Fully compatible. |
| **Kiwi Browser** | Chromium | Mobile Chrome extension support on Android - works including OAuth flow. |

### ❌ Not supported

| Browser | Reason |
|---------|--------|
| **Firefox** | Uses its own WebExtensions API. `chrome.identity.launchWebAuthFlow` and `chrome.storage.session` are not available or behave differently. A Firefox port would require a separate manifest and polyfills. |
| **Safari** | Uses Safari Web Extensions with a different toolchain and API surface. Not compatible without a full rewrite. |

### Minimum version requirement

The binding constraint is `chrome.storage.session`, introduced in **Chrome 102** (May 2022). Any Chromium-based browser built on Chromium 102 or later is sufficient.

---

## Features

- **Clock** - large, minimal, click to toggle 12h / 24h. Blinks the colon every second.
- **Greeting** - time-aware (morning / afternoon / evening / night) or fully custom.
- **Bookmarks** - grouped by category, alphabetically sorted within each group, with favicons fetched and cached locally. Keyboard-navigable with `/` or `Ctrl+K` to search.
- **Tasks** - Google Tasks integration (add, complete, delete, due dates) with a 5-minute local cache. Falls back to fully offline on-device tasks when not connected.
- **Themes** - 24 built-in color schemes, a full custom color editor, and a named palette system to save and swap your own.
- **Fonts** - 10 curated monospace fonts, switchable live with a preview.
- **Category ordering** - drag-and-drop to control the column order of your bookmarks.
- **Export / Import** - full JSON backup and restore of settings and bookmarks. Credentials are never exported.
- **Favicon cache** - fetched once, stored as data URLs in `localStorage`, refreshed every 7 days.

---

## Install (unpacked)

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select this folder
4. Open a new tab

---

## Google Tasks setup

You need a Google Cloud project with the Tasks API enabled and an OAuth 2.0 client configured for a Chrome extension. The whole flow uses the implicit grant - no client secret required.

### Step 1 - Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create a new project (or select an existing one)
3. Enable the **Google Tasks API**: APIs & Services → Enable APIs → search "Tasks API"
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
5. Application type: **Web Application**
6. Fill the **Application Name** field. Leave **Authorized JavaScript Origins** blank. Set **Authorized Redirect URIs** to:

   ```text
   https://<your-extension-id>.chromiumapp.org/
   ```

   Find your extension ID at `chrome://extensions/` after loading the extension unpacked.
7. Copy the generated **Client ID**
8. Go to **Google Auth Platform → Audience** and add your Google account email under **Test Users**

### Step 2 - Paste the Client ID

Open the startpage settings (top-right corner) and paste your Client ID into the **Client ID** field under the Tasks section.

### Step 3 - Reload and connect

1. Click **Save Settings**
2. Click **Connect Google Account**
3. Approve the consent screen
4. Done - your token is managed entirely by Chrome and never written to disk

---

## Supported Fonts

All fonts are loaded on-demand from Google Fonts:

| Font | Style |
| ------ | ------- |
| JetBrains Mono | Default - crisp, designed for code |
| Fira Code | Ligature-rich, warm |
| Source Code Pro | Adobe's clean workhorse |
| IBM Plex Mono | Corporate precision |
| Inconsolata | Humanist mono, highly readable |
| Roboto Mono | Familiar, neutral |
| Space Mono | Geometric, retro feel |
| Courier Prime | Classic typewriter, refined |
| Oxanium | Futuristic, angular |
| Share Tech Mono | Stark, technical |

---

## Built-in Color Schemes

24 pre-built TUI-inspired palettes covering the full spectrum of terminal aesthetics:

| Name | Mood |
| ------ | ------ |
| Gruvbox Dark | Warm amber on charcoal |
| Gruvbox Light | Inverted, parchment tones |
| Catppuccin Mocha | Soft pastel on deep navy |
| Catppuccin Macchiato | Cooler mauve variant |
| Catppuccin Frappé | Mid-tone lavender |
| Catppuccin Latte | Light, cream background |
| Nord | Icy blue on arctic grey |
| Tokyo Night | Deep blue-black, electric accent |
| Tokyo Day | Light Tokyo - blue on linen |
| Monokai | Classic dark with lime accent |
| Dracula | Purple & pink on near-black |
| Solarized Dark | Ethan Schoonover's original dark |
| Solarized Light | Schoonover's light variant |
| One Dark | Atom's flagship dark theme |
| Ayu Dark | Deep ink, amber highlights |
| Ayu Mirage | Softer dark, warm orange |
| Everforest Dark | Muted greens, earthy tones - default |
| Rosé Pine | Deep violet, dusty rose |
| Rosé Pine Moon | Cooler violet variant |
| Kanagawa | Japanese ink wash, steel blue |
| Horizon | Dark purple, coral accent |
| Material Dark | Google Material, teal accent |
| Poimandres | Deep navy, mint accent |
| Chalk | Near-black, soft pink |

Clicking a palette previews it live. Hit **Save Settings** to persist.

---

## Security model

| What | Where stored | On disk? |
| ------ | ------------- | ---------- |
| Settings, bookmarks | `localStorage` | Yes (no credentials) |
| Favicon cache | `localStorage` | Yes (data URLs only) |
| Task title cache | `localStorage` | Yes (not sensitive) |
| OAuth token | `chrome.storage.session` | **No - RAM only** |

- `chrome.identity` manages the full OAuth flow. Your JavaScript never sees the raw token during the consent step.
- `chrome.storage.session` clears automatically when the browser closes.
- On a 401 response, the token is evicted immediately and the user is prompted to refresh.
- Export deliberately strips `oauth_client_id`, `oauth_client_secret`, and `tasks_token` - credentials never leave the browser via the backup flow.

---

## Keyboard shortcuts

| Key | Action |
| ----- | -------- |
| `/` or `Ctrl+K` | Focus bookmark search |
| `t` | Focus on new task input box |
| `↓` from search | Move focus to first result |
| `↑` / `↓` in results | Navigate bookmark links |
| `Enter` on a result | Open link |
| `Esc` from search | Clear and blur |
| `Esc` from result | Return focus to search input |
| `Esc` from new task input | Clear and blur |
| Click clock | Toggle 12h / 24h |
| `Ctrl+S` / `Cmd+S` | Save settings (settings page) |


---

## File structure

```
dash-startpage/
├── manifest.json          MV3, oauth2 block, strict CSP
├── index.html             Main startpage
├── settings.html          Settings page
├── css/
│   ├── style.css          Shared styles + CSS variables
│   └── settings.css       Settings page styles
├── js/
│   ├── storage.js         localStorage + chrome.storage.session abstraction
│   ├── clock.js           Clock tick and 12h/24h toggle
│   ├── bookmarks.js       Bookmark grid renderer + favicon cache
│   ├── tasks.js           Google Tasks API + local tasks + auth
│   ├── main.js            Entry point - theme application + keyboard shortcuts
│   └── settings.js        Settings page logic
└── icons/
    └── icon.png           Extension icon (16 / 48 / 128)
```

---

## Tech notes

- **Manifest V3** - fully compliant, no background service worker required
- **Zero external runtime dependencies** - plain ES6 modules, no build step, no bundler
- **CSP-hardened** - strict `default-src 'self'` with explicit allowlists only for Google Fonts, favicon service, and Tasks API
- **Favicon service** - uses [favicon.im](https://favicon.im), deduplicated in-flight fetches, 7-day TTL for hits, 90-day TTL for 404s to avoid repeated failed requests
- **Task cache** - 5-minute TTL in `localStorage`, keyed per list ID, invalidated on any write operation

---

## License

[![MIT License](https://img.shields.io/badge/LICENSE-MIT-red.svg)](https://github.com/its0din-ai/dash-startpage/blob/master/LICENSE)