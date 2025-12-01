const WORKER_BASE = "https://weathered-snowflake-0a72.s1l3nce.workers.dev";

// Discord login/logout functionality
(function parseDiscordToken() {
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = {};
        hash.split("&").forEach(pair => {
            const [key, value] = pair.split("=");
            if (key && value) params[key] = decodeURIComponent(value);
        });

        if (params.access_token) {
            sessionStorage.setItem("discord_token", params.access_token);
            history.replaceState(null, "", window.location.pathname);
            updateLoginStatus(true);
        }
    }
})();

let discordLoginWindow = null;
let popupChecker = null;

function updateLoginStatus(isLoggedIn) {
    const loginBtn = document.getElementById("discordLogin");
    if (loginBtn) {
        if (isLoggedIn) {
            loginBtn.textContent = "Logged in with Discord";
            loginBtn.style.background = "#43b581";
            loginBtn.onclick = null;
            
            if (!document.getElementById("logoutBtn")) {
                const logoutBtn = document.createElement("button");
                logoutBtn.id = "logoutBtn";
                logoutBtn.textContent = "Logout";
                logoutBtn.style.cssText = "background: #f04747; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-left: 10px;";
                logoutBtn.onclick = logoutDiscord;
                loginBtn.parentNode.appendChild(logoutBtn);
            }
        } else {
            loginBtn.textContent = "Login with Discord";
            loginBtn.style.background = "#5865f2";
            loginBtn.onclick = loginDiscord;
            
            const logoutBtn = document.getElementById("logoutBtn");
            if (logoutBtn) logoutBtn.remove();
        }
    }
}

function loginDiscord() {
    const clientId = "1445177298880827604";
    const redirect = encodeURIComponent(window.location.origin + window.location.pathname);
    
    const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirect}&scope=identify`;
    
    // Open popup window
    discordLoginWindow = window.open(
        url,
        "Discord Login",
        "width=600,height=700,location=yes"
    );
    
    if (!discordLoginWindow) {
        showStatus("Popup blocked. Please allow popups.");
        return;
    }
    
    // Focus the popup
    discordLoginWindow.focus();
    
    // Check for token in popup every 500ms
    popupChecker = setInterval(() => {
        if (!discordLoginWindow || discordLoginWindow.closed) {
            clearInterval(popupChecker);
            return;
        }
        
        try {
            // Check if popup has redirected back to our page
            if (discordLoginWindow.location.href.startsWith(window.location.origin + window.location.pathname)) {
                const popupHash = discordLoginWindow.location.hash;
                
                if (popupHash) {
                    const hash = popupHash.substring(1);
                    const params = {};
                    hash.split("&").forEach(pair => {
                        const [key, value] = pair.split("=");
                        if (key && value) params[key] = decodeURIComponent(value);
                    });

                    if (params.access_token) {
                        // Store token
                        sessionStorage.setItem("discord_token", params.access_token);
                        
                        // Close the popup window
                        discordLoginWindow.close();
                        discordLoginWindow = null;
                        
                        // Stop checking
                        clearInterval(popupChecker);
                        popupChecker = null;
                        
                        // Update UI
                        updateLoginStatus(true);
                        showStatus("Logged in");
                    }
                }
            }
        } catch (e) {
            // Cross-origin error, popup hasn't redirected yet - normal
        }
    }, 500);
    
    // Auto-clear interval after 2 minutes
    setTimeout(() => {
        if (popupChecker) {
            clearInterval(popupChecker);
            popupChecker = null;
        }
        if (discordLoginWindow && !discordLoginWindow.closed) {
            discordLoginWindow.close();
            discordLoginWindow = null;
        }
    }, 120000);
}

function logoutDiscord() {
    sessionStorage.removeItem("discord_token");
    updateLoginStatus(false);
    showStatus("Logged out");
    
    // Clean up any open popup
    if (discordLoginWindow && !discordLoginWindow.closed) {
        discordLoginWindow.close();
        discordLoginWindow = null;
    }
    if (popupChecker) {
        clearInterval(popupChecker);
        popupChecker = null;
    }
}

// Upload functionality
document.addEventListener("DOMContentLoaded", () => {
    const token = sessionStorage.getItem("discord_token");
    if (token) {
        updateLoginStatus(true);
    } else {
        updateLoginStatus(false);
    }
    
    document.getElementById("uploadButton").onclick = async () => {
        const fileInput = document.getElementById("fileInput");
        const textInput = document.getElementById("textInput");
        const status = document.getElementById("status");
        const button = document.getElementById("uploadButton");

        if (!fileInput.files.length) {
            status.textContent = "Please select a file.";
            return;
        }

        const file = fileInput.files[0];
        const message = textInput.value || "";
        const discordToken = sessionStorage.getItem("discord_token") || "";

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = "Uploading...";
        status.textContent = "Uploading...";

        try {
            const form = new FormData();
            form.append("file", file);
            form.append("message", message);
            if (discordToken) {
                form.append("discord_token", discordToken);
            }

            const res = await fetch(`${WORKER_BASE}/upload`, {
                method: "POST",
                body: form
            });

            const result = await res.json();

            if (!result.success) {
                status.textContent = `Upload failed: ${result.error}`;
            } else {
                status.textContent = "Upload successful! File saved to GitHub.";
                fileInput.value = "";
                textInput.value = "";
            }

        } catch (err) {
            status.textContent = `Error: ${err.message}`;
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    };
});

function showStatus(message) {
    document.getElementById("status").textContent = message;
}