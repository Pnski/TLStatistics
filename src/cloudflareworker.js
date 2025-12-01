export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle preflight CORS request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    // Upload endpoint
    if (request.method === "POST" && url.pathname === "/upload") {
      return handleUpload(request, env);
    }

    return new Response("OK", {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
};

// -------------------------
// Upload logic
// -------------------------
async function handleUpload(request, env) {
  try {
    const form = await request.formData(); // read body once
    const file = form.get("file");
    const message = form.get("freetext") || "";
    const token = form.get("discord_token") || "";

    if (!file) return json({ success: false, error: "No file provided" }, 400);

    // Read file content only from `file` object
    const fileContent = await file.arrayBuffer();
    const encodedFile = btoa(String.fromCharCode(...new Uint8Array(fileContent)));

    // Fetch Discord user if token is provided
    let user = null;
    if (token) {
      try {
        const res = await fetch("https://discord.com/api/users/@me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) user = await res.json();
      } catch (e) {
        console.warn("Discord token invalid or fetch failed:", e);
      }
    }

    // Determine folder and username
    const folder = user ? `UserUpload/Verified/${user.id}` : "UserUpload/Anonymous";
    const username = user ? `${user.username}#${user.discriminator}` : "Anonymous";

    // Safe filenames
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${folder}/${timestamp}_${safeFileName}`;
    const messagePath = `${folder}/${timestamp}_message.txt`;

    // Upload file to GitHub
    await githubUpload(env, filePath, encodedFile, `Upload by ${username} - ${message}`);

    // Upload freetext (if present)
    let messageResult = null;
    if (message.trim()) {
      const encodedText = btoa(unescape(encodeURIComponent(message)));
      messageResult = await githubUpload(env, messagePath, encodedText, `Message by ${username}`);
    }

    return json({
      success: true,
      user: user || "Anonymous",
      filePath,
      messagePath: message.trim() ? messagePath : null
    });

  } catch (err) {
    console.error("Upload failed:", err);
    return json({ success: false, error: err.message }, 500);
  }
}

// -------------------------
// GitHub helper
// -------------------------
async function githubUpload(env, path, content, commitMsg) {
  const res = await fetch(`https://api.github.com/repos/Pnski/TLStatistics/contents/${path}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: commitMsg,
      content,
      branch: "main"
    })
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
    // GitHub returned non-JSON response
    return { success: false, error: await res.text(), status: res.status };
  }

  if (!res.ok) {
    return { success: false, error: data, status: res.status };
  }

  return { success: true, data };
}

// -------------------------
// JSON helper with CORS
// -------------------------
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}