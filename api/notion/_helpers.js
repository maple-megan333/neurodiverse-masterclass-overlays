/**
 * Shared helpers for Notion API routes.
 * Handles auth extraction, database discovery, and common patterns.
 */
const cookie = require('cookie');

const NOTION_VERSION = '2022-06-28';

// Database names to search for. Each key maps to one or more aliases —
// the template may name DBs as "Prompts" OR "Prompt Library", "Tools" OR
// "Tool Registry", etc. findDatabase tries each alias in turn.
const DB_NAMES = {
  lessons: ['Lessons'],
  prompts: ['Prompt Library', 'Prompts'],
  tools: ['Tool Registry', 'Tools'],
  portfolio: ['Portfolio'],
  workflows: ['Workflows'],
};

/**
 * Extract the Notion access token from the request cookie.
 * Returns null if not authenticated.
 */
function getToken(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies.notion_token || null;
}

/**
 * Make a Notion API request with the user's token.
 */
async function notionFetch(token, path, options) {
  const res = await fetch('https://api.notion.com/v1' + path, {
    ...options,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(options && options.headers),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Notion API ' + res.status + ': ' + text);
  }
  return res.json();
}

/**
 * Search the user's workspace for a database. Accepts a string OR an
 * array of alias strings — tries each until one matches.
 * Returns the database ID or null if not found.
 */
async function findDatabase(token, titleOrAliases) {
  var aliases = Array.isArray(titleOrAliases) ? titleOrAliases : [titleOrAliases];
  for (var a = 0; a < aliases.length; a++) {
    var alias = aliases[a];
    var data = await notionFetch(token, '/search', {
      method: 'POST',
      body: JSON.stringify({
        query: alias,
        filter: { property: 'object', value: 'database' },
        page_size: 10,
      }),
    });
    for (var i = 0; i < data.results.length; i++) {
      var db = data.results[i];
      var dbTitle = '';
      if (db.title && db.title.length > 0) {
        dbTitle = db.title.map(function(t) { return t.plain_text; }).join('');
      }
      if (dbTitle.toLowerCase().includes(alias.toLowerCase())) {
        return db.id;
      }
    }
  }
  return null;
}

/**
 * Search for a page by title.
 */
async function findPage(token, title) {
  const data = await notionFetch(token, '/search', {
    method: 'POST',
    body: JSON.stringify({
      query: title,
      filter: { property: 'object', value: 'page' },
      page_size: 5,
    }),
  });
  for (var i = 0; i < data.results.length; i++) {
    var page = data.results[i];
    var props = page.properties || {};
    // Check title property
    for (var key in props) {
      if (props[key].type === 'title' && props[key].title) {
        var pageTitle = props[key].title.map(function(t) { return t.plain_text; }).join('');
        if (pageTitle.toLowerCase().includes(title.toLowerCase())) {
          return page.id;
        }
      }
    }
  }
  return null;
}

/**
 * Auth guard middleware. Returns token or sends 401.
 */
function requireAuth(req, res) {
  var token = getToken(req);
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return token;
}

module.exports = { getToken, notionFetch, findDatabase, findPage, requireAuth, DB_NAMES };
