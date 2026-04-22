import { assertEquals, assertThrows } from "@std/assert";
import { Directive, type Token } from "./lexer.ts";
import {
  parseRules,
  parseTargets,
  rangesIntersect,
  targetKey,
} from "./rules.ts";

// --- rangesIntersect ---

Deno.test("rangesIntersect returns true for overlapping ranges", () => {
  assertEquals(
    rangesIntersect({ start: 1, end: 5 }, { start: 3, end: 7 }),
    true,
  );
});

Deno.test("rangesIntersect returns true for identical ranges", () => {
  assertEquals(
    rangesIntersect({ start: 1, end: 5 }, { start: 1, end: 5 }),
    true,
  );
});

Deno.test("rangesIntersect returns true for contained ranges", () => {
  assertEquals(
    rangesIntersect({ start: 1, end: 10 }, { start: 3, end: 5 }),
    true,
  );
});

Deno.test("rangesIntersect returns true for touching ranges", () => {
  assertEquals(
    rangesIntersect({ start: 1, end: 3 }, { start: 3, end: 5 }),
    true,
  );
});

Deno.test("rangesIntersect returns false for disjoint ranges", () => {
  assertEquals(
    rangesIntersect({ start: 1, end: 3 }, { start: 4, end: 6 }),
    false,
  );
});

Deno.test("rangesIntersect is commutative", () => {
  const a = { start: 1, end: 3 };
  const b = { start: 5, end: 7 };
  assertEquals(rangesIntersect(a, b), rangesIntersect(b, a));
});

// --- parseTargets ---

Deno.test("parseTargets parses file-only target", () => {
  const targets = parseTargets(["main.ts"]);
  assertEquals(targets, [{ file: "main.ts" }]);
});

Deno.test("parseTargets parses file:id target", () => {
  const targets = parseTargets(["main.ts:MyID"]);
  assertEquals(targets, [{ file: "main.ts", id: "MyID" }]);
});

Deno.test("parseTargets parses id-only target", () => {
  const targets = parseTargets([":MyID"]);
  assertEquals(targets, [{ id: "MyID" }]);
});

Deno.test("parseTargets parses multiple targets", () => {
  const targets = parseTargets(["a.ts", "b.ts:ID", ":C"]);
  assertEquals(targets, [
    { file: "a.ts" },
    { file: "b.ts", id: "ID" },
    { id: "C" },
  ]);
});

Deno.test("parseTargets handles empty args list", () => {
  assertEquals(parseTargets([]), []);
});

// --- parseRules ---

Deno.test("parseRules parses a simple IfChange/ThenChange pair", () => {
  const tokens: Token[] = [
    { directive: Directive.IfChange, args: [], line: 2 },
    { directive: Directive.ThenChange, args: ["target.ts"], line: 5 },
  ];
  const rules = parseRules("main.ts", tokens, []);
  assertEquals(rules.length, 1);
  assertEquals(rules[0].hunk.file, "main.ts");
  assertEquals(rules[0].hunk.range, { start: 2, end: 5 });
  assertEquals(rules[0].targets, [{ file: "target.ts" }]);
  assertEquals(rules[0].present, false);
});

Deno.test("parseRules captures label from IfChange", () => {
  const tokens: Token[] = [
    { directive: Directive.IfChange, args: ["MyRuleID"], line: 2 },
    { directive: Directive.ThenChange, args: ["target.ts"], line: 5 },
  ];
  const rules = parseRules("main.ts", tokens, []);
  assertEquals(rules[0].id, "MyRuleID");
});

Deno.test("parseRules sets present to true when range overlaps diff", () => {
  const tokens: Token[] = [
    { directive: Directive.IfChange, args: [], line: 2 },
    { directive: Directive.ThenChange, args: ["target.ts"], line: 5 },
  ];
  const ranges = [{ start: 3, end: 4 }];
  const rules = parseRules("main.ts", tokens, ranges);
  assertEquals(rules[0].present, true);
});

Deno.test("parseRules sets present to false when range does not overlap", () => {
  const tokens: Token[] = [
    { directive: Directive.IfChange, args: [], line: 2 },
    { directive: Directive.ThenChange, args: ["target.ts"], line: 5 },
  ];
  const ranges = [{ start: 10, end: 20 }];
  const rules = parseRules("main.ts", tokens, ranges);
  assertEquals(rules[0].present, false);
});

Deno.test("parseRules parses multiple rule pairs", () => {
  const tokens: Token[] = [
    { directive: Directive.IfChange, args: [], line: 1 },
    { directive: Directive.ThenChange, args: ["a.ts"], line: 3 },
    { directive: Directive.IfChange, args: [], line: 5 },
    { directive: Directive.ThenChange, args: ["b.ts"], line: 7 },
  ];
  const rules = parseRules("main.ts", tokens, []);
  assertEquals(rules.length, 2);
  assertEquals(rules[0].targets, [{ file: "a.ts" }]);
  assertEquals(rules[1].targets, [{ file: "b.ts" }]);
});

Deno.test("parseRules throws on nested IfChange directives", () => {
  const tokens: Token[] = [
    { directive: Directive.IfChange, args: [], line: 1 },
    { directive: Directive.IfChange, args: [], line: 3 },
  ];
  assertThrows(
    () => parseRules("main.ts", tokens, []),
    Error,
    "unexpected IfChange directive at main.ts:3",
  );
});

Deno.test("parseRules throws on ThenChange without IfChange", () => {
  const tokens: Token[] = [
    { directive: Directive.ThenChange, args: [], line: 5 },
  ];
  assertThrows(
    () => parseRules("main.ts", tokens, []),
    Error,
    "unexpected ThenChange directive at main.ts:5",
  );
});

Deno.test("parseRules returns empty for no tokens", () => {
  assertEquals(parseRules("main.ts", [], []), []);
});

// --- targetKey ---

Deno.test("targetKey returns pathname when target has no file or id", () => {
  const result = targetKey("src/main.ts", {});
  assertEquals(result, "src\\main.ts");
});

Deno.test("targetKey uses target file when specified", () => {
  const result = targetKey("src/main.ts", { file: "lib/utils.ts" });
  assertEquals(result, "lib\\utils.ts");
});

Deno.test("targetKey appends id", () => {
  const result = targetKey("src/main.ts", { id: "MyID" });
  assertEquals(result, "src\\main.ts:MyID");
});

Deno.test("targetKey uses file and id together", () => {
  const result = targetKey("src/main.ts", { file: "lib/utils.ts", id: "Fn" });
  assertEquals(result, "lib\\utils.ts:Fn");
});

Deno.test("targetKey resolves relative paths", () => {
  const result = targetKey("src/main.ts", { file: "./utils.ts" });
  assertEquals(result, "src\\utils.ts");
});

Deno.test("targetKey resolves parent-relative paths", () => {
  const result = targetKey("src/linter/rules.ts", { file: "../config/mod.ts" });
  assertEquals(result, "src\\config\\mod.ts");
});
