/**
 * Range represents a range of line numbers.
 */
export interface Range {
  /** Start line number. */
  start: number;
  /** End line number. */
  end: number;
}

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
 * Hunk represents a diff hunk that must be present in the diff.
 */
export interface Hunk {
  /** File specifier of the defined range. */
  file: string;
  /** Range of code in which a diff hunk intersects. */
  range: Range;
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
 * UnsatisfiedRule represents a rule that is not satisfied.
 */
export interface UnsatisfiedRule {
  /** Rule that is not satisfied. */
  rule: Rule;
  /** Set of target indices that are not satisfied. */
  unsatisfiedTargets: Set<number>;
}

/**
 * LintOptions represents the options for a linting operation.
 */
export interface LintOptions {
  /** include is a list of file patterns to include in the linting. */
  include?: string[];
  /** exclude is a list of file patterns to exclude from the linting. */
  exclude?: string[];
  /** templates is the list of directive templates. */
  templates?: string[];
  /** fileExtensionMap is a map of file extensions to directive templates. */
  fileExtensionMap?: Record<string, number[]>;
  /** defaultTemplate is the default directive template index. */
  defaultTemplate?: number;
}
