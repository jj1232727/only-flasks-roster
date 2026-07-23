# Only Flasks roster poll

React + Tailwind on GitHub Pages, backed by one private Google Sheet through Google Apps Script. There is no Supabase account, database server, or Discord OAuth configuration.

## What is public and private

- GitHub Pages contains only the UI and the public Apps Script deployment URL.
- The Google Sheet remains private to its owners.
- Public users can submit and see anonymous aggregate counts.
- The browser creates an invisible random identity token. Apps Script stores only its salted hash, allowing updates from the same browser without asking players for a password or edit code.
- Raid-leader data requires a long admin secret stored in Apps Script properties. It is not committed to GitHub.

This is appropriate for a guild preference poll, but it is not enterprise identity management: names are self-asserted, and anyone can submit a new name. Clearing browser storage or changing devices loses automatic edit access. Use a long random admin secret and share it only with officers.

## One-time Google setup

1. Create a private Google Sheet.
2. Open Extensions → Apps Script.
3. Copy all of [`google-apps-script/Code.gs`](google-apps-script/Code.gs) into the editor.
4. In `setup()`, replace the placeholder with a long random raid-leader secret.
5. Run `setup()` once and approve the requested Sheet permission.
6. Choose Deploy → New deployment → Web app.
7. Set **Execute as** to yourself and **Who has access** to anyone.
8. Deploy and copy the URL ending in `/exec`.

The Sheet must be private. “Anyone” applies to the narrow web-app API, not to the Sheet itself.

When updating Apps Script later, use Deploy → Manage deployments → Edit, select **New version**, and deploy.

## GitHub Pages setup

1. In the repository settings, set Pages → Source to **GitHub Actions**.
2. Under Settings → Secrets and variables → Actions → Variables, add:
   - Name: `VITE_APPS_SCRIPT_URL`
   - Value: the Apps Script `/exec` URL
3. Push to `main`. The included workflow builds and deploys the app.

The Apps Script URL is intentionally a repository variable rather than a secret: every browser must receive it. Security comes from server-side browser-identity hashes and the admin secret.

Ordinary players see only the submission and anonymous breakdown tabs. Raid leaders use `https://YOUR_SITE/?officer=1`; that reveals the raid-leader login screen but still requires the server-validated admin secret.

## Local preview

Copy `.env.example` to `.env.local`, paste the `/exec` URL, then:

```sh
npm install
npm run dev
```

Without `.env.local`, the UI still opens in preview mode but saving and live data are disabled.

## Pre-launch test

- Submit a new response and update it from the same browser.
- Confirm another browser cannot overwrite that Discord name.
- Confirm the public breakdown contains no names.
- Unlock Raid Leaders with the admin secret and save a roster decision.
- Confirm the Sheet is not shared publicly.
