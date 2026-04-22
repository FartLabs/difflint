/**
 * difflint parses a diff and ensures that certain "linting rules"
 * (directives like //LINT.something) are satisfied.
 *
 * @module
 */

export * from "./types.ts";
export * from "./diff.ts";
export * from "./lexer.ts";
export * from "./rules.ts";
export * from "./linter.ts";
export * from "./extension_map.ts";
