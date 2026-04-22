import { parseArgs } from "@std/cli/parse-args";
import { lint } from "./linter/engine.ts";
import { targetKey } from "./linter/rules.ts";
import type { UnsatisfiedRule } from "./core/types.ts";
import { ExtMap } from "./config/mod.ts";

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
    string: ["include", "exclude", "ext_map"],
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
  const extMapPath = args.ext_map as string;
  const verbose = args.verbose as boolean;

  let customExtMap: Record<string, string[]> | undefined;
  if (extMapPath) {
    try {
      const content = await Deno.readTextFile(extMapPath);
      customExtMap = JSON.parse(content);
    } catch (err) {
      console.error(`Error reading ext_map file: ${(err as Error).message}`);
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
      fileExtMap: customExtMap
        ? new ExtMap(customExtMap).fileExtMap
        : undefined,
    });

    if (result.unsatisfiedRules.length > 0) {
      console.error(formatUnsatisfiedRules(result.unsatisfiedRules));
      Deno.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
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
  --include <glob>    Include files matching the given glob (can be used multiple times)
  --exclude <glob>    Exclude files matching the given glob (can be used multiple times)
  --ext_map <path>    Path to file extension map JSON
  --verbose, -v       Enable verbose logging
  --help, -h          Show this help message
  `);
}
