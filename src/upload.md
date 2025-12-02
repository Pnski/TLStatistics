---
toc: false
---

# File Upload
## Upload Damage Meter files
%LOCALAPPDATA%/TL/Saved/CombatLogs

```js
import { Inputs } from "@observablehq/inputs"
```
### Discord Login

<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
  <button id="discordLogin" style="background: #5865f2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
    Login with Discord
  </button>
  <small style="color: #666;">Optional - logged-in users get verified uploads</small>
</div>

---

### Upload TXT file

<input type="file" id="fileInput" accept=".txt,.log" />
<br/>
<textarea id="textInput" rows="4" cols="60" placeholder="Optional message (will be added to commit description)"></textarea>
<br/><br/>
<button id="uploadButton" style="background: #2ea44f; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer;">
  Upload File
</button>

<div id="status" style="min-height: 60px; margin-top: 20px;"></div>

<script src="https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js"></script>
<script src="upload.js"></script>

<style>

h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 11;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(30deg, var(--theme-foreground-focus), currentColor);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

h2 {
  margin: 0;
  max-width: 34em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: var(--theme-foreground-muted);
}

@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}

</style>