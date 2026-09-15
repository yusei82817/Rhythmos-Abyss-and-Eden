"use strict";

const form = document.getElementById("authentication-form");
const userId = document.getElementById("user-id");
const password = document.getElementById("password");
const remember = document.getElementById("remember-session");
const button = document.getElementById("authenticate-button");
const status = document.getElementById("authentication-status");

const ACCESS_PATH = "../Access.html";
const config = window.SECURITY_AUTH_CONFIG;

let supabaseClient = null;

function setStatus(message, state = "ready") {
    status.textContent = `STATUS: ${message}`;
    status.dataset.state = state;
}

function setBusy(isBusy) {
    button.disabled = isBusy;
    button.setAttribute("aria-busy", String(isBusy));
}

function openAccessPage() {
    window.location.assign(ACCESS_PATH);
}

function isConfigured() {
    return Boolean(
        config &&
        typeof config.url === "string" &&
        typeof config.key === "string" &&
        config.url.startsWith("https://") &&
        !config.url.includes("YOUR-PROJECT") &&
        config.key.length > 20 &&
        !config.key.includes("YOUR_SUPABASE")
    );
}

function createSupabaseClient(persistSession = false) {
    if (!isConfigured()) {
        return null;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        return null;
    }

    return window.supabase.createClient(config.url, config.key, {
        auth: {
            persistSession,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
}

async function checkExistingSession() {
    if (!supabaseClient) {
        setStatus("CONFIGURATION REQUIRED", "error");
        return;
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Session check failed:", error);
        setStatus("SESSION CHECK FAILED", "error");
        return;
    }

    if (data.session) {
        setStatus("SESSION PRESENT", "success");
        openAccessPage();
    }
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const email = userId.value.trim();
    const secret = password.value;

    if (!email || !secret) {
        setStatus("INPUT REQUIRED", "error");
        return;
    }

    if (!supabaseClient) {
        setStatus("CONFIGURATION REQUIRED", "error");
        return;
    }

    setBusy(true);
    setStatus("VERIFYING...", "checking");

    try {
        /*
         * Re-create the client for this login so the user's choice controls
         * whether the Supabase session survives a browser restart.
         * The preference itself is not used as proof of authentication.
         */
        supabaseClient = createSupabaseClient(remember.checked);

        if (!supabaseClient) {
            setStatus("CONFIGURATION REQUIRED", "error");
            return;
        }

        /*
         * Supabase performs credential verification on its servers.
         * The password is never stored in this repository and is not used
         * as a local authentication decision.
         */
        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password: secret
        });

        if (error) {
            console.error("Authentication failed:", error);
            setStatus("AUTHENTICATION FAILED", "error");
            password.value = "";
            return;
        }

        setStatus("AUTHENTICATION SUCCESS", "success");
        password.value = "";

        // Redirect only after Supabase confirms the login.
        openAccessPage();
    } catch (error) {
        console.error("Authentication request failed:", error);
        setStatus("AUTHENTICATION ERROR", "error");
        password.value = "";
    } finally {
        setBusy(false);
    }
});

/*
 * No localStorage/sessionStorage flag is trusted as authentication proof.
 * The Access page must validate the Supabase session independently.
 */

supabaseClient = createSupabaseClient(false);

if (supabaseClient) {
    checkExistingSession();
} else {
    setStatus("CONFIGURATION REQUIRED", "error");
}

window.SecurityAuth = Object.freeze({
    openAccessPage
});
