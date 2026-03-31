# Translation Guide

This guide covers how to add a new language, update existing translations, and migrate renamed translation keys.

## Quick Start

1. Install dependencies:
   `npm install`
2. Sync extracted messages into locale files:
   `npm run translations`
3. Edit your language file in `src/locales/lang`.
4. Verify status:
   `npm run translations:status -- <lang>`
5. Run app locally to test:
   `npm run dev`

## Where Files Live

- Locale files: `src/locales/lang/<lang>.json`
- Compiled locale files (build artifact): `src/locales/lang.compiled/<lang>.json`
- Whitelist files: `src/locales/lang/whitelist_<lang>.json`
- Locale registry (single source of truth): `src/locales/registry.ts`

## Commands

- Sync/extract all messages:
  `npm run translations`
- Show status for all locales:
  `npm run translations:status`
- Show status for one locale:
  `npm run translations:status -- fr`
- Compile stripped/minified locale artifacts for production:
  `npm run translations:compile`
- Create a new locale file:
  `npm run translations:create -- de-AT`
- Migrate renamed keys (all locales):
  `npm run translations:migrate -- old.id=new.id`
- Migrate renamed keys (one locale):
  `npm run translations:migrate -- es old.id=new.id`

You can pass multiple migration mappings in one command:

`npm run translations:migrate -- old.one=new.one old.two=new.two`

## Adding a New Language

1. Create locale file from extracted defaults:
   `npm run translations:create -- <lang>`
2. Add locale metadata in `src/locales/registry.ts`.
3. Ensure locale aliases are correct in `src/locales/registry.ts` if needed (example: `zh` -> `zh-CN`).
4. Translate values in `src/locales/lang/<lang>.json`.
5. Run `npm run translations` to normalize and sort keys.
6. Check progress with `npm run translations:status -- <lang>`.

## Updating Existing Translations

1. Run `npm run translations`.
2. Edit target locale files in `src/locales/lang`.
3. Re-run `npm run translations`.
4. Verify with `npm run translations:status -- <lang>`.

## Migrating Renamed Keys

When IDs are renamed in code, preserve existing translated values with the migrate command.

Example:

`npm run translations:migrate -- plugins.github.month.jan=time.month.short.jan`

Then run:

`npm run translations`

This updates locale files to the new IDs and keeps extracted files in sync.

## Whitelist Files

Whitelist files (`whitelist_<lang>.json`) define keys that should remain in English for that locale.

Example:

If `widgets` is in `whitelist_fr.json`, French keeps the English word "widgets".

Production builds automatically run `npm run translations:compile` and load compiled locale artifacts.
