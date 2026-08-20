# Deploying to Hostinger (Business hosting, Node.js App)

This site is a plain Node.js/Express app with a MySQL database — no build
tools beyond a small asset-minify step. Hostinger's **Node.js App** feature
(hPanel → Advanced → Node.js) runs it for you via Passenger.

## 1. One-time hPanel setup

### 1a. Create the MySQL database
hPanel → **Databases → MySQL Databases**
1. Create a database (e.g. `u123_mqtailor`) and a database user with a strong
   password, and attach the user to the database with **all privileges**.
2. Note the DB host (usually `localhost`), database name, username, password.

### 1b. Create the Node.js App
hPanel → **Advanced → Node.js**
1. Click **Create Application**.
2. Node.js version: pick the latest available **LTS** (18.x or 20.x+).
3. Application root: the folder you'll deploy the code into (e.g.
   `mqtailor.com`, or a subfolder).
4. Application URL: your domain (e.g. `https://minhquangtailor.com`).
5. Application startup file: **`app.js`**.
6. Save. Hostinger will show you an SSH command / path to the app's virtual
   environment and a **"Run NPM Install"** button — you'll use both below.

### 1c. Point your domain
If the domain isn't already pointed at this Hostinger account, do that in
hPanel → **Domains** first. SSL (Let's Encrypt) can be issued for free from
hPanel → **SSL**once the domain resolves.

## 2. Get the code onto the server

From the Node.js App page, open **SSH access** (hPanel gives you a command
like `ssh u123456@your-server.hostinger.com`). Then, inside the application
root folder:

```bash
cd ~/domains/your-domain.com/mqtailor   # the app root hPanel created
git clone https://github.com/ducdatcm/mq-tailor.git .
```

(If the folder already has hPanel's placeholder files, delete them first, or
clone into a temp folder and move the contents in.)

## 3. Configure environment variables

```bash
cp .env.example .env
nano .env   # or use hPanel's File Manager to edit it
```

Fill in:
- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` — from step 1a
- `SESSION_SECRET` — generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `BASE_URL` — your live domain, e.g. `https://minhquangtailor.com`
- `NODE_ENV=production`
- `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD` — a temporary admin login,
  used once in step 5 then removed
- `SMTP_*` / `ENQUIRY_NOTIFY_TO` — optional, only if you want enquiry emails
  relayed (see §6)
- `GA_MEASUREMENT_ID` — optional, only if you want Google Analytics

**Never commit `.env`** — it's already git-ignored.

## 4. Install dependencies

Use the "Run NPM Install" button on the Node.js App page in hPanel (it runs
`npm install` inside the app's managed Node environment), **or** via SSH:

```bash
source /home/USERNAME/nodevenv/PATH_TO_APP/20/bin/activate   # hPanel shows the exact path
npm install --omit=dev
```

This also downloads the correct prebuilt `sharp` binary for the server's
Linux environment automatically — no compiler needed.

## 5. Set up the database and the admin account

Still with the Node virtual environment activated:

```bash
npm run migrate       # creates all tables
npm run seed          # loads starter bilingual content, settings, journal posts
npm run seed:admin    # creates the admin login from ADMIN_SEED_* in .env
```

Then **edit `.env` again and remove the `ADMIN_SEED_USERNAME` /
`ADMIN_SEED_PASSWORD` lines** — they're only needed for that one command.

## 6. (Optional) Enquiry email notifications

The "Visit" page's enquiry form always saves to the database — you'll always
see submissions in **Admin → Enquiries** even without this step. To also get
an email:

1. Use a Gmail account (or any SMTP provider) and create an
   [App Password](https://myaccount.google.com/apppasswords) if using Gmail.
2. Fill in `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`,
   `SMTP_PASSWORD` (the app password), `SMTP_FROM`, and
   `ENQUIRY_NOTIFY_TO=minhquanghotline@gmail.com` in `.env`.
3. Restart the app (step 8).

## 7. Build and minify assets

```bash
npm run build
```

Regenerates `public/css/style.min.css` and `public/js/main.min.js`, which
`NODE_ENV=production` templates use automatically. Re-run this any time you
hand-edit `public/css/style.css` or `public/js/main.js`.

## 8. Start / restart the app

Use the **Restart** button on the hPanel Node.js App page. (Passenger also
restarts automatically if you `touch tmp/restart.txt` in the app root via
SSH.)

Visit your domain — you should land on `/en/` with full content, and
`/admin/login` should let you log in with the account from step 5.

## 9. Ongoing updates

Whenever you (or Claude) push new code to
`https://github.com/ducdatcm/mq-tailor`:

```bash
cd ~/domains/your-domain.com/mqtailor
git pull
npm install --omit=dev     # only if package.json changed
npm run migrate            # only if new migrations were added
npm run build               # if CSS/JS changed
touch tmp/restart.txt       # or use the hPanel Restart button
```

Day-to-day content changes (journal posts, photos, hours, team, cloth mills,
page copy) don't need any of this — they're all done live through
**`/admin`**, no redeploy required.

## Troubleshooting

- **502 / app won't start**: check the Node.js App's log viewer in hPanel,
  or `tail -f ~/domains/.../mqtailor/logs/*.log` if present. Almost always a
  missing/incorrect `.env` value.
- **Images fail to upload**: confirm the app's `public/uploads/` folder is
  writable by the app user (it is by default under the app root).
- **Styles look unminified/unstyled after deploy**: run `npm run build` and
  confirm `NODE_ENV=production` is set in `.env`.
