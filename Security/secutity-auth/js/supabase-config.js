"use strict";

/*
 * Supabase public configuration.
 *
 * Replace the two placeholder values with the project's:
 *   Project URL
 *   Publishable key (or legacy anon key)
 *
 * NEVER put a Supabase service_role key or any other secret key here.
 * This file is loaded by the browser, so its contents are public by design.
 */

window.SECURITY_AUTH_CONFIG = Object.freeze({
    url: "https://YOUR-PROJECT.supabase.co",
    key: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
});
