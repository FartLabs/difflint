import { assertEquals } from "@std/assert";
import {
  DefaultFileExtensionMap,
  DefaultTemplates,
  ExtensionMap,
} from "./extension_map.ts";

// --- DefaultTemplates ---

Deno.test("DefaultTemplates contains expected templates", () => {
  assertEquals(DefaultTemplates.length, 5);
  assertEquals(DefaultTemplates[0], "#LINT.?");
  assertEquals(DefaultTemplates[1], "//LINT.?");
});

// --- DefaultFileExtensionMap ---

Deno.test("DefaultFileExtensionMap maps ts to line and block comment templates", () => {
  assertEquals(DefaultFileExtensionMap["ts"], [1, 2]);
});

Deno.test("DefaultFileExtensionMap maps py to hash comment template", () => {
  assertEquals(DefaultFileExtensionMap["py"], [0]);
});

Deno.test("DefaultFileExtensionMap maps html to HTML comment template", () => {
  assertEquals(DefaultFileExtensionMap["html"], [3]);
});

// --- ExtensionMap constructor ---

Deno.test("ExtensionMap uses defaults when constructed without arguments", () => {
  const extensionMap = new ExtensionMap();
  assertEquals(extensionMap.templates, DefaultTemplates);
  assertEquals(extensionMap.fileExtensionMap["ts"], [1, 2]);
});

Deno.test("ExtensionMap accepts custom templates and file extension map", () => {
  const extensionMap = new ExtensionMap(
    undefined,
    ["#CUSTOM.?"],
    { "txt": [0] },
  );
  assertEquals(extensionMap.templates, ["#CUSTOM.?"]);
  assertEquals(extensionMap.fileExtensionMap["txt"], [0]);
});

Deno.test("ExtensionMap merges custom map with existing templates", () => {
  const extensionMap = new ExtensionMap({
    "xyz": ["//LINT.?"],
  });
  // "//LINT.?" is already at index 1 in DefaultTemplates
  assertEquals(extensionMap.fileExtensionMap["xyz"], [1]);
});

Deno.test("ExtensionMap adds new template when custom map uses unknown template", () => {
  const extensionMap = new ExtensionMap({
    "custom": ["%%LINT.?"],
  });
  const newIndex = extensionMap.templates.indexOf("%%LINT.?");
  assertEquals(newIndex, DefaultTemplates.length);
  assertEquals(extensionMap.fileExtensionMap["custom"], [newIndex]);
});

Deno.test("ExtensionMap does not duplicate template indices", () => {
  const extensionMap = new ExtensionMap({
    "ts": ["//LINT.?", "//LINT.?"],
  });
  // "//LINT.?" is index 1, ts already has [1, 2], adding 1 again should not duplicate
  const indices = extensionMap.fileExtensionMap["ts"];
  const uniqueIndices = [...new Set(indices)];
  assertEquals(indices.length, uniqueIndices.length);
});

// --- getTemplatesForFile ---

Deno.test("getTemplatesForFile returns correct templates for .ts files", () => {
  const extensionMap = new ExtensionMap();
  const templates = extensionMap.getTemplatesForFile("main.ts");
  assertEquals(templates, ["//LINT.?", "/*LINT.?"]);
});

Deno.test("getTemplatesForFile returns correct templates for .py files", () => {
  const extensionMap = new ExtensionMap();
  const templates = extensionMap.getTemplatesForFile("script.py");
  assertEquals(templates, ["#LINT.?"]);
});

Deno.test("getTemplatesForFile returns correct templates for .html files", () => {
  const extensionMap = new ExtensionMap();
  const templates = extensionMap.getTemplatesForFile("index.html");
  assertEquals(templates, ["<!--LINT.?"]);
});

Deno.test("getTemplatesForFile falls back to first template for unknown extension", () => {
  const extensionMap = new ExtensionMap();
  const templates = extensionMap.getTemplatesForFile("data.unknown");
  assertEquals(templates, ["#LINT.?"]);
});

Deno.test("getTemplatesForFile handles file paths with directories", () => {
  const extensionMap = new ExtensionMap();
  const templates = extensionMap.getTemplatesForFile("src/lib/utils.go");
  assertEquals(templates, ["//LINT.?"]);
});

Deno.test("getTemplatesForFile returns empty array when no templates exist", () => {
  const extensionMap = new ExtensionMap(undefined, [], {});
  const templates = extensionMap.getTemplatesForFile("main.ts");
  assertEquals(templates, []);
});
