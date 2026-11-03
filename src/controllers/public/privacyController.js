const { formatPolicyDate } = require('../../config/privacy');

function show(req, res) {
  res.render('pages/privacy', {
    title: res.locals.t('footer.privacy'),
    metaDescription: '',
    updated: formatPolicyDate(res.locals.lang),
  });
}

module.exports = { show };
