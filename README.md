# Startpage — Chrome Extension

A minimal, monospace browser startpage. Replaces the New Tab page.

## Install (unpacked)

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select this folder
4. Open a new tab ✓

## Google Tasks setup (required before connecting)

You need a Google Cloud project with the Tasks API enabled and an OAuth client
configured for a Chrome extension.

### Step 1 — Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one)
3. Enable the **Google Tasks API**: APIs & Services → Enable APIs → search "Tasks API"
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
5. Application type: **Chrome extension**
6. Extension ID: find yours at `chrome://extensions/` after loading unpacked
7. Copy the generated **Client ID**

### Step 2 — Paste client ID into manifest.json

Open `manifest.json` and replace the placeholder:

```json
"oauth2": {
  "client_id": "REPLACE_WITH_YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/tasks.readonly"]
}
```

### Step 3 — Reload and connect

1. Reload the extension at `chrome://extensions/`
2. Open a new tab → Settings → Google Tasks → **connect google account**
3. Chrome shows a consent screen — approve it
4. Done. Token is handled entirely by Chrome, never stored on disk.

## Security model

| What | Where stored | On disk? |
|------|-------------|----------|
| Settings, bookmarks | `localStorage` | Yes (no credentials) |
| Favicon cache | `localStorage` | Yes (just URLs) |
| Task title cache | `localStorage` | Yes (not sensitive) |
| OAuth token | `chrome.storage.session` | **No — RAM only** |

- `chrome.identity` manages the full OAuth flow; your JS never sees the raw token during the consent step
- `chrome.storage.session` clears automatically when the browser closes
- On 401, the token is evicted and re-acquired silently without prompting

## File structure

```
startpage-ext/
├── manifest.json     MV3, oauth2 block, strict CSP
├── index.html        Main startpage
├── settings.html     Settings page
├── style.css         Shared styles + CSS variables
├── settings.css      Settings page styles
├── storage.js        localStorage + chrome.storage.session
├── clock.js          Clock tick
├── bookmarks.js      Bookmark grid renderer
├── tasks.js          Google Tasks API + cache + auth
├── main.js           Entry point
├── settings.js       Settings page logic
└── icon.png          Extension icon
```
