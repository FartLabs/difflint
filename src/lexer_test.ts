import { assertEquals } from "@std/assert";
import { Directive, lex } from "./lexer.ts";

Deno.test("lex extracts tokens correctly", () => {
  const content = `
// first line
//LINT.IF main.go:ID
func main() {
}
//LINT.END ID
`;
  const templates = ["//LINT.?"];
  const tokens = lex(content, { templates });

  assertEquals(tokens.length, 2);
  assertEquals(tokens[0].directive, Directive.IF);
  assertEquals(tokens[0].args, ["main.go:ID"]);
  assertEquals(tokens[0].line, 3);
  assertEquals(tokens[1].directive, Directive.END);
  assertEquals(tokens[1].args, ["ID"]);
  assertEquals(tokens[1].line, 6);
});

Deno.test("lex handles multiple templates", () => {
  const content = `
//LINT.IF target1
#LINT.IF target2
`;
  const templates = ["//LINT.?", "#LINT.?"];
  const tokens = lex(content, { templates });

  assertEquals(tokens.length, 2);
  assertEquals(tokens[0].directive, Directive.IF);
  assertEquals(tokens[0].args, ["target1"]);
  assertEquals(tokens[1].directive, Directive.IF);
  assertEquals(tokens[1].args, ["target2"]);
});
