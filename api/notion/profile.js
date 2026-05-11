const { requireAuth, notionFetch, findPage } = require('./_helpers');

module.exports = async function handler(req, res) {
  var token = requireAuth(req, res);
  if (!token) return;

  try {
    var pageId = await findPage(token, 'AI Profile');
    if (!pageId) return res.json({ profile: null, error: 'AI Profile page not found' });

    // Fetch page blocks (content)
    var data = await notionFetch(token, '/blocks/' + pageId + '/children', {
      method: 'GET',
    });

    // Extract text content from blocks
    var sections = [];
    var currentSection = null;

    data.results.forEach(function(block) {
      if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
        var headingText = (block[block.type].rich_text || []).map(function(t) { return t.plain_text; }).join('');
        currentSection = { heading: headingText, content: [] };
        sections.push(currentSection);
      } else if (currentSection) {
        var blockText = '';
        var textKey = block[block.type];
        if (textKey && textKey.rich_text) {
          blockText = textKey.rich_text.map(function(t) { return t.plain_text; }).join('');
        }
        if (blockText) currentSection.content.push(blockText);
      }
    });

    res.json({ profile: sections, pageId: pageId });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch AI Profile' });
  }
};
