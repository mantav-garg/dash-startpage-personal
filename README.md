# Dash Startpage - Quick Access to Favorites

A Minimal and Monospaced Browser Startpage. Integrated with Google Tasks for Immersive switch between browser and phones.

## Install (unpacked)

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select this folder
4. Open a new tab

## Google Tasks setup (required before connecting)

You need a Google Cloud project with the Tasks API enabled and an OAuth client
configured for a Chrome extension.

### Step 1 — Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one)
3. Enable the **Google Tasks API**: [APIs & Services → Enable APIs → search "Tasks API"](https://console.cloud.google.com/marketplace/product/google/tasks.googleapis.com)
4. Go to **[APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → Create Credentials → OAuth client ID**
5. Application type: **Web Application**
6. Fill the Application Name → Ignore the **Authorized Javascript Origin** → and Fill **Authorized Redirect URIs** with https://<extension-id>.chromiumapp.org/
   
   *) extension-id: find yours at `chrome://extensions/` after loading unpacked
7. Copy the generated **Client ID**
8. Go to **[Google Auth Platform → Audience](https://console.cloud.google.com/auth/audience)** and Add Your Google Email address into the Test Users

### Step 2 — Paste client ID into the settings page (Top-Right of the window)

### Step 3 — Reload and connect

1. Save Settings before Connect
2. Click on **connect google account**
3. Chrome shows a consent screen and logged in users - approve it
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
