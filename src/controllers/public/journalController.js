const db = require('../../config/db');
const { getMediaByIds, resolveMedia } = require('../../utils/media');

const PAGE_SIZE = 9;

async function list(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const category = ['craft', 'cloth', 'house-stories', 'hanoi', 'wardrobe'].includes(req.query.category)
      ? req.query.category
      : null;

    const base = db('journal_posts').where({ status: 'published' });
    if (category) base.andWhere({ category });

    const totalRow = await base.clone().count({ count: '*' }).first();
    const total = Number(totalRow.count) || 0;

    const posts = await base
      .clone()
      .orderBy('published_at', 'desc')
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    const mediaMap = await getMediaByIds(posts.map((p) => p.cover_media_id));
    posts.forEach((p) => {
      p.cover = resolveMedia(mediaMap[p.cover_media_id], res.locals.lang);
    });

    res.render('pages/journal-list', {
      title: res.locals.t('journal.heading'),
      metaDescription: '',
      posts,
      category,
      page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const post = await db('journal_posts')
      .where({ slug: req.params.slug, status: 'published' })
      .first();

    if (!post) {
      return res.status(404).render('pages/404', {
        title: res.locals.t('not_found.heading'),
        metaDescription: '',
      });
    }

    const galleryRows = await db('journal_post_media')
      .where({ journal_post_id: post.id })
      .orderBy('sort_order', 'asc');

    const mediaMap = await getMediaByIds([post.cover_media_id, ...galleryRows.map((r) => r.media_id)]);
    post.cover = resolveMedia(mediaMap[post.cover_media_id], res.locals.lang);
    post.gallery = galleryRows.map((r) => resolveMedia(mediaMap[r.media_id], res.locals.lang)).filter(Boolean);

    const related = await db('journal_posts')
      .where({ status: 'published', category: post.category })
      .andWhereNot({ id: post.id })
      .orderBy('published_at', 'desc')
      .limit(3);
    const relatedMediaMap = await getMediaByIds(related.map((p) => p.cover_media_id));
    related.forEach((p) => {
      p.cover = resolveMedia(relatedMediaMap[p.cover_media_id], res.locals.lang);
    });

    const lang = res.locals.lang;
    res.render('pages/journal-detail', {
      title: post[`title_${lang}`],
      metaDescription: post[`excerpt_${lang}`],
      post,
      related,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail };
