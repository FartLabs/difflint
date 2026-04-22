/**
 * Directive represents the type of directive.
 */
export enum Directive {
  IF = "IF",
  END = "END",
}

/**
 * Token represents a directive found in a file.
 */
export interface Token {
  /** The directive type. */
  directive: Directive;
  /** The arguments passed to the directive. */
  args: string[];
  /** The line number where the directive was found. */
  line: number;
}

/**
 * LexOptions represents the options for a lexing operation.
 */
export interface LexOptions {
  /** The list of directive templates. */
  templates: string[];
}

/**
 * lex lexes the given content and returns the list of tokens.
 *
 * @param content The content of the file.
 * @param options Lexing options including templates.
 * @returns An array of tokens.
 */
export function lex(content: string, options: LexOptions): Token[] {
  const tokens: Token[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const token = parseToken(line, lineNumber, options.templates);
    if (token) {
      tokens.push(token);
    }
  });

  return tokens;
}

/**
 * parseToken parses a line and returns a token if it's a directive.
 */
function parseToken(
  line: string,
  lineNumber: number,
  templates: string[],
): Token | null {
  const trimmedLine = line.trim();
  for (const template of templates) {
    if (!template) continue;
    const parts = template.split("?");
    if (parts.length !== 2) continue;

    const [prefix, suffix] = parts;
    if (trimmedLine.startsWith(prefix) && trimmedLine.endsWith(suffix)) {
      const middle = trimmedLine.slice(
        prefix.length,
        -suffix.length || undefined,
      )
        .trim();
      const args = middle.split(/\s+/);
      const directiveStr = args[0];

      if (
        directiveStr === Directive.IF || directiveStr === Directive.END
      ) {
        return {
          directive: directiveStr as Directive,
          args: args.slice(1),
          line: lineNumber,
        };
      }
    }
  }
  return null;
}
