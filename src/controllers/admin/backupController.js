const backup = require('../../utils/dbBackup');
const { csrfToken } = require('../../middleware/csrf');

async function show(req, res, next) {
  try {
    const status = await backup.getStatus();
    let backups = [];
    if (status.storageConfigured && !status.error) {
      backups = (await backup.listCloudBackups()).slice(0, 10);
    }
    res.render('admin/backups/index', {
      title: 'Backups',
      status,
      backups,
      csrfToken: csrfToken(req),
    });
  } catch (err) {
    // Only reachable by a logged-in admin, so show the real reason instead of the generic error page.
    console.error('[backup] page failed:', err);
    res.status(500).send(`Backups page failed: ${err.message}`);
  }
}

async function createCloud(req, res) {
  try {
    const result = await backup.createCloudBackup();
    req.flash('success', `Backup saved to the cloud (${result.tables.length} tables, ${Math.round(result.size / 1024)} KB).`);
  } catch (err) {
    console.error('[backup] manual backup failed:', err);
    req.flash('error', `Backup failed: ${err.message}`);
  }
  res.redirect('/admin/backups');
}

async function download(req, res) {
  try {
    const { name, bytes } = await backup.createDownload();
    res.set({
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Content-Length': bytes.length,
      'Cache-Control': 'no-store',
    });
    res.send(bytes);
  } catch (err) {
    console.error('[backup] download failed:', err);
    req.flash('error', `Backup failed: ${err.message}`);
    res.redirect('/admin/backups');
  }
}

module.exports = { show, createCloud, download };
