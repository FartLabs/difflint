import { parseArgs } from "@std/cli/parse-args";
import { lint } from "./linter.ts";
import { targetKey } from "./rules.ts";
import type { UnsatisfiedRule } from "./types.ts";
import { ExtensionMap } from "./extension_map.ts";

/**
 * Main entry point for the difflint CLI.
 */
if (import.meta.main) {
  await main();
}

/**
 * CLI runner.
 */
async function main() {
  const args = parseArgs(Deno.args, {
    string: ["include", "exclude", "extension_map"],
    boolean: ["verbose", "help"],
    alias: { h: "help", v: "verbose" },
    collect: ["include", "exclude"],
  });

  if (args.help) {
    printHelp();
    Deno.exit(0);
  }

  const include = args.include as string[] || [];
  const exclude = args.exclude as string[] || [];
  const extensionMapPath = args.extension_map as string;
  const verbose = args.verbose as boolean;

  let customExtensionMap: Record<string, string[]> | undefined;
  if (extensionMapPath) {
    try {
      const content = await Deno.readTextFile(extensionMapPath);
      customExtensionMap = JSON.parse(content);
    } catch (error) {
      console.error(
        `Error reading extension_map file: ${(error as Error).message}`,
      );
      Deno.exit(1);
    }
  }

  // Set up logging
  const log = (...data: unknown[]) => {
    if (verbose) console.error(...data);
  };

  log("Starting linting operation...");
  try {
    const result = await lint(Deno.stdin.readable, {
      include,
      exclude,
      fileExtensionMap: customExtensionMap
        ? new ExtensionMap(customExtensionMap).fileExtensionMap
        : undefined,
    });

    if (result.unsatisfiedRules.length > 0) {
      console.error(formatUnsatisfiedRules(result.unsatisfiedRules));
      Deno.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

/**
 * Formats the list of unsatisfied rules for user display.
 */
function formatUnsatisfiedRules(rules: UnsatisfiedRule[]): string {
  let output = "";
  for (const { rule, unsatisfiedTargets } of rules) {
    output +=
      `rule (${rule.hunk.file}:${rule.hunk.range.start},${rule.hunk.file}:${rule.hunk.range.end}) not satisfied for targets:\n`;
    rule.targets.forEach((target, index) => {
      if (unsatisfiedTargets.has(index)) {
        const key = targetKey(rule.hunk.file, target);
        output += `  ${key}\n`;
      }
    });
  }
  return output;
}

/**
 * Prints help information.
 */
function printHelp() {
  console.log(`
difflint - lint diffs from standard input

USAGE:
  git diff | difflint [OPTIONS]

OPTIONS:
  --include <glob>         Include files matching the given glob (can be used multiple times)
  --exclude <glob>         Exclude files matching the given glob (can be used multiple times)
  --extension_map <path>   Path to file extension map JSON
  --verbose, -v            Enable verbose logging
  --help, -h               Show this help message
  `);
}
