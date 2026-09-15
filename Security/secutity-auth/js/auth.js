"use strict";

const form = document.getElementById("authentication-form");
const userId = document.getElementById("user-id");
const password = document.getElementById("password");
const remember = document.getElementById("remember-session");
const button = document.getElementById("authenticate-button");
const status = document.getElementById("authentication-status");

const SESSION_KEY = "security-auth-session";

function setStatus(message, state = "ready") {
    status.textContent = `STATUS: ${message}`;
    status.dataset.state = state;
}

function clearSession() {
    try {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
    } catch (_) {
        // Storage can be unavailable in restricted browser contexts.
    }
}

function restoreSessionState() {
    try {
        const stored = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
        if (stored) {
            const session = JSON.parse(stored);
            if (session?.authenticated === true) {
                setStatus("SESSION PRESENT", "success");
            }
        }
    } catch (_) {
        clearSession();
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const username = userId.value.trim();
    const secret = password.value;

    if (!username || !secret) {
        setStatus("INPUT REQUIRED", "error");
        return;
    }

    button.disabled = true;
    setStatus("VERIFYING...", "checking");

    /*
     * This frontend deliberately does NOT verify a password locally.
     * A real authentication system must send credentials over HTTPS to
     * a trusted backend, where the password is checked against a
     * server-side Argon2id/scrypt/PBKDF2 password hash.
     *
     * No plaintext password is written to localStorage/sessionStorage.
     */
    await wait(350);

    setStatus("BACKEND NOT CONFIGURED", "error");
    button.disabled = false;

    // Prevent accidental retention in browser autofill variables.
    password.value = "";
});

restoreSessionState();
