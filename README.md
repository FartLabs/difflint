# difflint

[![JSR](https://jsr.io/badges/@ethan/difflint)](https://jsr.io/@ethan/difflint)
[![Deno](https://img.shields.io/badge/deno-^1.40-blue)](https://deno.land/)

🔍 Git-based linter tool that scans code changes for compliance with defined
rules in source code.

`difflint` ensures that when certain parts of your codebase change, other
related parts are also updated. It works by parsing "linting directives" in your
comments and checking them against the current `git diff`.

## Installation

You can run `difflint` directly using Deno without a local installation:

```bash
git diff | deno run -A jsr:@ethan/difflint/cli
```

Or install it as a local executable:

```bash
deno install -A -n difflint jsr:@ethan/difflint/cli
git diff | difflint
```

## Usage

```bash
difflint --help
```

### Directive Syntax

`difflint` looks for `IF` and `END` blocks in your comments. The syntax is:
`[PREFIX]LINT.IF [TARGETS][SUFFIX]` ... `[PREFIX]LINT.END [ID][SUFFIX]`

- **`TARGETS`**: A space-separated list of targets that _must_ be present in the
  diff if this block is modified.
  - `path/to/file`: Requires the entire file to be in the diff.
  - `path/to/file:ID`: Requires a specific range with the given `ID` to be in
    the diff.
  - `:ID`: Requires a range in the _current_ file to be in the diff.

### Examples

#### Single file dependency

Ensure that if the "Edit me first" logic changes, the "Edit me second" logic is
also reviewed/updated.

```py
# File: ./main.py

#LINT.IF

print("Edit me first!")

#LINT.END bar

#LINT.IF :bar

print("Edit me second!")

#LINT.END
```

#### Cross-file dependency

```py
# File ./foo.py
#LINT.IF
print("Logic in foo")
#LINT.END bar
```

```py
# File: ./main.py
#LINT.IF ./foo.py:bar
print("Main logic depending on foo:bar")
#LINT.END
```

#### Exhaustive switch statement

Ensure a switch statement stays in sync with its enum.

```ts
//LINT.IF
enum Thing {
  ONE = 1,
  TWO = 2,
}
//LINT.END :thing_enum

//LINT.IF :thing_enum
switch (thing) {
  case Thing.ONE:
    return doThingOne();
  case Thing.TWO:
    return doThingTwo();
}
//LINT.END
```

## Options

- `--include <glob>`: Include files matching the given glob.
- `--exclude <glob>`: Exclude files matching the given glob.
- `--ext_map <path>`: Path to a JSON file mapping extensions to custom
  templates.
- `--verbose, -v`: Enable verbose logging.

### Custom File Extensions

Create a `difflint.json` to support custom comment styles:

```json
{
  "yaml": ["#LINT.?"]
}
```

Then run with:

```bash
git diff | difflint --ext_map="difflint.json"
```

## Library Usage

`difflint` can also be used as a library in your Deno projects:

```typescript
import { lint } from "jsr:@ethan/difflint";

const result = await lint(Deno.stdin.readable, {
  include: ["src/**/*.ts"],
});

if (result.unsatisfiedRules.length > 0) {
  console.log("Linting failed!");
}
```

---

Created with 💖 by [**@EthanThatOneKid**](https://etok.codes/)
