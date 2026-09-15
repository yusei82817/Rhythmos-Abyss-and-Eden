# Security Authentication

`Security/secutity-auth/` is the GitHub Pages-compatible authentication entry point for the project.

The client uses **Supabase Auth**. GitHub Pages hosts the frontend, while Supabase performs credential verification and manages the authentication session.

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

Create a project in Supabase and enable **Email/Password** authentication.

### 2. Get the public browser configuration

Copy the project's:

- Project URL
- Publishable key, or legacy `anon` key if that is what the project provides

Put them in:

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

### 3. Create an account

The authentication page now provides two actions:

- **AUTHENTICATE**: sign in with an existing email/password account
- **CREATE ACCOUNT**: register a new email/password account through Supabase Auth

If email confirmation is enabled in the Supabase project, account creation will show `CHECK YOUR EMAIL` and the user must complete the email verification before a normal authenticated session is established.

### 4. Configure the site URL

Set the deployed GitHub Pages URL as an allowed site/redirect URL in the Supabase authentication settings.

A deployed URL will be similar to:

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
     ├─ account creation
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

The redirect to `../Access.html` occurs only after Supabase reports a successful authenticated session.

## Remember this session

The checkbox controls whether the Supabase client persists the session in browser storage. It is **not** used as proof of authentication and no custom `authenticated=true` flag is stored.

## Important security boundary

The browser is not the authority for authentication.

Do not:

- store passwords in HTML, JavaScript, localStorage, or GitHub
- store password hashes in the public repository
- use a hard-coded password as an authentication check
- use a localStorage/sessionStorage flag as proof of authentication
- expose a Supabase `service_role` key in frontend code

Supabase performs the credential verification.

## Access.html protection

`Security/Access.html` is a static GitHub Pages resource. Redirecting to it after login does not make the HTML itself private. Anyone who knows its URL can still request the static resource.

Therefore, genuinely sensitive data must be protected server-side, for example with Supabase Row Level Security and authenticated data requests. A client-side session gate is useful for controlling the normal application flow, but it is not a substitute for server-side authorization.

## Current version

`1.2.0`
