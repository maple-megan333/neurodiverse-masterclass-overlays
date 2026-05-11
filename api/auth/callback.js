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
    // tokenData contains: access_token, workspace_id, workspace_name, bot_id, etc.

    // Set httpOnly cookie with access token (30 day expiry)
    const setCookies = [
      cookie.serialize('notion_token', tokenData.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      }),
      cookie.serialize('notion_workspace', tokenData.workspace_id || '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      }),
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
      window.opener.postMessage({ type: 'notion-auth-complete' }, '*');
      setTimeout(function() { window.close(); }, 1500);
    } else {
      // Fallback: redirect back to the app
      window.location.href = '/#your-progress';
    }
  </script>
</body></html>`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ error: 'Internal error during OAuth' });
  }
};
