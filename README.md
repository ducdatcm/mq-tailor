# Minh Quang Tailoring House — Website

The official bilingual (EN/VI) website for Minh Quang, a family tailoring
house at 175 Phùng Hưng, Hoàn Kiếm, Hanoi. An editorial "digital home" —
not an e-commerce catalogue — built as a plain Node.js/Express site with a
small custom admin panel so the house can update everything itself.

## Stack

- **Node.js + Express** (server-rendered EJS, no frontend framework/bundler)
- **MySQL** via [Knex](https://knexjs.org) for the database + migrations
- **Custom admin panel** at `/admin` (session auth, single account) — no
  third-party CMS
- Hand-authored CSS design tokens (`public/css/style.css`) — no CSS framework
- [`sharp`](https://sharp.pixelplumbing.com) generates responsive WebP
  images on upload

See [`DEPLOY.md`](DEPLOY.md) for Hostinger deployment steps.

## Local development

Requires Node 18+ and a MySQL server (local install, or Docker: `docker run
-d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=mq_tailor
mysql:8`).

```bash
npm install
cp .env.example .env      # fill in DB_*, SESSION_SECRET, ADMIN_SEED_*
npm run migrate
npm run seed
npm run seed:admin        # then remove ADMIN_SEED_* from .env
npm run dev                # http://localhost:3000 -> redirects to /en/
```

Admin panel: `http://localhost:3000/admin/login`.

## Project structure

```
app.js                  Express entry point (Passenger startup file on Hostinger)
db/migrations, db/seeds Knex schema + starter bilingual content
src/config/              db, i18n, image-upload pipeline
src/middleware/          locale (/:lang), site settings cache, admin auth guard
src/controllers/public/  one per public page
src/controllers/admin/   one per admin CRUD area
src/routes/               public + admin routers, sitemap/robots
src/views/                EJS templates (layouts, partials, pages, admin/*)
src/locales/en.json, vi.json   UI string dictionaries
public/css, public/js    hand-authored styles/scripts (+ .min.* built for prod)
public/uploads/           admin-uploaded media (not tracked in git)
scripts/                  seed-admin.js, build-assets.js
```

## Content model

Everything editorial lives in the database and is edited from `/admin` —
nothing requires touching code:

| What | Where in Admin |
|---|---|
| Journal articles | Journal |
| Team / workshop roles | People |
| Cloth mills list | Cloth Mills *(deliberately empty at launch — see below)* |
| Photos (house, workshop, people, garments, fitting, Hanoi) | Media Library |
| Homepage / The House / Tailoring / Our People / Cloth / Visit copy | Page Copy |
| The 8 process steps | The Process |
| Address, hours, phone, Zalo, Instagram, email, logo, GA id | Site Settings |
| Enquiry form submissions | Enquiries |

Bilingual fields are edited together on one form (English + Vietnamese side
by side) — the site serves `/en/...` and `/vi/...` from the same records.

**Cloth Mills starts empty on purpose.** The brief lists mills like Scabal
or Vitale Barberis Canonico only as *examples* of the kind of houses a
tailor might work with, not as Minh Quang's confirmed suppliers — publishing
specific mill names without a real sourcing relationship would be a false
claim. Add the mills you actually buy from via Admin → Cloth Mills.

**Photography is partial at launch.** Anywhere a photo hasn't been uploaded
yet, the site shows an honest "Photography pending" placeholder panel
instead of stock or AI imagery — upload real photos via Admin → Media
Library and attach them to the relevant page/post/person to replace each
placeholder.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm start` | Start normally (what Passenger runs in production) |
| `npm run migrate` / `migrate:rollback` | Apply / undo DB schema migrations |
| `npm run seed` | (Re)load starter content — **overwrites** existing rows in seeded tables, only meant for first setup |
| `npm run seed:admin` | Create/reset the admin login from `.env` |
| `npm run build` | Minify `public/css/style.css` and `public/js/main.js` for production |
