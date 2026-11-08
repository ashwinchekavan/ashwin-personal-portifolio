# Hosting on Hostinger (Cloud Startup, Node.js web app + MySQL)

The site is a Node.js app (Astro in server mode) with a MySQL database. Hostinger builds it
from the GitHub repository and runs it; you never upload files by hand.

## Where everything lives

Hostinger **replaces the app folder on every deployment**, so nothing you want to keep may live
in it. This is how the project is set up:

| What | Where | Lost on redeploy? |
| --- | --- | --- |
| Code | Rebuilt from GitHub into `~/domains/<domain>/hbuilds/` | Replaced each time (by design) |
| Blog posts | MySQL database | No |
| Uploaded images | `~/domains/<domain>/uploads/` (set by `UPLOAD_DIR`) | No — outside the folders Hostinger manages |
| Passwords and settings | Environment variables in hPanel | No |

Throughout, replace `example.com` with your domain.

---

## 1. Before you start (on your computer)

In the project folder:

```sh
npm run hash-password     # type the admin password you want; copy the printed ADMIN_PASSWORD_HASH=... line
openssl rand -hex 32      # copy the output; this is SESSION_SECRET
```

Make sure the latest code is pushed to GitHub (`git push`).

## 2. Create the MySQL database

1. hPanel → **Websites** → your site's **Dashboard** → **Databases** → **Management**
   (called **MySQL Databases** in some accounts).
2. Enter a database name, a username and a strong password, then **Create**.
3. Write down the three values exactly as hPanel shows them. Hostinger adds a prefix, so they
   look like `u123456789_portfolio` (database) and `u123456789_admin` (user).

You do not create any tables: the app creates them the first time it runs.

## 3. Find your account folder name

Uploaded images are stored in a folder on the server, and you need its full path.

1. hPanel → your site → **Files** → **File Manager**.
2. The path shown at the top looks like `/home/u123456789/domains/example.com/public_html`.
3. Your uploads path is that path with `public_html` replaced by `uploads`:

   ```
   /home/u123456789/domains/example.com/uploads
   ```

You do not need to create the folder; the app creates it on the first upload. It sits next to
`public_html` and `hbuilds`, which are the only two folders a deployment overwrites.

## 4. Deploy the site

1. hPanel → **Websites** → **Add website** → **Node.js web app**.
2. Choose **Import Git repository** → **Connect with GitHub**, allow access to the
   `ashwin-personal-portifolio` repository, and select it with branch `main`.
3. Choose your domain (`example.com`).
4. Check the build settings:

   | Setting | Value |
   | --- | --- |
   | Framework / application type | Astro |
   | Node.js version | 22 |
   | Package manager | npm |
   | Build command / build script | `npm run build` (script `build`) |
   | Output directory | `dist` |
   | Entry file | `dist/server/entry.mjs` |

   If your screen asks for a **start command** instead of an entry file, use `npm run start`.

