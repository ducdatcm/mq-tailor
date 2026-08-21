# Deploying to Hostinger

Hostinger has two different ways of hosting a Node.js app, and which one
you get depends on your account. **This project is set up for both**, but
the steps differ. Check which one you have before following a section.

- **Method A — "Deploy Web App" (Git-connected)**: hPanel → Websites →
  Add Website → **Deploy Web App** → **Import Git Repository**. This is a
  newer, Vercel/Netlify-style flow: it builds straight from GitHub, has no
  reliable `npm`-on-PATH shell access, and manages environment variables
  through its own UI. **This is what worked for minhquanghanoi.com** — use
  this section if that's what you see.
- **Method B — classic "Node.js App"**: hPanel → Advanced → Node.js →
  Create Application, with SSH access and a `nodevenv` you `source` to get
  `npm`. Kept below as an appendix in case a different Hostinger account
  offers this instead.

Because Method A often has no usable `npm` shell, the app **migrates its
own database schema and loads its starter content automatically on
every boot** (see `src/config/bootstrap.js`) — you don't run
`npm run migrate` / `npm run seed` by hand at all in Method A. It's safe:
migrations only ever apply forward, and the content seed is guarded to run
once, ever, so it can never overwrite anything you've since edited from
`/admin`.

---

## Method A — Deploy Web App / Import Git Repository

### 1. Create the MySQL database
hPanel → **Databases → Management** (not "Remote MySQL" — that's a
different thing) → **Create a New MySQL Database And Database User**.
Note down the full database name, username, password, and host (usually
`localhost`).

