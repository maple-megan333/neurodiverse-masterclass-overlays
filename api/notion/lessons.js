const { requireAuth, notionFetch, findDatabase, DB_NAMES } = require('./_helpers');

module.exports = async function handler(req, res) {
  var token = requireAuth(req, res);
  if (!token) return;

  try {
    var dbId = await findDatabase(token, DB_NAMES.lessons);
    if (!dbId) return res.json({ lessons: [], error: 'Lessons database not found' });

    var data = await notionFetch(token, '/databases/' + dbId + '/query', {
      method: 'POST',
      body: JSON.stringify({ page_size: 100 }),
    });

    var lessons = data.results.map(function(page) {
      var props = page.properties || {};
      var title = '';
      var status = 'not-started';
      var slug = '';

      for (var key in props) {
        var prop = props[key];
        if (prop.type === 'title' && prop.title) {
          title = prop.title.map(function(t) { return t.plain_text; }).join('');
        }
        if (prop.type === 'checkbox' && prop.checkbox) {
          status = 'completed';
        }
        if (prop.type === 'status' && prop.status && prop.status.name) {
          var sname = prop.status.name.toLowerCase();
          if (sname === 'done' || sname === 'completed' || sname === 'complete') status = 'completed';
          else if (sname === 'in progress' || sname === 'started') status = 'in-progress';
        }
        // Look for a slug/URL property
        if ((key.toLowerCase() === 'slug' || key.toLowerCase() === 'page') && prop.type === 'rich_text' && prop.rich_text) {
          slug = prop.rich_text.map(function(t) { return t.plain_text; }).join('');
        }
      }

      return { id: page.id, title: title, status: status, slug: slug };
    });

    res.json({ lessons: lessons });
  } catch (err) {
    console.error('Lessons error:', err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
};
