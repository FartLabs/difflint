/**
 * difflint parses a diff and ensures that certain "linting rules"
 * (directives like //LINT.something) are satisfied.
 *
 * @module
 */

export * from "./core/types.ts";
export * from "./diff/mod.ts";
export * from "./linter/lexer.ts";
export * from "./linter/rules.ts";
export * from "./linter/engine.ts";
export * from "./config/mod.ts";
