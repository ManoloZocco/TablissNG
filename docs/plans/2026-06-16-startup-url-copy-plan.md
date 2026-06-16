# Browser Startup URL Copy Section Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Add a section in the TablissNG settings menu that displays the extension's internal URL and provides a copy-to-clipboard button.

**Architecture:** Add state and logic in `Settings.tsx` to read `window.location.origin + window.location.pathname`, display it conditionally in a new `.Widget` block if running as an extension, and copy it to the clipboard using the modern clipboard API with a 2-second visual feedback. Sync translations using the built-in translation script.

**Tech Stack:** React, TypeScript, React Intl (`defineMessages`/`FormattedMessage`), Sass, Feather Icons (via `@iconify/react`).

---

### Task 1: Add translation messages in Settings.tsx

**Files:**
- Modify: `src/views/settings/Settings.tsx`

**Step 1: Write messages definition**
Add the following message keys into the `messages` object in `src/views/settings/Settings.tsx`:
```typescript
  settingsStartupUrlTitle: {
    id: "settings.startupUrl.title",
    defaultMessage: "Browser Startup URL",
    description: "Title for the browser startup URL copy section",
  },
  settingsStartupUrlDescription: {
    id: "settings.startupUrl.description",
    defaultMessage: "For browsers like Vivaldi, copy this URL to set TablissNG as your startup page.",
    description: "Description explaining how to use the extension URL for startup pages",
  },
  copyTooltip: {
    id: "settings.startupUrl.copyTooltip",
    defaultMessage: "Copy URL to clipboard",
    description: "Tooltip for the copy URL button",
  },
  copySuccess: {
    id: "settings.startupUrl.copySuccess",
    defaultMessage: "Copied!",
    description: "Toast or indicator text shown after successfully copying the URL",
  },
```

**Step 2: Run verification**
Run TypeScript compiler check to verify syntax:
`pnpm run typecheck`
Expected output: Success (no compilation errors).

**Step 3: Commit**
```bash
git add src/views/settings/Settings.tsx
git commit -m "feat: add translation message definitions for startup URL section"
```

---

### Task 2: Implement Startup URL Section Logic and UI

**Files:**
- Modify: `src/views/settings/Settings.tsx`

**Step 1: Write implementation**
1. Add state for `copied` using `useState(false)`.
2. Extract the base URL:
   ```typescript
   const startupUrl = window.location.origin + window.location.pathname;
   ```
3. Determine visibility:
   ```typescript
   const showStartupSection = BUILD_TARGET !== "web" && window.location.protocol.endsWith("-extension:");
   ```
4. Add the copy handler:
   ```typescript
   const handleCopy = () => {
     navigator.clipboard.writeText(startupUrl).then(() => {
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
     });
   };
   ```
5. Render the new widget markup under the import/export/reset paragraph and above the support block.

**Step 2: Verify visually and functionally**
1. Start the development server: `pnpm run dev`
2. Open the browser at the local dev URL.
3. Open Settings. If not running as an extension, mock the protocol by appending `window.location.protocol.endsWith("-extension:")` to be `true` or test by building and loading the extension in Chromium.
4. Click the copy button, check clipboard, and verify that the icon toggles to a checkmark for 2 seconds.

**Step 3: Commit**
```bash
git add src/views/settings/Settings.tsx
git commit -m "feat: implement startup URL copy UI and clipboard logic"
```

---

### Task 3: Sync translation message keys

**Files:**
- Modify: Translation JSON files (generated automatically)

**Step 1: Run translation extraction**
Run: `pnpm run translations`
This extracts the new keys and updates the localization templates and files.

**Step 2: Run verification**
Run `git status` to verify that `src/locales/` files show changes.
Expected output: Modified translation files.

**Step 3: Commit**
```bash
git add src/locales/
git commit -m "chore: extract and sync new translation keys"
```

---

### Task 4: Translate Startup URL section to Italian

**Files:**
- Modify: `src/locales/lang/it.json`

**Step 1: Add Italian translations**
Add the following translations to `src/locales/lang/it.json`:
```json
  "settings.startupUrl.title": "URL di avvio del browser",
  "settings.startupUrl.description": "Per i browser come Vivaldi, copia questo URL per impostare TablissNG come pagina iniziale o all'avvio.",
  "settings.startupUrl.copyTooltip": "Copia URL negli appunti",
  "settings.startupUrl.copySuccess": "Copiato!",
```

**Step 2: Run verification**
Run the compile command to check for JSON and compilation correctness:
`pnpm run build:prepare`
Expected output: Successful build compilation.

**Step 3: Commit**
```bash
git add src/locales/lang/it.json
git commit -m "locale: translate browser startup URL section to Italian"
```
