# Digital Library — School Library Management System

A React + Firebase Realtime Database app for managing a school's digital
learning resources and physical library catalog, with role-based access for
Students, Teachers, Librarians/Admins, and a platform-level Super Admin.

🔒 **See [`SECURITY.md`](./SECURITY.md)** for a full write-up of the app's security
model — XSS, clickjacking, injection-equivalent risks in Realtime Database rules,
and what's a genuine fix vs. a best-effort mitigation given GitHub Pages hosting.

## New in this update

- **Ratings & reviews** — students can rate and review both books and resources (`BookDetail` / `ResourceDetail`).
- **Book holds / waitlist** — when every copy of a physical book is checked out, students can join a waitlist and see their place in line (`My Holds`).
- **Resource analytics** — view and download counts on every teacher upload, shown in `My Resources` and aggregated on the Teacher dashboard.
- **Resource editing** — teachers can edit an uploaded resource's metadata without needing re-approval (status is untouched by an edit).
- **Platform announcements** — super admin can broadcast a notice to every school's dashboard, in addition to a librarian's per-school announcements.
- **Audit log** — school creation, admin assignment, role/status changes, resource approvals, and book archiving are all recorded for the super admin to review.
- **Global category templates** — super admin curates a shared list of subject categories; librarians can import any of them into their own catalog in one click.

⚠️ **If you deployed `database.rules.json` before this update, redeploy it again** — it's had two rounds
of changes since: the `globalCategories` node was added, and a full security-hardening pass tightened
validation on `availableCopies`, resource view/download counters, review/hold author names, borrow record
creation, and user email/name fields. See [`SECURITY.md`](./SECURITY.md) for the reasoning behind each one.

## Tech stack

- **React 18 + Vite** — UI and build tooling
- **React Router (Hash routing)** — client-side routing that works on static
  GitHub Pages hosting with no server rewrite rules
- **Firebase Auth** — email/password + Google sign-in
- **Firebase Realtime Database (RTDB)** — all app data, real-time synced
- **Cloudinary** — book covers, PDFs, notes, presentations (unsigned upload
  preset)
- **Tailwind CSS** — styling
- **html5-qrcode / qrcode.react** — barcode/QR scanning and label generation
  for physical book circulation

## Project structure

```
src/
  firebase.js              Firebase app/auth/db initialization
  cloudinary.js             Cloudinary upload + thumbnail helpers
  App.jsx / main.jsx         Routes and app entry point
  index.css                  Tailwind + design-system utility classes
  contexts/AuthContext.jsx   Auth state, profile, register/login/logout
  routes/ProtectedRoute.jsx  Role-gated route wrapper
  hooks/useCollection.js     Realtime RTDB list/doc subscriptions
  utils/
    roles.js                 Role constants, permission table
    dateUtils.js              Due-date / overdue formatting helpers
    search.js                 Client-side catalog search & filtering
    library.js                 Borrow/return/approve/etc. write operations
  components/
    AppShell.jsx               Sidebar layout + nav per role
    AnnouncementBanner.jsx      Shows latest announcements on dashboards
    BookCard.jsx / BookQRLabel.jsx / QRScanner.jsx
  pages/
    Login.jsx, Register.jsx, BookDetail.jsx, ResourceDetail.jsx
    student/    Dashboard, Browse & Search, Bookmarks, Reading History,
                My Borrowing, My Holds
    teacher/    Dashboard, Upload Resource, Manage Resources (with
                analytics + inline edit)
    librarian/  Dashboard, Manage Books, Categories (with platform-template
                import), Approve Resources, Manage Accounts, Circulation &
                Scan, Overdue Tracking, Reports, Announcements
    superadmin/ Dashboard, Manage Schools, Assign Admins, Platform Reports,
                Platform Announcements, Audit Log, Global Category Templates
database.rules.json   Firebase Realtime Database security rules
```

## 1. Firebase setup

