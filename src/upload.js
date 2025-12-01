const WORKER_BASE = "https://weathered-snowflake-0a72.s1l3nce.workers.dev";

// -------------------------
// Discord login/logout functionality
// -------------------------

// Parse token on page load
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
            console.log("Discord token stored");
            
            // Remove hash from URL without reloading
            history.replaceState(null, "", window.location.pathname);
            
            // Update UI
            updateLoginStatus(true);
            
            // Show success message
            setTimeout(() => {
                showStatus("Successfully logged in with Discord!", "success");
            }, 300);
        }
    }
})();

// Update login/logout button
function updateLoginStatus(isLoggedIn) {
    const loginBtn = document.getElementById("discordLogin");
    if (loginBtn) {
        if (isLoggedIn) {
            loginBtn.innerHTML = `
                <span style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#43b581">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Logged in with Discord
                </span>
            `;
            loginBtn.style.background = "#43b581";
            loginBtn.style.cursor = "default";
            loginBtn.onclick = null;
            
            // Add logout button
            if (!document.getElementById("logoutBtn")) {
                const logoutBtn = document.createElement("button");
                logoutBtn.id = "logoutBtn";
                logoutBtn.innerHTML = "Logout";
                logoutBtn.style.cssText = `
                    background: #f04747;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-left: 10px;
                    transition: background 0.2s;
                `;
                logoutBtn.onmouseenter = () => logoutBtn.style.background = "#d84040";
                logoutBtn.onmouseleave = () => logoutBtn.style.background = "#f04747";
                logoutBtn.onclick = logoutDiscord;
                loginBtn.parentNode.appendChild(logoutBtn);
            }
        } else {
            loginBtn.innerHTML = `
                <span style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                    </svg>
                    Login with Discord
                </span>
            `;
            loginBtn.style.background = "#5865f2";
            loginBtn.style.cursor = "pointer";
            loginBtn.onclick = () => loginDiscord();
            
            // Remove logout button if exists
            const logoutBtn = document.getElementById("logoutBtn");
            if (logoutBtn) logoutBtn.remove();
        }
    }
}

let discordLoginWindow = null;

