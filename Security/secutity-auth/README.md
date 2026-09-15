# Security Authentication

`Security/secutity-auth/` is the authentication UI and client-side entry point for the project.

## Current structure

```text
secutity-auth/
├─ index.html
├─ README.md
├─ css/
│  └─ auth.css
└─ js/
   └─ auth.js
```

## Security boundary

The current implementation is intentionally a **frontend shell**. It does not pretend that HTML/JavaScript alone can provide secure authentication.

A production authentication backend should provide:

- HTTPS/TLS
- Server-side password verification
- Argon2id, scrypt, or an appropriate password-hashing scheme
- Generic authentication errors to reduce account enumeration
- Rate limiting and abuse protection
- Secure session cookies (`HttpOnly`, `Secure`, appropriate `SameSite`)
- CSRF protection where cookie-based authentication is used
- Input validation and output encoding
- A restrictive Content Security Policy
- Optional WebAuthn/passkeys or another second authentication factor

### Important

Do **not** put real passwords, password hashes, API secrets, or private authentication keys in this directory's frontend JavaScript.

The browser client should eventually communicate with a trusted backend endpoint such as `/api/auth/login` over HTTPS. The backend should perform the actual credential verification and create the authenticated session.

The `Remember this session` control is currently present in the UI but is not used to persist credentials or fake an authenticated state.