1. In the [Firebase Console](https://console.firebase.google.com/), open your
   project (`dig-library-2f6f0`, already wired into `src/firebase.js`).
2. **Authentication** → Sign-in method → enable **Email/Password** and
   **Google**.
3. **Realtime Database** → create a database if you haven't already, then
   copy the URL shown at the top of the data viewer into
   `src/firebase.js` → `databaseURL`. It depends on the region you picked,
   e.g.:
   - `https://dig-library-2f6f0-default-rtdb.firebaseio.com` (US)
   - `https://dig-library-2f6f0-default-rtdb.asia-southeast1.firebasedatabase.app` (Singapore)
4. Deploy the security rules in `database.rules.json` — either paste them
   into the Realtime Database → Rules tab in the console, or with the
   Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only database
   ```
   (add a minimal `firebase.json` pointing `database.rules` at
   `database.rules.json` if you use the CLI route).
5. **Create your first Super Admin.** Registration in the app only offers
   Student/Teacher (by design — librarian and super admin access is granted,
   not self-served). To bootstrap the very first admin:
   - Register a normal account in the app.
   - In the Realtime Database console, find that user under `users/{uid}`
     and manually change `role` to `superadmin`.
   - Sign back in — you'll land on the Super Admin dashboard, where you can
     add schools and promote other accounts to librarian from then on.

## 2. Cloudinary setup

Already wired into `src/cloudinary.js`:
- Cloud name: `damr6r9op`
- Unsigned upload preset: `org-resources`

Make sure that preset exists under Cloudinary → Settings → Upload → Upload
presets, and is set to **Unsigned**. PDFs/docs upload as `raw` resource type;
images upload as `image` (and get an on-the-fly thumbnail transform for
cover art).

## 3. Local development

```bash
npm install
npm run dev
```

## 4. Deploy to GitHub Pages

This repo includes `.github/workflows/deploy.yml`, which builds and deploys
automatically on every push to `main`.

1. Push this project to a GitHub repository.
2. In the repo, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).
   Your site will be published at `https://<username>.github.io/<repo>/`.

The app uses relative asset paths (`vite.config.js` → `base: './'`) and
`HashRouter` (URLs like `/#/student`), so it works correctly as a static
site without any server-side URL rewriting — no repo-name configuration
needed.

If you'd rather deploy manually instead of via Actions:
```bash
npm run build
# then push the contents of ./dist to a `gh-pages` branch, or upload it
# wherever you're hosting the static files.
```

## Data model (Realtime Database)

```
users/{uid}            { name, email, role, status, schoolId?, createdAt }
schools/{schoolId}     { name, address, createdAt }
categories/{id}        { name, createdAt }
books/{id}             { title, author, isbn, subject, categoryId, type,
                          totalCopies, availableCopies, coverUrl, fileUrl,
                          description, archived, createdAt }
resources/{id}         { title, subject, categoryId, materialType,
                          description, fileUrl, fileFormat, uploaderUid,
                          uploaderName, status: pending|approved|rejected,
                          views?, downloads?, createdAt }
borrowRecords/{id}     { bookId, bookTitle, userId, borrowedAt, dueAt,
                          returnedAt }
bookmarks/{uid}/{id}   { createdAt }   — id is a bookId, or "res-<resourceId>"
readingHistory/{uid}/{id} { title, lastReadAt, isResource? }
reviews/{itemId}/{uid} { rating, userName, comment, createdAt } — itemId is a
                          bookId, or "res-<resourceId>"
holds/{holdId}         { uid, userName, bookId, bookTitle, status, createdAt }
globalCategories/{id}  { name, createdAt } — super admin category templates
auditLog/{id}          { action, actorUid, actorName, details, createdAt }
announcements/{id}     { title, body, scope?: "platform", createdAt }
```

## Roles

| Role | Can do |
|---|---|
| Student | search/browse, read online, download, bookmark, borrow, view own history |
| Teacher | upload/manage own resources, everything a student can do for browsing |
| Librarian / Admin | manage books & categories, approve resources, manage accounts, circulation & scanning, overdue tracking, reports, announcements |
| Super Admin | manage schools, promote accounts to librarian/admin, platform-wide reports |
