---
toc: false
---

# File Upload

This platform is for uploading your Throne and Liberty logfiles. All Uploads will be stored in github and implemented in views.
There are two different categories.
1. Anonymous
All files uploaded as Anonymous are subject to deletion in the future, since they can not be verified for authenticy.
2. Verified via Discord Auth
After you log in a token will be stored and your logs will be in a verified discorduser bound directory. You can request a deletion of all your logs.

Throne and Liberty Damage meter files are stored in:
```
%LOCALAPPDATA%/TL/Saved/CombatLogs
```

---

```js
import { Inputs } from "@observablehq/inputs"
```

<div style="display: flex; gap: 10px; align-items: center;">
  <div style="display: flex; flex-direction: column; gap: 10px;">
    <input type="file" id="fileInput" accept=".txt,.log" />
    <button id="discordLogin" style="background: #5865f2;">Login with Discord</button>
    <button id="uploadButton" style="background: #2ea44f;">Upload File</button>
  </div>
  <textarea id="textInput" rows="4" columns="60" placeholder="Optional message (will be added to commit description)"
  style="height: 100%; min-height: 120px; width: 100%; resize: vertical;"></textarea>
</div>
<div id="status" style="min-height: 60px; margin-top: 20px;"></div>

<script src="https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js"></script>

<script>
const WORKER_BASE = "https://weathered-snowflake-0a72.s1l3nce.workers.dev";

function updateLoginStatus(isLoggedIn) {
  const loginBtn = document.getElementById("discordLogin");
  if (loginBtn) {
    if (isLoggedIn) {
      loginBtn.textContent = "Logout";
      loginBtn.style.background = "#f04747";
      loginBtn.onclick = logoutDiscord;
        
    } else {
      loginBtn.textContent = "Login with Discord";
      loginBtn.style.background = "#5865f2";
      loginBtn.onclick = loginDiscord;
    }
  }
}

function loginDiscord() {
  const clientId = "1445177298880827604";
  const redirect = encodeURIComponent(window.location.origin + window.location.pathname);
  
  const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirect}&scope=identify`;
  
  const popup = window.open(url, "Discord Login", "width=600,height=700,location=yes,resizable=no,scrollbars=yes,status=no");
  
  if (!popup) {
      showStatus("Popup blocked. Please allow popups.");
      return;
  }

  const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
          clearInterval(checkPopup);
          return;
      }
      
      try {
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
                      sessionStorage.setItem("discord_token", params.access_token);
                      updateLoginStatus(true);
                      showStatus("Logged in");
                  } else {
                    showStatus("Error in Discord Login");
                  }
                  clearInterval(checkPopup);
                  popup.close();
              }
          }
      } catch (e) {
          // Cross-origin error - popup is still on Discord's domain
          // This is normal, just continue checking
      }
  }, 500);
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
</script>

<style>

button {
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

</style>