"use strict";

const form = document.getElementById("authentication-form");
const userId = document.getElementById("user-id");
const password = document.getElementById("password");
const remember = document.getElementById("remember-session");
const button = document.getElementById("authenticate-button");
const status = document.getElementById("authentication-status");

const ACCESS_PATH = "../Access.html";

function setStatus(message, state = "ready") {
    status.textContent = `STATUS: ${message}`;
    status.dataset.state = state;
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
     * Frontend-only authentication is intentionally not treated as secure.
     * Replace this section with a HTTPS backend request when real credential
     * verification is connected. The backend must perform password hashing
     * and verification, then establish the authenticated session.
     */
    await wait(350);

    setStatus("BACKEND NOT CONFIGURED", "error");
    button.disabled = false;
    password.value = "";
});

// Destination after successful authentication:
// Security/secutity-auth/index.html -> Security/Access.html
function openAccessPage() {
    window.location.assign(ACCESS_PATH);
}

/*
 * Temporary integration hook for the future backend.
 * Call openAccessPage() only after the server has confirmed authentication.
 */
window.SecurityAuth = Object.freeze({
    openAccessPage
});
