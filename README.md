# difflint

🔍 Git-based linter tool that scans code changes for compliance with defined
rules in source code.

`difflint` ensures that when certain parts of your codebase change, other
related parts are also updated. It works by parsing linting directives in your
comments and checking them against the current `git diff`.

## Prior Art

`difflint` is inspired by Google's internal `LINT.IfChange` / `LINT.ThenChange`
tool (sometimes referred to as "IfThisThenThat" or IFTTT). It's a static
analysis tool used inside Google to prevent cross-file drift — if you modify a
section of code marked with `LINT.IfChange`, you're required to also modify the
corresponding target(s) listed in `LINT.ThenChange` within the same changelist.
If you don't, the pre-submit check blocks your submission.

The pattern is visible in several Google-managed open-source projects like
Chromium, Fuchsia, and TensorFlow.

This project is a reimagining of a previous Go implementation
[@EthanThatOneKid/difflint](https://github.com/EthanThatOneKid/difflint).

## Methodology

This TypeScript implementation of `difflint` was built using an AI-native "clean-room" approach, inspired by the methodology showcased in the [claw-code](https://x.com/realsigridjin/status/2039472968624185713) project.

Rather than a manual line-by-line translation, the porting process prioritized **architectural clarity** and **system design**:

- **Architectural Decomposition**: The original Go logic was broken down into its fundamental modules: a unified diff parser, a directive lexer, and a rule enforcement engine.
- **AI-Driven Reimplementation**: The codebase was rebuilt from the ground up using agentic coordination (Architect, Executor, and Reviewer loops). This approach allowed for a rapid, high-fidelity port that targets modern TypeScript and the Deno runtime.
- **Behavioral Parity**: Stability was maintained through a rigorous "test-first" methodology. Every core component is backed by unit tests that verify the logic remains identical to the original implementation.

By migrating the core logic to TypeScript and publishing to [JSR](https://jsr.io/@fartlabs/difflint), this project enables both developers and machines to access `difflint` natively within JavaScript runtimes, facilitating seamless integration into web-based CI/CD pipelines and modern AI-driven devtooling.

## Installation

You can run `difflint` directly using Deno without a local installation:

```bash
git diff | deno -A jsr:@fartlabs/difflint/cli
```

Or install it as a local executable:

```bash
deno install -A -n difflint jsr:@fartlabs/difflint/cli
git diff | difflint
```

## Usage

```bash
difflint --help
```

### Directive syntax

`difflint` looks for `IfChange` and `ThenChange` blocks in your comments. The
syntax is: `[PREFIX]LINT.IfChange[(LABEL)][SUFFIX]` ...
`[PREFIX]LINT.ThenChange([TARGETS])[SUFFIX]`

- **`LABEL`**: An optional name for this block, used to reference it from other
  files.
- **`TARGETS`**: A comma-separated list of targets that _must_ be present in the
  diff if this block is modified.
  - `path/to/file`: Requires the entire file to be in the diff.
  - `path/to/file:LABEL`: Requires a specific labeled range in that file to be
    in the diff.
  - `:LABEL`: Requires a labeled range in the _current_ file to be in the diff.

### Examples

#### Single file dependency

Ensure that if the "Edit me first" logic changes, the "Edit me second" logic is
also reviewed/updated.

```py
# File: ./main.py

# LINT.IfChange(bar)

print("Edit me first!")

# LINT.ThenChange(:baz)

# LINT.IfChange(baz)

print("Edit me second!")

# LINT.ThenChange(:bar)
```

#### Cross-file dependency

```py
# File ./foo.py
# LINT.IfChange(bar)
print("Logic in foo")
# LINT.ThenChange()
```

```py
# File: ./main.py
# LINT.IfChange
print("Main logic depending on foo:bar")
# LINT.ThenChange(./foo.py:bar)
```

#### Exhaustive switch statement

Ensure a switch statement stays in sync with its enum.

```ts
// LINT.IfChange(thing_enum)
enum Thing {
  ONE = 1,
  TWO = 2,
}
// LINT.ThenChange(:thing_switch)

// LINT.IfChange(thing_switch)
switch (thing) {
  case Thing.ONE:
    return doThingOne();
  case Thing.TWO:
    return doThingTwo();
}
// LINT.ThenChange(:thing_enum)
```

## Options

- `--include <glob>`: Include files matching the given glob.
- `--exclude <glob>`: Exclude files matching the given glob.
- `--ext_map <path>`: Path to a JSON file mapping extensions to custom
  templates.
- `--verbose, -v`: Enable verbose logging.

### Custom file extensions

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

## Library usage

`difflint` can also be used as a library in your Deno projects:

```typescript
import { lint } from "jsr:@fartlabs/difflint";

const result = await lint(Deno.stdin.readable, {
  include: ["src/**/*.ts"],
});

if (result.unsatisfiedRules.length > 0) {
  console.log("Linting failed!");
}
```

---

Created with 💖 by [**@EthanThatOneKid**](https://etok.codes/)
