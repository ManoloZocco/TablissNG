# Design Doc: Browser Startup URL Copy Section

## Goal
Add a section in the TablissNG settings menu that displays the extension's internal URL (e.g. `chrome-extension://.../index.html` or `moz-extension://.../index.html`) and provides a copy button. This helps users set TablissNG as their browser startup page, which is particularly useful for browsers like Vivaldi that do not support automatically setting extension new-tab pages as startup pages.

## Architecture & Logic
1. **URL Retrieval**:
   Retrieve the current base extension page URL dynamically using:
   ```typescript
   const startupUrl = window.location.origin + window.location.pathname;
   ```
2. **Conditional Visibility**:
   Only show this section if running inside a browser extension environment (not in the hosted web app version):
   ```typescript
   const showStartupSection = BUILD_TARGET !== "web" && window.location.protocol.endsWith("-extension:");
   ```
3. **Copy functionality**:
   Use the clipboard API `navigator.clipboard.writeText(startupUrl)` with fallback visual state indicators for 2 seconds.

## UI Layout
Placed in `Settings.tsx` directly above the "Support TablissNG" section.
- A widget block using the `.Widget` SASS class.
- Read-only text input containing the URL.
- Copy button containing a feather-copy/feather-check icon.

## Translations
New messages to be declared in `Settings.tsx` and synchronized to all locale files:
- `settings.startupUrl.title`
- `settings.startupUrl.description`
- `settings.startupUrl.copyTooltip`
- `settings.startupUrl.copySuccess`
