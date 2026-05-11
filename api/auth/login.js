const crypto = require('crypto');
const cookie = require('cookie');

module.exports = function handler(req, res) {
  const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'OAuth not configured' });
  }

  // Generate CSRF state token
  const state = crypto.randomBytes(16).toString('hex');

  // Store state in a short-lived cookie for validation in callback
  res.setHeader('Set-Cookie', cookie.serialize('notion_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 300, // 5 minutes
  }));

  const authorizeUrl = 'https://api.notion.com/v1/oauth/authorize?' + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: state,
    owner: 'user', // Each user authorizes their OWN workspace
  }).toString();

  res.writeHead(302, { Location: authorizeUrl });
  res.end();
};
