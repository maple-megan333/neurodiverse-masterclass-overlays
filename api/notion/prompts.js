const { requireAuth, notionFetch, findDatabase, DB_NAMES } = require('./_helpers');

module.exports = async function handler(req, res) {
  var token = requireAuth(req, res);
  if (!token) return;

  try {
    var dbId = await findDatabase(token, DB_NAMES.prompts);
    if (!dbId) return res.json({ prompts: [], error: 'Prompts database not found' });

    var data = await notionFetch(token, '/databases/' + dbId + '/query', {
      method: 'POST',
      body: JSON.stringify({ page_size: 100 }),
    });

    var prompts = data.results.map(function(page) {
      var props = page.properties || {};
      var title = '';
      var category = '';

      for (var key in props) {
        var prop = props[key];
        if (prop.type === 'title' && prop.title) {
          title = prop.title.map(function(t) { return t.plain_text; }).join('');
        }
        if ((prop.type === 'select' || prop.type === 'multi_select') && key.toLowerCase().includes('categor')) {
          if (prop.select) category = prop.select.name;
          if (prop.multi_select) category = prop.multi_select.map(function(s) { return s.name; }).join(', ');
        }
      }

      return { id: page.id, title: title, category: category };
    });

    res.json({ prompts: prompts });
  } catch (err) {
    console.error('Prompts error:', err);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
};
