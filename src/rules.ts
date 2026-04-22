import { Directive, type Token } from "./lexer.ts";
import type { Hunk, Range } from "./diff.ts";
import * as path from "@std/path";

/**
 * Target represents a file or range of code that must be present in the diff
 * if a diff hunk is present.
 */
export interface Target {
  /** File specifier expected to contain a diff hunk. */
  file?: string;
  /** ID is the ID of the range of code in which a diff hunk intersects. */
  id?: string;
}

/**
 * Rule says that a file or range of code must be present in the diff
 * if another range is present.
 */
export interface Rule {
  /** Hunk is the diff hunk that must be present in the diff. */
  hunk: Hunk;
  /** Targets are the files or ranges of code that must be present in the diff if the hunk is present. */
  targets: Target[];
  /** Present is true if the change is present in the diff from which the rules were parsed. */
  present: boolean;
  /** Optional, unique identifier for the rule. */
  id?: string;
}

/**
 * rangesIntersect returns true if the given ranges intersect.
 */
export function rangesIntersect(a: Range, b: Range): boolean {
  return a.start <= b.end && b.start <= a.end;
}

/**
 * parseRules parses the given tokens and returns the list of rules.
 *
 * @param file The file name.
 * @param tokens The list of tokens parsed from the file.
 * @param ranges The list of diff ranges for this file.
 * @returns An array of rules.
 */
export function parseRules(
  file: string,
  tokens: Token[],
  ranges: Range[],
): Rule[] {
  const rules: Rule[] = [];
  let currentRule: Partial<Rule> | null = null;

  for (const token of tokens) {
    switch (token.directive) {
      case Directive.IF:
        if (currentRule) {
          throw new Error(`unexpected IF directive at ${file}:${token.line}`);
        }

        currentRule = {
          targets: parseTargets(token.args),
          hunk: {
            file,
            range: { start: token.line, end: -1 },
          },
          present: false,
        };
        break;

      case Directive.END:
        if (!currentRule) {
          throw new Error(`unexpected END directive at ${file}:${token.line}`);
        }

        if (token.args.length > 0) {
          currentRule.id = token.args[0];
        }

        if (currentRule.hunk) {
          currentRule.hunk.range.end = token.line;
          const ruleRange = currentRule.hunk.range;

          // A rule is present if it overlaps with any diff hunk
          currentRule.present = ranges.some((range) =>
            rangesIntersect(ruleRange, range)
          );
        }

        rules.push(currentRule as Rule);
        currentRule = null;
        break;
    }
  }

  return rules;
}

/**
 * parseTargets parses the given list of targets.
 */
export function parseTargets(args: string[]): Target[] {
  return args.map((arg) => {
    const [filePart, idPart] = arg.split(":");
    const target: Target = {};
    if (filePart) target.file = filePart;
    if (idPart !== undefined) target.id = idPart;
    return target;
  });
}

/**
 * targetKey returns a unique key for the given target relative to a pathname.
 */
export function targetKey(pathname: string, target: Target): string {
  let key = pathname;

  if (target.file) {
    key = target.file;
    if (isRelativeToCurrentDirectory(target.file)) {
      key = path.join(path.dirname(pathname), target.file);
    }
  }

  if (target.id) {
    key += ":" + target.id;
  }

  return path.normalize(key);
}

/**
 * isRelativeToCurrentDirectory returns true if the path starts with ./ or ../
 */
function isRelativeToCurrentDirectory(path: string): boolean {
  return path.startsWith("./") || path.startsWith("../");
}
