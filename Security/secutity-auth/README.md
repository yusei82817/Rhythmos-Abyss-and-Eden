# Security Authentication

`Security/secutity-auth/` is the GitHub Pages-compatible authentication entry point for the project.

The authentication client now uses **Supabase Auth**. GitHub Pages hosts the frontend, while Supabase performs the actual credential verification and manages the authentication session.

## Structure

```text
Security/
├─ Access.html
└─ secutity-auth/
   ├─ index.html
   ├─ README.md
   ├─ css/
   │  └─ auth.css
   └─ js/
      ├─ auth.js
      └─ supabase-config.js
```

## Setup

### 1. Create a Supabase project

Create a project in Supabase and enable Email/Password authentication.

### 2. Get the public browser configuration

From the Supabase project settings, copy:

- Project URL
- Publishable key, or the legacy `anon` key if that is what the project provides

Put those values in:

```text
Security/secutity-auth/js/supabase-config.js
```

Example:

```js
window.SECURITY_AUTH_CONFIG = Object.freeze({
    url: "https://example-project.supabase.co",
    key: "YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY"
});
```

The publishable/anon key is intended for browser use. **Never put a `service_role` key in this file.**

### 3. Create users

Create the users through Supabase Authentication, or build an admin-only registration flow later.

The current login field is an **email address** because Supabase's password sign-in API authenticates with email/phone credentials. The UI calls it `USER ID / EMAIL` to preserve the security-terminal design.

### 4. Configure the site URL

Set the deployed GitHub Pages URL as an allowed site/redirect URL in the Supabase authentication settings.

For example, the deployed authentication page will have a URL similar to:

```text
https://<github-user>.github.io/<repository>/Security/secutity-auth/
```

Use the actual deployed URL for the project.

## Authentication flow

```text
GitHub Pages
     │
     ▼
secutity-auth/index.html
     │
     │ HTTPS
     ▼
Supabase Auth
     │
     ├─ credential verification
     ├─ session management
     └─ token refresh
     │
     ▼
Authentication success
     │
     ▼
Security/Access.html
```

The redirect to `../Access.html` occurs only after Supabase reports a successful password login.

## Important security boundary

The browser is **not** the authority for authentication.

Do not:

- store passwords in HTML, JavaScript, localStorage, or GitHub
- store password hashes in the public repository
- use a hard-coded password as an authentication check
- use a localStorage/sessionStorage flag as proof that a user is authenticated
- expose a Supabase `service_role` key in frontend code

The authentication page does not make a local password comparison. Supabase performs the credential verification.

## Access.html protection

`Security/Access.html` is a static GitHub Pages resource. A static page cannot be made private merely by redirecting users to it after login. Anyone who knows its URL can request it directly.

Therefore, if `Access.html` contains genuinely protected data, the page must independently validate the Supabase session before displaying protected content, and the sensitive data itself must be protected by server-side authorization rules such as Supabase Row Level Security.

The current redirect is therefore a **navigation step**, not a replacement for server-side authorization.

## Current version

`1.1.0`
