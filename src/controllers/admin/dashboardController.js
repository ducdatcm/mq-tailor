const db = require('../../config/db');

async function show(req, res, next) {
  try {
    const [journalCount, peopleCount, millCount, newEnquiries, recentEnquiries] = await Promise.all([
      db('journal_posts').count({ c: '*' }).first(),
      db('people').count({ c: '*' }).first(),
      db('cloth_mills').count({ c: '*' }).first(),
      db('enquiries').where({ status: 'new' }).count({ c: '*' }).first(),
      db('enquiries').orderBy('created_at', 'desc').limit(5),
    ]);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      stats: {
        journal: Number(journalCount.c),
        people: Number(peopleCount.c),
        mills: Number(millCount.c),
        newEnquiries: Number(newEnquiries.c),
      },
      recentEnquiries,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
