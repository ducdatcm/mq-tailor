const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const { lockedFor, recordFailure, recordSuccess } = require('../../utils/loginLimiter');

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
    const back = `/admin/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`;
    const ip = req.ip;

    // Refuse before checking the password at all while locked, so a locked
    // attacker learns nothing from further guesses.
    const waitMinutes = lockedFor(ip, username);
    if (waitMinutes) {
      req.flash('error', `Too many wrong attempts. Please wait ${waitMinutes} minute${waitMinutes === 1 ? '' : 's'} and try again.`);
      return res.redirect(back);
    }

    const user = await db('admin_users').where({ username: (username || '').trim() }).first();
    const valid = user && (await bcrypt.compare(password || '', user.password_hash));
    if (!valid) {
      recordFailure(ip, username);
      req.flash('error', 'Incorrect username or password.');
      return res.redirect(back);
    }

    recordSuccess(ip, username);
    // New session id on login, so a session id seen before login can't be reused.
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.adminId = user.id;
      req.session.adminUsername = user.username;
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.redirect(nextUrl && nextUrl.startsWith('/admin') ? nextUrl : '/admin');
      });
    });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  req.session.destroy(() => res.redirect('/admin/login'));
}

module.exports = { loginPage, login, logout };
