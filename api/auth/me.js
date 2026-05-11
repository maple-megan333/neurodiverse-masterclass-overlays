const cookie = require('cookie');

module.exports = async function handler(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.notion_token;

  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const userRes = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!userRes.ok) {
      // Token revoked or expired
      return res.json({ authenticated: false });
    }

    const user = await userRes.json();
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.person ? user.person.email : null,
      },
      workspace_id: cookies.notion_workspace || null,
    });
  } catch (err) {
    console.error('Auth check error:', err);
    res.json({ authenticated: false });
  }
};
