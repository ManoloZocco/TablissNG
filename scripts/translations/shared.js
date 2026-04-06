const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const localesDir = path.join(rootDir, "src", "locales", "lang");
const extractedMessagesPath = path.join(
  rootDir,
  "src",
  "locales",
  "extractedMessages",
  "messages.json",
);

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    const rel = path.relative(rootDir, filePath);
    console.error(`\n✗ Failed to parse ${rel}: ${err.message}`);
    process.exit(1);
  }
}

function toJsonContent(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJson(filePath, value, context) {
  const content = toJsonContent(value);
  if (context.dryRun) {
    return;
  }
  fs.writeFileSync(filePath, content);
}

function writeJsonIfChanged(filePath, value, context) {
  const content = toJsonContent(value);
  const existing = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf8")
    : null;
  if (existing === content) {
    return false;
  }

  if (context.dryRun) {
    return true;
  }

  fs.writeFileSync(filePath, content);
  return true;
}

function sortKeys(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function normalizeExtractedMessages(extracted) {
  if (Array.isArray(extracted)) {
    return Object.fromEntries(
      extracted.flatMap((message) => {
        const id = message?.id;
        if (!id) return [];
        return [
          [
            id,
            typeof message.defaultMessage === "string"
              ? message.defaultMessage
              : "",
          ],
        ];
      }),
    );
  }

  if (!extracted || typeof extracted !== "object") {
    return {};
  }

  const normalized = {};

  for (const [id, value] of Object.entries(extracted)) {
    normalized[id] =
      typeof value === "string"
        ? value
        : typeof value?.defaultMessage === "string"
          ? value.defaultMessage
          : "";
  }

  return normalized;
}

function listLanguageFiles() {
  return fs
    .readdirSync(localesDir)
    .filter((file) => file.endsWith(".json") && !file.startsWith("whitelist_"))
    .sort();
}

function getWhitelistedIds(languageFile) {
  const language = languageFile.replace(/\.json$/, "");
  const whitelistPath = path.join(localesDir, `whitelist_${language}.json`);
  const whitelist = readJson(whitelistPath, []);
  return new Set(Array.isArray(whitelist) ? whitelist : []);
}

function formatSummaryLine(message, context) {
  if (context.dryRun) {
    return `\n⊘ DRY RUN: ${message}`;
  }
  return `\n✓ ${message}`;
}

function logInfo(context, message) {
  if (!context.quiet) {
    console.log(message);
  }
}

function validateMessageObject(obj, filename) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    console.error(`  ✗ ${filename}: invalid JSON, skipping.`);
    return false;
  }
  return true;
}

function extractMessages() {
  const formatjsBin = path.join(rootDir, "node_modules", ".bin", "formatjs");
  if (!fs.existsSync(formatjsBin)) {
    console.error(
      "\n✗ Missing FormatJS CLI binary: node_modules/.bin/formatjs",
    );
    console.error(
      "  Run `npm install` from the repository root, then try again.",
    );
    process.exit(1);
  }

  const args = [
    "extract",
    "src/**/*.{ts,tsx}",
    "--ignore",
    "**/*.d.ts",
    "--out-file",
    "src/locales/extractedMessages/messages.json",
  ];

  try {
    execFileSync(formatjsBin, args, {
      cwd: rootDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
  } catch (err) {
    console.error(`\n✗ Failed to extract messages: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  localesDir,
  extractedMessagesPath,
  readJson,
  writeJson,
  writeJsonIfChanged,
  normalizeExtractedMessages,
  extractMessages,
  listLanguageFiles,
  getWhitelistedIds,
  formatSummaryLine,
  logInfo,
  validateMessageObject,
  sortKeys,
};