function loginDiscord() {
    const clientId = "1445177298880827604";
    // Use current page as redirect URI
    const currentUrl = window.location.origin + window.location.pathname;
    const redirect = encodeURIComponent(currentUrl);
    const scope = "identify";
    const responseType = "token";

    const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirect}&scope=${scope}`;
    
    // Open popup window
    discordLoginWindow = window.open(
        url,
        "Discord Login",
        "width=600,height=700,menubar=no,toolbar=no,location=yes,resizable=no,scrollbars=yes,status=no"
    );
    
    if (!discordLoginWindow) {
        showStatus("Popup blocked. Please allow popups for this site.", "warning");
        return;
    }
    
    // Focus the popup
    discordLoginWindow.focus();
    
    // Check for token in popup every 500ms
    const checkPopup = setInterval(() => {
        if (!discordLoginWindow || discordLoginWindow.closed) {
            clearInterval(checkPopup);
            return;
        }
        
        try {
            // Check if popup has our redirect URL with hash
            if (discordLoginWindow.location.href.startsWith(currentUrl)) {
                const popupHash = discordLoginWindow.location.hash;
                
                if (popupHash) {
                    // Extract token from hash
                    const hash = popupHash.substring(1);
                    const params = {};
                    hash.split("&").forEach(pair => {
                        const [key, value] = pair.split("=");
                        if (key && value) params[key] = decodeURIComponent(value);
                    });

                    if (params.access_token) {
                        // Store token
                        sessionStorage.setItem("discord_token", params.access_token);
                        
                        // Close the popup
                        discordLoginWindow.close();
                        discordLoginWindow = null;
                        
                        // Clear interval
                        clearInterval(checkPopup);
                        
                        // Update UI
                        updateLoginStatus(true);
                        
                        // Show success message
                        setTimeout(() => {
                            showStatus("Successfully logged in with Discord!", "success");
                        }, 300);
                    }
                }
            }
        } catch (e) {
            // Cross-origin error, popup hasn't redirected yet
            // This is normal during the login flow
        }
    }, 500);
    
    // Auto-clear interval after 2 minutes
    setTimeout(() => {
        if (discordLoginWindow && !discordLoginWindow.closed) {
            discordLoginWindow.close();
            discordLoginWindow = null;
        }
        clearInterval(checkPopup);
    }, 120000);
}

function logoutDiscord() {
    sessionStorage.removeItem("discord_token");
    updateLoginStatus(false);
    showStatus("Logged out from Discord", "success");
    
    // Close any open popup
    if (discordLoginWindow && !discordLoginWindow.closed) {
        discordLoginWindow.close();
        discordLoginWindow = null;
    }
}

// -------------------------
// Upload functionality
// -------------------------

document.addEventListener("DOMContentLoaded", () => {
    // Check if already logged in
    const token = sessionStorage.getItem("discord_token");
    if (token) {
        updateLoginStatus(true);
        
        // Verify token is still valid
        verifyDiscordToken(token).then(isValid => {
            if (!isValid) {
                sessionStorage.removeItem("discord_token");
                updateLoginStatus(false);
                showStatus("Discord session expired. Please login again.", "warning");
            }
        });
    } else {
        updateLoginStatus(false);
    }
    
    // File input validation
    const fileInput = document.getElementById("fileInput");
    const status = document.getElementById("status");
    
    fileInput.addEventListener("change", function() {
        if (!this.files.length) return;
        
        const file = this.files[0];
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        const isTextFile = file.name.toLowerCase().endsWith('.txt') || 
                          file.name.toLowerCase().endsWith('.log');
        
        if (!isTextFile) {
            showStatus("Please select a .txt or .log file", "warning");
            this.value = "";
        } else if (file.size > 10 * 1024 * 1024) {
            showStatus(`File too large (${sizeMB}MB). Max 10MB.`, "error");
            this.value = "";
        } else {
            showStatus(`Ready: ${file.name} (${sizeMB}MB)`, "success");
        }
    });

    // Upload button
    document.getElementById("uploadButton").onclick = async () => {
        const fileInput = document.getElementById("fileInput");
        const textInput = document.getElementById("textInput");
        const button = document.getElementById("uploadButton");

        if (!fileInput.files.length) {
            showStatus("Please select a file.", "error");
            return;
        }

        const file = fileInput.files[0];
        const message = textInput.value || "";
        const discordToken = sessionStorage.getItem("discord_token") || "";

        // Update UI
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = "Uploading...";
        button.style.opacity = "0.7";

        showStatus("Preparing upload...", "info");

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
                showStatus(`Upload failed: ${result.error}`, "error");
                if (result.details) console.error("Details:", result.details);
            } else {
                // Success message
                let successHtml = `
                    <div style="color: #43b581;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#43b581">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            <strong style="font-size: 1.1em;">✅ Upload successful!</strong>
                        </div>
                        
                        ${result.user ? `
                            <div style="margin: 8px 0;">
                                <strong>Uploaded by:</strong> ${result.user.username}#${result.user.discriminator}
                            </div>
                        ` : ''}
                        
                        <div style="margin: 8px 0; font-family: monospace; font-size: 0.9em;">
                            <strong>Saved to:</strong> ${result.filePath}
                        </div>
                        
                        ${result.commitMessage ? `
                            <div style="margin: 8px 0; font-size: 0.9em; color: #666;">
                                <strong>Commit message:</strong> ${result.commitMessage}
                            </div>
                        ` : ''}
                `;
                
                if (result.fileUrl) {
                    successHtml += `
                        <div style="margin-top: 12px;">
                            <a href="${result.fileUrl}" 
                               target="_blank" 
                               style="
                                    color: #5865f2; 
                                    text-decoration: none; 
                                    padding: 6px 12px; 
                                    border: 1px solid #5865f2; 
                                    border-radius: 4px;
                                    margin-right: 8px;
                                    font-size: 0.9em;
                               ">
                                📁 View on GitHub
                            </a>
                            
                            <a href="${result.downloadUrl}" 
                               target="_blank" 
                               style="
                                    color: #2ea44f; 
                                    text-decoration: none; 
                                    padding: 6px 12px; 
                                    border: 1px solid #2ea44f; 
                                    border-radius: 4px;
                                    font-size: 0.9em;
                               ">
                                ⬇️ Download
                            </a>
                        </div>
                    `;
                }
                
                successHtml += `</div>`;
                showStatus(successHtml, "success");
                
                // Clear form
                fileInput.value = "";
                textInput.value = "";
                
                // Auto-clear success message after 15 seconds
                setTimeout(() => {
                    const currentStatus = document.getElementById("status");
                    if (currentStatus.innerHTML.includes("Upload successful")) {
                        currentStatus.innerHTML = "";
                    }
                }, 15000);
                
                console.log("Upload successful:", result);
            }

        } catch (err) {
            showStatus(`Network error: ${err.message}`, "error");
            console.error("Upload error:", err);
        } finally {
            // Restore button
            button.disabled = false;
            button.textContent = originalText;
            button.style.opacity = "1";
        }
    };

    // Add CSS for status messages and spinner
    const style = document.createElement('style');
    style.textContent = `
        .status-message {
            padding: 12px 16px;
            border-radius: 6px;
            margin: 10px 0;
            border: 1px solid transparent;
        }
        .status-success {
            color: #43b581;
            background: #e6ffec;
            border-color: #bae6c4;
        }
        .status-error {
            color: #f04747;
            background: #ffe6e6;
            border-color: #ffb3b3;
        }
        .status-warning {
            color: #f0b232;
            background: #fff9e6;
            border-color: #ffd699;
        }
        .status-info {
            color: #5865f2;
            background: #e6e9ff;
            border-color: #b3b9ff;
        }
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 8px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        #discordLogin, #uploadButton, #logoutBtn {
            transition: all 0.2s ease;
        }
        #discordLogin:hover {
            filter: brightness(1.1);
        }
    `;
    document.head.appendChild(style);
});

// -------------------------
// Helper functions
// -------------------------

function showStatus(message, type = "info") {
    const status = document.getElementById("status");
    const isHtml = message.includes('<');
    
    let icon = '';
    switch(type) {
        case 'success': icon = '✅'; break;
        case 'error': icon = '❌'; break;
        case 'warning': icon = '⚠️'; break;
        case 'info': icon = 'ℹ️'; break;
    }
    
    if (isHtml) {
        status.innerHTML = message;
        // Add appropriate class
        if (status.firstElementChild) {
            status.firstElementChild.classList.add(`status-${type}`);
        }
    } else {
        status.innerHTML = `
            <div class="status-message status-${type}">
                ${icon} ${message}
            </div>
        `;
    }
}

async function verifyDiscordToken(token) {
    if (!token) return false;
    
    try {
        const res = await fetch("https://discord.com/api/users/@me", {
            headers: { 
                Authorization: `Bearer ${token}`,
                "User-Agent": "TLStatistics-Uploader/1.0"
            }
        });
        return res.ok;
    } catch {
        return false;
    }
}