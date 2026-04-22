import { walk } from "@std/fs/walk";
import { globToRegExp } from "@std/path/glob-to-regexp";
import * as path from "@std/path";
import { parseHunks } from "./diff.ts";
import { lex } from "./lexer.ts";
import { parseRules, targetKey } from "./rules.ts";
import { ExtensionMap } from "./extension_map.ts";
import type {
  Hunk,
  LintOptions,
  Range,
  Rule,
  UnsatisfiedRule,
} from "./types.ts";

/**
 * LintResult represents the result of a linting operation.
 */
export interface LintResult {
  unsatisfiedRules: UnsatisfiedRule[];
}

/**
 * lint lints the given diff against the rules found in the file tree.
 */
export async function lint(
  reader: ReadableStream<Uint8Array>,
  options: LintOptions = {},
): Promise<LintResult> {
  const include = options.include || [];
  const exclude = options.exclude || [];

  // Parse the diff hunks.
  const hunks = await parseHunks(reader);

  // Parse rules from the file tree.
  const { rulesMap, presentTargetsMap } = await rulesMapFromHunks(
    hunks,
    options,
  );

  // Check which rules are unsatisfied.
  const unsatisfiedRules = check(rulesMap, presentTargetsMap);

  // Filter out rules that are not included in the inclusion/exclusion filters.
  const filteredRules = unsatisfiedRules.filter((rule) =>
    isIncluded(rule.rule.hunk.file, include, exclude)
  );

  return { unsatisfiedRules: filteredRules };
}

/**
 * rulesMapFromHunks crawls the directory and extracts rules.
 */
async function rulesMapFromHunks(
  hunks: Hunk[],
  options: LintOptions,
) {
  const targetsMap = new Set<string>();
  const rangesMap = new Map<string, Range[]>();

  // Initialize maps from hunks.
  for (const hunk of hunks) {
    targetsMap.add(targetKey(hunk.file, {}));
    const ranges = rangesMap.get(hunk.file) || [];
    ranges.push(hunk.range);
    rangesMap.set(hunk.file, ranges);
  }

  const extensionMap = new ExtensionMap(
    undefined,
    options.templates,
    options.fileExtensionMap,
  );
  const rulesMap = new Map<string, Rule[]>();

  for await (
    const entry of walk(".", {
      includeDirs: false,
      skip: [/^\.git/],
    })
  ) {
    const filePath = path.normalize(entry.path);

    const templates = extensionMap.getTemplatesForFile(filePath);
    if (templates.length === 0) continue;

    const content = await Deno.readTextFile(filePath);
    const tokens = lex(content, { templates });
    const rules = parseRules(filePath, tokens, rangesMap.get(filePath) || []);

    if (rules.length > 0) {
      rulesMap.set(filePath, rules);

      // Add present rules to targets map.
      for (const rule of rules) {
        if (rule.present) {
          const key = targetKey(filePath, {
            file: rule.hunk.file,
            id: rule.id,
          });
          targetsMap.add(key);
        }
      }
    }
  }

  return { rulesMap, presentTargetsMap: targetsMap };
}

/**
 * check returns the list of unsatisfied rules.
 */
function check(
  rulesMap: Map<string, Rule[]>,
  targetsMap: Set<string>,
): UnsatisfiedRule[] {
  const unsatisfiedRules: UnsatisfiedRule[] = [];

  for (const [_, rules] of rulesMap) {
    for (const rule of rules) {
      if (rule.present) continue;

      const unsatisfiedTargets = new Set<number>();
      rule.targets.forEach((target, index) => {
        const key = targetKey(rule.hunk.file, target);
        if (targetsMap.has(key)) {
          unsatisfiedTargets.add(index);
        }
      });

      if (unsatisfiedTargets.size > 0) {
        unsatisfiedRules.push({
          rule,
          unsatisfiedTargets,
        });
      }
    }
  }

  return unsatisfiedRules;
}

/**
 * isIncluded determines if a path matches inclusion/exclusion rules.
 */
export function isIncluded(
  pathname: string,
  include: string[],
  exclude: string[],
): boolean {
  if (include.length === 0 && exclude.length === 0) return true;

  // Normalize path for matching.
  const normalized = path.normalize(pathname).replace(/\\/g, "/");

  for (const pattern of exclude) {
    const regexp = globToRegExp(pattern);
    if (regexp.test(normalized)) return false;
  }

  if (include.length > 0) {
    for (const pattern of include) {
      const regexp = globToRegExp(pattern);
      if (regexp.test(normalized)) return true;
    }
    return false;
  }

  return true;
}