### 2. Set up photo storage (Cloudflare R2)
This host gives every deploy a brand-new, disposable folder, so anything
saved to local disk (uploaded photos) is lost on the next deploy. Uploaded
media is stored in [Cloudflare R2](https://developers.cloudflare.com/r2/)
instead — free at this scale, and persists independently of the app.

1. dash.cloudflare.com → **Storage & Databases → R2 Object Storage** →
   **Create Bucket**.
2. Open the bucket → **Settings** → **Public Development URL** → **Enable**.
   Copy that URL (`https://pub-xxxxxxxxxxxx.r2.dev`).
3. Back on the R2 overview page → **Manage API Tokens** → **Create Account
   API Token** → permission **Object Read & Write** → Create. Copy the
   **Access Key ID**, **Secret Access Key**, and **Account ID** shown —
   this is the only time the secret is displayed.

### 3. Create the website
hPanel → **Websites → Add Website → Deploy Web App → Import Git
Repository**. Connect/authorize GitHub, pick the `mq-tailor` repo, branch
`main`. On the settings screen:
- Framework preset: **Express** if offered, else **Other**
- **Node.js version: 20 or 22** (not 18 — `sharp` requires ≥20 and will
  crash the app on boot if it's set to 18)
- **Build command: `npm run build`**
- **Entry file: `app.js`**
- Output directory: leave blank

### 4. Environment variables
In the app's dashboard, find **Environment Variables** and add each of
these as a Key/Value pair (there's no `.env` file to edit by hand here):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `BASE_URL` | your site's URL, e.g. `https://minhquanghanoi.com` |
| `DB_HOST` | `127.0.0.1` (not `localhost` — see Troubleshooting) |
| `DB_PORT` | `3306` |
| `DB_USER` | from step 1 |
| `DB_PASSWORD` | from step 1 |
| `DB_NAME` | from step 1 |
| `R2_ACCOUNT_ID` | from step 2 |
| `R2_ACCESS_KEY_ID` | from step 2 |
| `R2_SECRET_ACCESS_KEY` | from step 2 |
| `R2_BUCKET_NAME` | the bucket name you chose in step 2 |
| `R2_PUBLIC_URL` | the `https://pub-xxxxxxxxxxxx.r2.dev` URL from step 2 |
| `SESSION_SECRET` | any long random string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_SEED_USERNAME` | the username you want to log into `/admin` with |
| `ADMIN_SEED_PASSWORD` | the password for that account — this becomes your real login |
| `ENQUIRY_NOTIFY_TO` | `minhquanghotline@gmail.com` |

`SMTP_*` and `GA_MEASUREMENT_ID` are optional — see §6/§7 below.

### 6. Redeploy
Save the environment variables, then trigger a fresh deploy (pushing to
GitHub `main` auto-deploys; there's also a Redeploy button, though note it
can re-run an **old** commit rather than pulling latest — check the
"Commit" hash shown on the deployment matches your latest push).

On this boot, the app will automatically: create all database tables,
load the starter bilingual content, and create your admin login. Watch the
runtime logs for lines starting with `[bootstrap]` to confirm.

### 7. Verify
Visit your site — `/en/` should load with full content, and
`/admin/login` should accept the `ADMIN_SEED_USERNAME` /
`ADMIN_SEED_PASSWORD` you set. Once confirmed, you can remove those two
environment variables (optional tidiness — leaving them is harmless since
the app won't recreate/reset the account once it exists).

### Finding a terminal, if you ever need one
hPanel → **Advanced → SSH Access** → **Enable**, set a password, then
`ssh <username>@<ip> -p <port>` from PowerShell/Terminal. Useful for
poking around files, but note **this shell usually has no `npm`/`node` on
its PATH** in Method A — the actual app runs in a separate build
container. That's exactly why the self-migrating bootstrap exists.

---

## Method B — classic "Node.js App" (Advanced → Node.js)

Use this appendix only if your hPanel actually shows **Advanced → Node.js**
with a "Create Application" button (it didn't for this project's account).

### 1. Create the MySQL database
Same as Method A, step 1.

### 2. Create the Node.js App
hPanel → **Advanced → Node.js → Create Application**.
- Node.js version: 20+ (not 18)
- Application root: the folder to deploy into
- Application URL: your domain
- Application startup file: `app.js`

### 3. Get the code onto the server
```bash
cd ~/domains/your-domain.com/mqtailor   # the app root hPanel created
git clone https://github.com/ducdatcm/mq-tailor.git .
```

### 4. Configure `.env`
```bash
cp .env.example .env
nano .env
```
Fill in the same values as the table in Method A §3, but as `KEY=value`
lines in this file instead of a UI. **Never commit `.env`.**

### 5. Install dependencies
Use the "Run NPM Install" button in hPanel, or via SSH:
```bash
source /home/USERNAME/nodevenv/PATH_TO_APP/20/bin/activate   # hPanel shows the exact path
npm install --omit=dev
```

### 6. Build assets
```bash
npm run build
```

### 7. Start the app
Because the bootstrap step in `app.js` runs on every boot regardless of
hosting method, simply starting the app (via the hPanel Restart button, or
`touch tmp/restart.txt`) also creates the tables, loads starter content,
and creates the admin account — no manual `npm run migrate`/`seed`
required here either, though you can still run them by hand if you'd
rather:
```bash
npm run migrate
npm run seed
npm run seed:admin
```

---

## 6. (Optional) Enquiry email notifications

The "Visit" page's enquiry form always saves to the database — you'll
always see submissions in **Admin → Enquiries** with or without this. To
also get an email:

1. Use a Gmail account (or any SMTP provider) and create an
   [App Password](https://myaccount.google.com/apppasswords) if using Gmail.
2. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`,
   `SMTP_PASSWORD` (the app password), `SMTP_FROM`, and
   `ENQUIRY_NOTIFY_TO=minhquanghotline@gmail.com`.
3. Redeploy/restart.

## 7. (Optional) Analytics

Set `GA_MEASUREMENT_ID` to your Google Analytics 4 Measurement ID
(`G-XXXXXXX`) and redeploy/restart. Leave blank to disable analytics
entirely.

## Ongoing updates

Push to `https://github.com/ducdatcm/mq-tailor` `main` — Method A
auto-deploys and self-migrates on every boot. Method B needs a manual
`git pull` + restart (see §7 there). Either way, day-to-day content
changes (journal posts, photos, hours, team, cloth mills, page copy) never
need a redeploy — they're all done live through **`/admin`**.

## Troubleshooting

- **503 "Service Unavailable"** with Hostinger's own generic page
  (`Server: hcdn` in the response headers): the app process itself never
  started — check the build/runtime logs, most commonly a wrong Node
  version or a missing dependency.
- **500 "Something went wrong"** (our own app's error page): the app is
  running, something inside it failed — almost always the database isn't
  reachable yet or hasn't been created. Check the environment variables.
- **Build fails with "Cannot find module 'X'"**: a package needed by
  `npm run build` or `app.js` at startup got classified as a
  `devDependency` and skipped by a production-only install. Move it to
  regular `dependencies` in `package.json`.
- **Styles look unminified/unstyled**: confirm `NODE_ENV=production` is
  set and the build command (`npm run build`) actually ran in the deploy
  log.
- **"Access denied for user '...'@'::1'" in the logs**: `DB_HOST=localhost`
  resolved to the IPv6 loopback address, which the MySQL user's grants
  don't cover. Set `DB_HOST=127.0.0.1` instead.
- **Uploaded photos show as broken images after a later deploy**: this
  host gives every deploy a fresh, disposable folder — anything saved to
  local disk is gone on the next deploy. Uploaded media must go through
  Cloudflare R2 (§2/§4 above); if `R2_*` environment variables are
  missing, uploads will fail outright rather than silently falling back to
  disk (check Runtime Logs for the exact message).
