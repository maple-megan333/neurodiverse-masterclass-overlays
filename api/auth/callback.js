const cookie = require('cookie');

module.exports = async function handler(req, res) {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state parameter' });
  }

  // Validate CSRF state
  const cookies = cookie.parse(req.headers.cookie || '');
  if (cookies.notion_oauth_state !== state) {
    return res.status(403).json({ error: 'Invalid state — possible CSRF attack' });
  }

  const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
  const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Notion token exchange failed:', err);
      return res.status(502).json({ error: 'Token exchange failed' });
    }

    const tokenData = await tokenRes.json();
    // Per Notion's OAuth token response, tokenData contains: access_token,
    // refresh_token, bot_id, workspace_id, workspace_name, workspace_icon,
    // owner, and duplicated_template_id (the ID of the fresh page Notion
    // created when the user accepted the optional template during consent;
    // null if they connected an existing page instead).
    const COOKIE_OPTS = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    };

    const setCookies = [
      cookie.serialize('notion_token', tokenData.access_token, COOKIE_OPTS),
      cookie.serialize('notion_workspace', tokenData.workspace_id || '', COOKIE_OPTS),
      cookie.serialize('notion_workspace_name', tokenData.workspace_name || '', COOKIE_OPTS),
      // The duplicated template page becomes the user's data root. Stored so the
      // app can confirm "your copy is ready" and deep-link straight into it.
      cookie.serialize('notion_duplicated_template', tokenData.duplicated_template_id || '', COOKIE_OPTS),
      // Clear the state cookie
      cookie.serialize('notion_oauth_state', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 0,
      }),
    ];

    res.setHeader('Set-Cookie', setCookies);

    // Return HTML that sends postMessage to opener (for popup flow) then closes
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!DOCTYPE html>
<html><head><title>Connected!</title></head>
<body style="background:#0A0A14;color:#F8F8FC;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <div style="text-align:center">
    <p style="font-size:1.5rem">Connected to Notion!</p>
    <p style="color:rgba(255,255,255,0.6)">This window will close automatically...</p>
  </div>
  <script>
    if (window.opener) {
      // Restrict postMessage to our own origin only — avoids broadcasting to any listener
      window.opener.postMessage({ type: 'notion-auth-complete' }, window.location.origin);
      setTimeout(function() { window.close(); }, 1500);
    } else {
      // Same-tab fallback (popup was blocked): land on the app dashboard.
      // Must target the app shell (app.html), NOT the bare root — '/#your-progress'
      // resolves to the marketing homepage, where that anchor doesn't exist.
      window.location.href = '/app.html#your-progress';
    }
  </script>
</body></html>`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ error: 'Internal error during OAuth' });
  }
};
