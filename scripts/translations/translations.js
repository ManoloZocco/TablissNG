const { runSync } = require("./commands/sync");
const { runStatus } = require("./commands/status");
const { runCreate } = require("./commands/create");
const { runMigrate, parseMigrateArgs } = require("./commands/migrate");
const { runCompile } = require("./commands/compile");

function parseGlobalOptions(argv) {
  const options = { dryRun: false, quiet: false };
  const args = [];

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--quiet") {
      options.quiet = true;
      continue;
    }
    args.push(arg);
  }

  return {
    options,
    args,
  };
}

function printUsage() {
  console.log(`Usage: node scripts/translations/translations.js [options] [command] [args...]

Global Options:
	--dry-run           Preview changes without writing to files
	--quiet             Minimize non-essential output

Commands:
	(no command)        Extract messages and sync all language files (default)
	status [lang]       Show translation status for all or a specific language
	compile             Compile stripped/minified locale files for production build
	create <lang>       Create a new language file with default English values
	migrate [lang] --map <mapping...>
									Migrate renamed IDs in language/whitelist files.
									Mapping format: --map old.id=new.id (repeatable)
	help                Show this help message

Examples:
	node scripts/translations/translations.js              # sync all languages
	node scripts/translations/translations.js --dry-run    # preview all changes
	node scripts/translations/translations.js --quiet      # summary-only style output
	node scripts/translations/translations.js status       # overview of all languages
	node scripts/translations/translations.js status fr    # untranslated keys in French
	node scripts/translations/translations.js compile      # write production locale artifacts
	node scripts/translations/translations.js create de-AT # create Austrian German
	node scripts/translations/translations.js migrate es --map plugins.github.month.jan=time.month.short.jan
	node scripts/translations/translations.js --dry-run migrate --map plugins.github.months=time.month`);
}

const { options, args } = parseGlobalOptions(process.argv.slice(2));
const context = options;

if (context.dryRun && !context.quiet) {
  console.log("⊘ DRY RUN MODE - No files will be written\n");
}

const [command, ...commandArgs] = args;

switch (command) {
  case undefined:
  case "sync":
    runSync(context);
    break;
  case "status":
    runStatus(commandArgs[0], context);
    break;
  case "create":
    runCreate(commandArgs[0], context);
    break;
  case "compile":
    runCompile(context);
    break;
  case "migrate":
    {
      const { targetLang, migrations } = parseMigrateArgs(commandArgs);
      runMigrate(targetLang, migrations, context);
    }
    break;
  case "help":
  case "--help":
  case "-h":
    printUsage();
    break;
  default:
    console.error(`Unknown command: ${command}\n`);
    printUsage();
    process.exit(1);
}