5. Add the **environment variables** (same screen, or later under **Environment variables** in
   the site's sidebar). You can paste them all at once with the "import from .env" option:

   ```ini
   SITE_URL=https://example.com
   ADMIN_HOST=admin.example.com
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=u123456789_portfolio
   DB_USER=u123456789_admin
   DB_PASSWORD=your-database-password
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=scrypt:...          # the line from step 1, without "ADMIN_PASSWORD_HASH="
   SESSION_SECRET=...                      # the openssl output from step 1
   UPLOAD_DIR=/home/u123456789/domains/example.com/uploads
   GA_MEASUREMENT_ID=G-XXXXXXXXXX          # optional: Google Analytics, from Admin → Data streams
   CLARITY_PROJECT_ID=abcd1234ef           # optional: Microsoft Clarity, from Settings → Overview
   ```

   - `GA_MEASUREMENT_ID` and `CLARITY_PROJECT_ID` are optional. Leave them out and no tracking
     code is added. They are read at runtime, so after adding them just restart the app.
   - Visitors on `www.example.com` are sent to the `SITE_URL` address with a 301, so point both
     the bare domain and `www` at this app.
   - `DB_HOST` must be `127.0.0.1`, **not** `localhost`. Hostinger's own docs note that Node.js
     apps cannot connect with `localhost`.
   - Do not add `PORT`; Hostinger provides it.

6. Press **Deploy** and wait for the build to finish (a few minutes).

Open `https://example.com`. The site should load, with an empty Writing section.

## 5. The admin subdomain

The admin area only answers on the host name in `ADMIN_HOST`. On Hostinger a subdomain is its
own website, so the admin subdomain runs the same app a second time:

1. hPanel → **Websites** → **Add website** → **Node.js web app**.
2. Same GitHub repository and branch, but choose the domain **`admin.example.com`**
   (create the subdomain when asked; if your domain's DNS is not at Hostinger, add an `A` record
   for `admin` pointing to the same IP as the main site).
3. Same build settings as step 4.
4. **Exactly the same environment variables** as the main site, including the same
   `SESSION_SECRET` and the same `UPLOAD_DIR` (the path under `example.com`, not under
   `admin.example.com`). Both apps then share one database and one image folder.
5. Deploy.

Open `https://admin.example.com`: you get the sign-in page.

> **If your account cannot run a second Node.js app on the subdomain:** clear `ADMIN_HOST`
> (leave it empty) on the main site and redeploy. The admin is then at
> `https://example.com/admin/`. It is still protected by the password; it is just not on a
> separate host name.

## 6. HTTPS

hPanel → your site → **Security → SSL**: make sure the free SSL certificate is active for both
`example.com` and `admin.example.com`, and that **Force HTTPS** is on. Sign-in cookies are only
sent over HTTPS.

## 7. Check it

- `https://example.com` shows the site.
- `https://example.com/admin/` shows "Not found".
- `https://admin.example.com` shows the sign-in page. Sign in, write a post, add a cover image,
  press **Publish**: it appears at `https://example.com/writing/`.
- In File Manager, `domains/example.com/uploads/` now contains a `.webp` file.
- Press **Redeploy** on the main site. Afterwards the post and its image are still there.

---

## Updating the site

Push to GitHub. Hostinger redeploys the connected apps; if a site does not update by itself,
open its **Deployments** page and press **Redeploy**. Remember there are two apps (main and
admin) and both need the new version.

Posts, images and settings are untouched by a deployment.

## Changing the admin password

Run `npm run hash-password` on your computer, replace `ADMIN_PASSWORD_HASH` under
**Environment variables** on **both** sites, and redeploy/restart them. Changing
`SESSION_SECRET` signs the admin out everywhere.

## Backups

- **Posts:** hPanel → Databases → **phpMyAdmin** → select the database → **Export** → Quick →
  SQL. Keep the downloaded `.sql` file.
- **Images:** File Manager → `domains/example.com/` → select the `uploads` folder → **Download**.
- Hostinger's own **Backups** section (Files → Backups) keeps automatic copies of files and
  databases; check that it lists both.

To restore: phpMyAdmin → **Import** the `.sql` file; upload the `uploads` folder back with File
Manager.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| Build fails | **Deployments** → open the failed build log. Check Node.js version is 22 and the build command is `npm run build`. |
| Build succeeds but the site does not respond | Open **Runtime logs**. Check the entry file is `dist/server/entry.mjs`. If the log shows the server listening but the site still times out, add the environment variable `HOST=0.0.0.0`, then `HOST=127.0.0.1` if that does not help. |
| Site loads but posts never appear / runtime log shows `ECONNREFUSED` or `Access denied` | Database settings. `DB_HOST` must be `127.0.0.1`; `DB_NAME`, `DB_USER`, `DB_PASSWORD` must match hPanel exactly, including the `u123456789_` prefix. |
| "The admin account is not set up yet" | `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` or `SESSION_SECRET` is missing on that site. |
| Admin subdomain shows "Not found" on every page | `ADMIN_HOST` on the admin app does not match the address in the browser exactly. |
| "Forbidden" when signing in | The page was opened on a different address than `ADMIN_HOST`, or over `http://`. Use `https://admin.example.com`. |
| Signed in, but an image uploaded on the admin does not show on the site | The two apps have different `UPLOAD_DIR` values. Both must use the path under `example.com`. |
| Image upload fails | Runtime log. Check `UPLOAD_DIR` starts with your real `/home/u.../` path. |
| "Too many attempts" | Five wrong passwords. Wait 15 minutes or restart the app. |
