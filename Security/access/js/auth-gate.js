"use strict";

(function () {
    const LOGIN_PATH = "../../secutity-auth/index.html";
    const config = window.SECURITY_AUTH_CONFIG;

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

    function redirectToLogin() {
        window.location.replace(LOGIN_PATH);
    }

    async function verifyAuthentication() {
        if (!isConfigured()) {
            console.error("HOLLOWBELL auth gate: Supabase configuration is missing.");
            redirectToLogin();
            return;
        }

        if (!window.supabase || typeof window.supabase.createClient !== "function") {
            console.error("HOLLOWBELL auth gate: Supabase client is unavailable.");
            redirectToLogin();
            return;
        }

        const client = window.supabase.createClient(config.url, config.key, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        const { data, error } = await client.auth.getUser();

        if (error || !data.user) {
            redirectToLogin();
            return;
        }

        document.documentElement.classList.add("auth-ready");

        client.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_OUT") {
                redirectToLogin();
            }
        });
    }

    verifyAuthentication().catch((error) => {
        console.error("HOLLOWBELL auth gate failed:", error);
        redirectToLogin();
    });
})();
