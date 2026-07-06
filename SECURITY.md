# Security

This document covers the security posture of the app: what's protected against, how, and — just as
important — what *isn't* fully solvable given this app is static files on GitHub Pages talking to
Firebase, and what to do about that if it matters for your deployment.

The short version: **the real security boundary here is `database.rules.json`**, not the React code.
Anyone can view-source this app, read every line of client JS, and call the Firebase SDK directly with
their own crafted requests — the client code enforcing "you can only do X" is a UX convenience, not a
security control. Every write in this app is re-checked against the rules file server-side regardless of
what the client tries to send. That's why most of the hardening below lives in the rules file.

## Clickjacking

**The problem:** an attacker embeds this app in an invisible/transparent `<iframe>` on their own site,
overlays fake UI, and tricks a logged-in user into clicking real buttons in the real app (e.g. "approve
resource", "assign admin") while believing they're clicking something harmless.

**The right fix** is an HTTP response header — `X-Frame-Options: DENY` or
`Content-Security-Policy: frame-ancestors 'none'`. **GitHub Pages cannot send custom HTTP headers at
all** — there's no server config to hook into on a purely static host. Both of those directives are
explicitly ignored by every browser when set via a `<meta>` tag instead of a header (this is in the spec,
not a bug), so there's no HTML-only way to get the "real" protection.

What this app does instead, as a fallback:
- `index.html` starts the page hidden (`html { display: none }`).
- `public/anti-clickjack.js` runs immediately and checks `window.top === window.self`. If the page is the
  top-level document, it un-hides normally. If it detects it's inside a frame, it redirects the *entire
  browser window* to the real page instead of rendering — so there's never a moment where the real UI is
  interactively framable.

This is a real, working mitigation, but it's JS-based, so it can theoretically be defeated by an attacker
who prevents the busting script from running (e.g. via the deprecated/non-standard
`sandbox="allow-scripts"` *without* `allow-same-origin` in a way that breaks `window.top` access in some
older engines, or simply by intercepting the request in unusual ways). **If you deploy this somewhere that
supports custom headers** (Cloudflare Pages, Netlify, Vercel, your own nginx, etc.), add a real header —
it's strictly stronger. A ready-to-use example for Netlify/Cloudflare Pages:

```
# _headers file (Netlify / Cloudflare Pages)
/*
  X-Frame-Options: DENY
  Content-Security-Policy: frame-ancestors 'none'
```

## Cross-site scripting (XSS)

- **React escapes all text content by default.** Every place user-generated content is rendered
  (reviews, comments, announcements, book/resource descriptions, names) goes through JSX text
  interpolation (`{value}`), which is HTML-escaped automatically. There is no `dangerouslySetInnerHTML`,
  `innerHTML`, `eval()`, or `new Function()` anywhere in this codebase — confirmed by grep, not just by
  intention. If you add a feature later, keep it that way; that one pattern is responsible for the vast
  majority of real-world React XSS bugs.
- **A strict Content-Security-Policy** is set via `<meta>` in `index.html`: `script-src 'self'` with no
  `'unsafe-inline'` and no `'unsafe-eval'`. Even if something did get injected into the DOM somehow, the
  browser refuses to execute inline `<script>` tags or `javascript:` URLs. (`style-src` does allow
  `'unsafe-inline'` — that's needed for React's `style={{...}}` attributes and Tailwind's generated
  styles; inline *styles* are a much lower-severity CSP relaxation than inline *scripts*.)
- **Uploaded files are the main residual risk**, since teachers can upload arbitrary files as "learning
  resources" and students view them in an embedded `<iframe>`. A malicious upload disguised as a PDF
  could in theory be an HTML file with a `<script>` tag. Mitigations in place:
  - The reader `<iframe>` in `BookDetail.jsx` / `ResourceDetail.jsx` has `sandbox=""` (the most
    restrictive setting — no scripts, no forms, no popups, no same-origin access, no top navigation).
    Native PDF rendering in the browser doesn't need any of those permissions, so legitimate files are
    unaffected; a malicious HTML payload loaded into that frame is inert.
  - `UploadResource.jsx` restricts the file picker to document extensions
    (`.pdf .doc .docx .ppt .pptx .odt .odp .epub .txt`) and rejects files over 25MB client-side.
    **This is a UX nicety, not a security boundary** — anyone can bypass a client-side `accept` filter by
    calling Cloudinary's API directly. Configure the real enforcement in the Cloudinary upload preset:
    Console → Upload → Upload presets → your preset → restrict **Allowed formats**, and consider setting
    **Resource type** to `auto` with format restrictions rather than blanket `raw`.
  - The external "Preview" link for pending resources uses `rel="noopener noreferrer"` (see tabnabbing,
    below).

## Reverse tabnabbing

Any `<a target="_blank">` without `rel="noopener"` lets the page it opens run
`window.opener.location = 'https://phishing-site.example'` and silently redirect your *original* tab to a
lookalike login page — dangerous specifically because the destination here (an uploaded file's URL) is
attacker-choosable content, and if Cloudinary ever serves it as `text/html`, it could contain a script.
Fixed: the one `target="_blank"` link in the app (`ApproveResources.jsx`'s "Preview") now uses
`rel="noopener noreferrer"`.

## Injection (the RTDB equivalent of SQL/NoSQL injection)

Firebase Realtime Database has no query language to inject into — every read/write goes through the SDK
as structured calls (`ref()`, `push()`, `update()`, `runTransaction()`), never string-concatenated
queries, so classic injection syntax doesn't apply. Two things that *do* matter for a database like this:

**1. Path construction from user input.** Several places build a ref path from a route param or form
value, e.g. `ref(db, \`bookmarks/${uid}/${itemId}\`)`. Unlike a filesystem, RTDB paths have no `..`
parent-traversal semantics — a slash in `itemId` just creates a deeper nested key under the fixed prefix,
it can never escape to a sibling or ancestor path. Combined with `uid` always being the authenticated
user's own ID (never attacker-suppliable), this class of path-traversal is structurally not possible here.

**2. Rules that were too permissive to matter what the client *intended*.** This is the real equivalent of
an injection vector in this stack: a rule that lets an authenticated user write **any value** to a field
that only makes sense within a narrow range, regardless of what the app's own UI would ever send. Fixed
in `database.rules.json`:

| Field | Before | After |
|---|---|---|
| `books/$id/availableCopies` | Any authenticated user could set it to *any* number | Must be a number, ≥ 0, ≤ the book's `totalCopies`, and can only move by exactly ±1 per write (matches the borrow/return transaction logic — anything else is rejected) |
| `resources/$id/views` / `downloads` | Any authenticated user could set it to *any* number | Must increase by exactly 1 per write, never negative |
| `reviews/$item/$uid.userName` | Any string — a student could post a review under someone else's display name | Must exactly match the reviewer's own `users/$uid/name` |
| `holds/$id.userName` | Same spoofing issue for the waitlist | Same fix — must match the requester's own profile name |
| `users/$uid.email` (self-writes only) | Any string — a user could store a fake email on their own profile | Must match the `email` claim on their actual Firebase Auth token |
| `borrowRecords/$id` (on create) | No check that `bookId` refers to a real book, or that `dueAt`/`borrowedAt` are sane | Must reference an existing book; `dueAt` must be a number after `borrowedAt` and within 90 days of it |
| `categories`, `globalCategories`, `schools`, `announcements` | No shape/length checks | Name/title/body fields must be non-empty strings under a sane length cap |

None of this changes what the app's own UI can do — every one of these constraints was chosen to exactly
match what `utils/library.js` already sends. It only removes the gap where a user could open the browser
console and call the Firebase SDK directly with something the UI would never send.

## Cross-site request forgery (CSRF)

Not applicable in the traditional sense. CSRF exploits *ambient* credentials (cookies the browser attaches
automatically to any request to a domain). Firebase Auth doesn't work that way — the SDK explicitly
attaches a short-lived ID token to each request, obtained via JS running on this origin, so a third-party
page has no ambient credential to ride on. Firebase's Google sign-in popup flow also carries its own
CSRF-equivalent state handling internally.

## Authentication & authorization

- Role is stored server-side (`users/$uid/role`) and is the single source of truth `ProtectedRoute` reads
  from — no role or permission is ever trusted from client state alone for a *write*, only for
  UI show/hide.
- New self-registrations can only ever create `student` or `teacher` accounts (enforced in the rules
  `.validate`, not just the UI) — `librarian`/`superadmin` can only be granted by an existing admin.
  Same for Google sign-in: new accounts always default to `student`.
- A user can never edit their own `role`, `status`, or `schoolId` — those fields are locked to
  librarian/superadmin writers only, enforced at the field level in the rules.
- Firebase Auth's own backend already rate-limits repeated failed sign-in attempts — nothing extra
  needed here for basic brute-force protection.

## Things intentionally *not* secrets

`src/firebase.js` contains a Firebase **web API key and project config in plaintext, committed to the
repo**. This is correct, not an oversight — Firebase web config values identify the project, they don't
authorize access to it. The Cloudinary cloud name and unsigned upload preset name are the same story.
Real access control comes entirely from `database.rules.json` and Firebase Auth. Don't try to "hide"
these values (e.g. via environment variables baked into a public bundle) — it wouldn't add security and
would just make the repo harder to work with.

## Optional next steps, if you want to go further

- **Firebase App Check** — ties Firebase API access to a reCAPTCHA/attestation check, so even a correct
  API key + valid rules can't be hit by a bot or a script running outside your actual app. Worth adding
  if you're ever seeing abuse; requires a few lines of setup in `firebase.js` plus enabling it in the
  Firebase console.
- **Real HTTP security headers** — move hosting to something that supports a `_headers` /
  `vercel.json` / nginx config (Cloudflare Pages, Netlify, Vercel all support this on their free tiers)
  and add `X-Frame-Options`, `X-Content-Type-Options: nosniff`, and a header-based CSP with
  `frame-ancestors 'none'`. This closes the one gap GitHub Pages can't close.
- **Cloudinary upload preset restrictions** — set allowed formats and a max file size on the
  `org-resources` preset itself (Console → Upload → Upload presets), so the 25MB/extension check in
  `UploadResource.jsx` is backed by a real server-side limit instead of just a client-side one.
- **`npm audit`** periodically, and keep `firebase`/`react-router-dom`/etc. up to date — this app has a
  small, mainstream dependency list, but that's still worth a habit rather than a one-time check.
