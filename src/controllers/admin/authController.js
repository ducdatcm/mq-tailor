const bcrypt = require('bcryptjs');
const db = require('../../config/db');

function loginPage(req, res) {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', {
    layout: 'layouts/admin-auth',
    title: 'Admin Login',
    error: req.flash('error'),
    next: req.query.next || '/admin',
  });
}

async function login(req, res, next) {
  try {
    const { username, password, next: nextUrl } = req.body;
    const user = await db('admin_users').where({ username: (username || '').trim() }).first();

    const valid = user && (await bcrypt.compare(password || '', user.password_hash));
    if (!valid) {
      req.flash('error', 'Incorrect username or password.');
      return res.redirect(`/admin/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`);
    }

    req.session.adminId = user.id;
    req.session.adminUsername = user.username;
    res.redirect(nextUrl && nextUrl.startsWith('/admin') ? nextUrl : '/admin');
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  req.session.destroy(() => res.redirect('/admin/login'));
}

module.exports = { loginPage, login, logout };
