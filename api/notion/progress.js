const { requireAuth, notionFetch, findDatabase, DB_NAMES } = require('./_helpers');

module.exports = async function handler(req, res) {
  var token = requireAuth(req, res);
  if (!token) return;

  try {
    // Find all databases in parallel
    var [lessonsId, promptsId, toolsId, portfolioId, workflowsId] = await Promise.all([
      findDatabase(token, DB_NAMES.lessons),
      findDatabase(token, DB_NAMES.prompts),
      findDatabase(token, DB_NAMES.tools),
      findDatabase(token, DB_NAMES.portfolio),
      findDatabase(token, DB_NAMES.workflows),
    ]);

    var stats = { lessons: null, prompts: null, tools: null, portfolio: null, workflows: null };

    // Query each found database for counts
    var queries = [];

    if (lessonsId) {
      queries.push(
        notionFetch(token, '/databases/' + lessonsId + '/query', {
          method: 'POST',
          body: JSON.stringify({ page_size: 100 }),
        }).then(function(data) {
          var total = data.results.length;
          var completed = data.results.filter(function(p) {
            // Look for a Status/Checkbox property indicating completion
            var props = p.properties || {};
            for (var key in props) {
              var prop = props[key];
              if (prop.type === 'checkbox' && prop.checkbox) return true;
              if (prop.type === 'status' && prop.status && prop.status.name) {
                var name = prop.status.name.toLowerCase();
                if (name === 'done' || name === 'completed' || name === 'complete') return true;
              }
              if (prop.type === 'select' && prop.select && prop.select.name) {
                var sname = prop.select.name.toLowerCase();
                if (sname === 'done' || sname === 'completed' || sname === 'complete') return true;
              }
            }
            return false;
          }).length;
          stats.lessons = { total: total, completed: completed, dbId: lessonsId };
        })
      );
    }

    if (promptsId) {
      queries.push(
        notionFetch(token, '/databases/' + promptsId + '/query', {
          method: 'POST',
          body: JSON.stringify({ page_size: 100 }),
        }).then(function(data) {
          stats.prompts = { count: data.results.length, dbId: promptsId };
        })
      );
    }

    if (toolsId) {
      queries.push(
        notionFetch(token, '/databases/' + toolsId + '/query', {
          method: 'POST',
          body: JSON.stringify({ page_size: 100 }),
        }).then(function(data) {
          stats.tools = { count: data.results.length, dbId: toolsId };
        })
      );
    }

    if (portfolioId) {
      queries.push(
        notionFetch(token, '/databases/' + portfolioId + '/query', {
          method: 'POST',
          body: JSON.stringify({ page_size: 100 }),
        }).then(function(data) {
          stats.portfolio = { count: data.results.length, dbId: portfolioId };
        })
      );
    }

    if (workflowsId) {
      queries.push(
        notionFetch(token, '/databases/' + workflowsId + '/query', {
          method: 'POST',
          body: JSON.stringify({ page_size: 100 }),
        }).then(function(data) {
          stats.workflows = { count: data.results.length, dbId: workflowsId };
        })
      );
    }

    await Promise.all(queries);
    res.json(stats);
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
};
