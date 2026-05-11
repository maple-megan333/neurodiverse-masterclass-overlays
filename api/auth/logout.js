const cookie = require('cookie');

module.exports = function handler(req, res) {
  res.setHeader('Set-Cookie', [
    cookie.serialize('notion_token', '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 }),
    cookie.serialize('notion_workspace', '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 }),
  ]);
  res.json({ ok: true });
};
