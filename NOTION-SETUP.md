# Notion Integration Verification

Pre-deploy checklist for the Neurodiverse AI MasterClass workshop.

## ✅ Already Verified

| Item | Status | Source |
|---|---|---|
| Vercel project linked | ✅ | `.vercel/project.json` (prj_qYEY1...) |
| Vercel CLI installed | ✅ | `which vercel` |
| `NOTION_OAUTH_CLIENT_ID` env var | ✅ | Set 32 days ago in Production |
| `NOTION_OAUTH_CLIENT_SECRET` env var | ✅ | Set 32 days ago in Production |
| `NOTION_REDIRECT_URI` env var | ✅ | `https://neurodiverse-masterclass-overlays.vercel.app/api/auth/callback` |
| OAuth flow code | ✅ | CSRF state + httpOnly cookies + origin-locked postMessage |
| DB name aliases bug fixed | ✅ | Now matches "Prompt Library" + "Tool Registry" (not just "Prompts"/"Tools") |
| Vercel functions structure | ✅ | api/auth/* + api/notion/* compatible with Vercel |

## 🔍 You Need to Verify (5 quick checks)

### 1. Notion OAuth Integration Exists
- Open https://www.notion.so/profile/integrations
- Look for an integration matching this app (likely named "Neurodiverse AI MasterClass" or similar)
- Verify the **OAuth redirect URI** matches: `https://neurodiverse-masterclass-overlays.vercel.app/api/auth/callback`
- Verify the **Client ID** and **Client Secret** match what's in Vercel env vars (you can re-pull via `vercel env pull` if unsure)

If the integration was deleted or the secret regenerated, update Vercel env vars with `vercel env rm NOTION_OAUTH_CLIENT_SECRET --yes && vercel env add NOTION_OAUTH_CLIENT_SECRET production`.

### 2. MasterClass Notion Template Accessible
- Open your Notion workspace
- Find the **Neurodiverse AI MasterClass** page (per MEMORY: `3361f6385b6b815f8f90f6b7cd71026c`)
- Verify the 5 databases exist as **child pages or linked databases** under it:
  - **Lessons** (per MEMORY: `216a9d9c`)
  - **Prompt Library** (per MEMORY: `5369fdc8`)
  - **Tool Registry** (per MEMORY: `b45ecedd`)
  - **Portfolio** (per MEMORY: `3a726583`)
  - **Workflows** (per MEMORY: `e7e4ea05`)
- Also verify the **AI Profile** sub-page exists (per MEMORY: `3361f6385b6b8192b237e06c4d5afc05`)

### 3. OAuth Integration Has Access to MasterClass Page
The OAuth flow uses `owner=user` which means each user authorizes pages individually during the OAuth flow. This is NOT a pre-grant.
- **When you click "Connect to Notion" in the deployed workshop**, Notion will show a page selector
- You will need to select the **MasterClass page** (and its children inherit)
- If you have already authorized once before, Notion may auto-grant access

### 4. Notion DB Schemas (read-only check)
For best results, the DBs should have:
- **Lessons** DB → a `Status` (status type) OR `Done` (checkbox type) property. Used to count completed lessons.
- **Prompt Library** DB → a `Category` (select/multi_select) property. Used to filter.
- All DBs → a Title property (default for any DB)

If these aren't present, the page will still load — just with incomplete data.

### 5. Test the integration locally before pushing (optional)
The local dev server (`python .devserver.py`) does NOT run the Node.js `api/` functions. For local testing of OAuth, you need Vercel dev:
```bash
vercel dev   # serves both static + api functions on http://localhost:3000
```
Note: Vercel dev requires `.env` with the 3 env vars to test locally. You can do:
```bash
vercel env pull .env   # downloads production env vars (already encrypted)
vercel dev
```
Then visit `http://localhost:3000/app.html` and click Connect.

⚠️ **Catch**: The OAuth redirect URI in your Notion integration is set to the **production URL**. For local testing, you'd need to either:
- Temporarily change it to `http://localhost:3000/api/auth/callback` (then change back before going live), OR
- Just test on production after deploy

## 🚀 Deploy Plan

When you're ready:

```bash
git push origin main
```

Vercel auto-deploys (~60-90 sec). Then:

1. Open https://neurodiverse-masterclass-overlays.vercel.app/app.html
2. Look for "Connect to Notion" button in the sidebar (added by `js/notion-client.js`)
3. Click it → popup opens → authorize in Notion → popup closes
4. Sidebar should now show your Notion user badge + green checkmarks on completed lessons
5. Visit "Your Data & Progress" page → should show real counts from your DBs

## 🛠️ If Something Breaks

- **"OAuth not configured"** → env vars not loaded; redeploy or re-add them
- **"Invalid state — possible CSRF attack"** → cookie was lost; click Connect again
- **Page selector shows nothing** → integration doesn't have access to your workspace pages; check Notion settings
- **Sidebar shows "Lessons database not found"** → 1 of 2 things: (a) DB name doesn't match `Lessons` or one of the aliases; (b) integration wasn't granted access to that DB
- **Cookies not persisting** → check that you're on HTTPS (sameSite:none requires secure:true requires HTTPS); local HTTP won't work

## 📋 Recovery Commands

```bash
# View current Vercel env vars
vercel env ls

# Update one (will prompt for new value)
vercel env rm NOTION_OAUTH_CLIENT_SECRET production --yes
vercel env add NOTION_OAUTH_CLIENT_SECRET production

# Force redeploy after env change
vercel --prod
```

---

**TL;DR**: Infrastructure is in place. You need to (1) verify Notion integration still exists + matches Vercel env, (2) confirm MasterClass template is in your workspace, (3) push + test OAuth flow on production.
