const fs = require("fs");
const path = require("path");

const {
  localesDir,
  extractedMessagesPath,
  readJson,
  writeJsonIfChanged,
  normalizeExtractedMessages,
  listLanguageFiles,
  getWhitelistedIds,
  validateMessageObject,
  sortKeys,
} = require("./shared");

function parseArgs(argv) {
  const args = [];
  const options = { dryRun: false, quiet: false };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--quiet") {
      options.quiet = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    args.push(arg);
  }

  return { options, args };
}

function printUsage() {
  console.log(
    `Usage: node scripts/translations/prune-untranslated.js [options] [lang]\n\nOptions:\n  --dry-run     Preview removals without writing files\n  --quiet       Minimize per-file output\n  --help, -h    Show this help message\n\nBehavior:\n  Removes keys from language files when value is untranslated:\n  - empty string\n  - same as default message\n  - non-string value\n\nNotes:\n  - Whitelisted keys are kept\n  - Unknown keys (not in extracted defaults) are kept`,
  );
}

function isUntranslatedValue(value, defaultValue) {
  if (typeof value !== "string") return true;
  if (value.length === 0) return true;
  return typeof defaultValue === "string" && value === defaultValue;
}

function run() {
  const { options, args } = parseArgs(process.argv.slice(2));
  const context = { dryRun: options.dryRun };

  if (options.help) {
    printUsage();
    return;
  }

  const [targetLang] = args;

  if (!fs.existsSync(extractedMessagesPath)) {
    console.error("✗ Missing extracted messages file.");
    console.error("  Run: npm run translations");
    process.exit(1);
  }

  const defaultMessages = normalizeExtractedMessages(
    readJson(extractedMessagesPath, {}),
  );
  const languageFiles = targetLang
    ? [`${targetLang}.json`]
    : listLanguageFiles();

  let updatedFiles = 0;
  let removedKeys = 0;

  if (options.dryRun && !options.quiet) {
    console.log("⊘ DRY RUN MODE - No files will be written\n");
  }

  for (const languageFile of languageFiles) {
    const languagePath = path.join(localesDir, languageFile);
    if (!fs.existsSync(languagePath)) {
      console.error(`✗ Language file not found: ${languageFile}`);
      continue;
    }

    const existingMessages = readJson(languagePath, {});
    if (!validateMessageObject(existingMessages, languageFile)) {
      continue;
    }

    const whitelistedIds = getWhitelistedIds(languageFile);
    const nextMessages = {};
    const removedInFile = [];

    for (const [id, value] of Object.entries(existingMessages)) {
      const defaultValue = defaultMessages[id];
      const isKnownKey = Object.hasOwn(defaultMessages, id);

      if (
        isKnownKey &&
        !whitelistedIds.has(id) &&
        isUntranslatedValue(value, defaultValue)
      ) {
        removedInFile.push(id);
        continue;
      }

      nextMessages[id] = value;
    }

    if (removedInFile.length === 0) {
      if (!options.quiet) {
        console.log(`  ${languageFile}: no untranslated keys to remove`);
      }
      continue;
    }

    writeJsonIfChanged(languagePath, sortKeys(nextMessages), context);
    updatedFiles += 1;
    removedKeys += removedInFile.length;

    if (!options.quiet) {
      console.log(
        `  ${languageFile}: removed ${removedInFile.length} ${removedInFile.length === 1 ? "key" : "keys"}`,
      );
    }
  }

  const summaryPrefix = options.dryRun ? "⊘ DRY RUN" : "✓";
  console.log(
    `\n${summaryPrefix}: pruned ${removedKeys} ${removedKeys === 1 ? "key" : "keys"} across ${updatedFiles} ${updatedFiles === 1 ? "file" : "files"}.`,
  );
}

run();
