import { assertEquals } from "@std/assert";
import { Directive, lex } from "./lexer.ts";

Deno.test("lex extracts IfChange/ThenChange tokens correctly", () => {
  const content = `
// first line
//LINT.IfChange
func main() {
}
//LINT.ThenChange(main.go:ID)
`;
  const templates = ["//LINT.?"];
  const tokens = lex(content, { templates });

  assertEquals(tokens.length, 2);
  assertEquals(tokens[0].directive, Directive.IfChange);
  assertEquals(tokens[0].args, []);
  assertEquals(tokens[0].line, 3);
  assertEquals(tokens[1].directive, Directive.ThenChange);
  assertEquals(tokens[1].args, ["main.go:ID"]);
  assertEquals(tokens[1].line, 6);
});

Deno.test("lex handles IfChange with label", () => {
  const content = `
//LINT.IfChange(my_label)
some code
//LINT.ThenChange(target.ts)
`;
  const templates = ["//LINT.?"];
  const tokens = lex(content, { templates });

  assertEquals(tokens.length, 2);
  assertEquals(tokens[0].directive, Directive.IfChange);
  assertEquals(tokens[0].args, ["my_label"]);
  assertEquals(tokens[1].directive, Directive.ThenChange);
  assertEquals(tokens[1].args, ["target.ts"]);
});

Deno.test("lex handles multiple templates", () => {
  const content = `
//LINT.IfChange
#LINT.IfChange
`;
  const templates = ["//LINT.?", "#LINT.?"];
  const tokens = lex(content, { templates });

  assertEquals(tokens.length, 2);
  assertEquals(tokens[0].directive, Directive.IfChange);
  assertEquals(tokens[1].directive, Directive.IfChange);
});

Deno.test("lex handles ThenChange with multiple targets", () => {
  const content = `
//LINT.IfChange
code
//LINT.ThenChange(a.ts, b.ts:ID, :C)
`;
  const templates = ["//LINT.?"];
  const tokens = lex(content, { templates });

  assertEquals(tokens.length, 2);
  assertEquals(tokens[1].directive, Directive.ThenChange);
  assertEquals(tokens[1].args, ["a.ts", "b.ts:ID", ":C"]);
});
