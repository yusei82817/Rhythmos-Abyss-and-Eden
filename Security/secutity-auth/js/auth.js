"use strict";

const form = document.getElementById("authentication-form");
const userId = document.getElementById("user-id");
const password = document.getElementById("password");
const remember = document.getElementById("remember-session");
const button = document.getElementById("authenticate-button");
const signupButton = document.getElementById("signup-button");
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
    signupButton.disabled = isBusy;
    button.setAttribute("aria-busy", String(isBusy));
    signupButton.setAttribute("aria-busy", String(isBusy));
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
    if (!isConfigured()) return null;
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;

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

    setBusy(true);
    setStatus("VERIFYING...", "checking");

    try {
        supabaseClient = createSupabaseClient(remember.checked);

        if (!supabaseClient) {
            setStatus("CONFIGURATION REQUIRED", "error");
            return;
        }

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
        openAccessPage();
    } catch (error) {
        console.error("Authentication request failed:", error);
        setStatus("AUTHENTICATION ERROR", "error");
        password.value = "";
    } finally {
        setBusy(false);
    }
});

signupButton.addEventListener("click", async () => {
    const email = userId.value.trim();
    const secret = password.value;

    if (!email || !secret) {
        setStatus("EMAIL AND PASSWORD REQUIRED", "error");
        return;
    }

    if (!supabaseClient) {
        supabaseClient = createSupabaseClient(remember.checked);
    }

    if (!supabaseClient) {
        setStatus("CONFIGURATION REQUIRED", "error");
        return;
    }

    setBusy(true);
    setStatus("CREATING ACCOUNT...", "checking");

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password: secret
        });

        if (error) {
            console.error("Account creation failed:", error);
            setStatus("ACCOUNT CREATION FAILED", "error");
            password.value = "";
            return;
        }

        password.value = "";

        if (data.session) {
            setStatus("ACCOUNT CREATED", "success");
            openAccessPage();
            return;
        }

        setStatus("CHECK YOUR EMAIL", "success");
    } catch (error) {
        console.error("Account creation request failed:", error);
        setStatus("ACCOUNT CREATION ERROR", "error");
        password.value = "";
    } finally {
        setBusy(false);
    }
});

supabaseClient = createSupabaseClient(false);

if (supabaseClient) {
    checkExistingSession();
} else {
    setStatus("CONFIGURATION REQUIRED", "error");
}

window.SecurityAuth = Object.freeze({
    openAccessPage
});
