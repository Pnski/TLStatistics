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
    const popup = window.open(
        url,
        "Discord Login",
        "width=600,height=700,location=yes,resizable=no,scrollbars=yes,status=no"
    );
    
    if (!popup) {
        showStatus("Popup blocked. Please allow popups.");
        return;
    }
    
    // Check for token in popup
    const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
            clearInterval(checkPopup);
            return;
        }
        
        try {
            // Check if popup has our URL (Discord redirected back)
            if (popup.location.href.startsWith(window.location.origin + window.location.pathname)) {
                const popupHash = popup.location.hash;
                
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
                        popup.close();
                        
                        // Stop checking
                        clearInterval(checkPopup);
                        
                        // Update UI
                        updateLoginStatus(true);
                        showStatus("Logged in");
                    }
                }
            }
        } catch (e) {
            // Cross-origin error - popup is still on Discord's domain
            // This is normal, just continue checking
        }
    }, 500);
    
    // Auto-stop checking after 2 minutes
    setTimeout(() => {
        clearInterval(checkPopup);
        if (popup && !popup.closed) {
            popup.close();
        }
    }, 120000);
}

function logoutDiscord() {
    sessionStorage.removeItem("discord_token");
    updateLoginStatus(false);
    showStatus("Logged out");
}

async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
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
            const arrayBuffer = await file.arrayBuffer();

            const hash = await sha256(arrayBuffer);

            const compressed = pako.gzip(new Uint8Array(arrayBuffer), {
                level: 9
            });
            const gzFile = new File(
                [compressed],
                hash + ".gz",
                { type: "application/gzip" }
            );

            const form = new FormData();
            form.append("file", gzFile);
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