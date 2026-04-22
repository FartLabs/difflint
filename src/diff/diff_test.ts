import { assertEquals } from "@std/assert";
import { parseHunks } from "./mod.ts";

Deno.test("parseHunks extracts correct information from unified diff", async () => {
  const diffString = `
diff --git a/main.ts b/main.ts
index 1234567..890abcd 100644
--- a/main.ts
+++ b/main.ts
@@ -1,3 +1,4 @@
 export function add(a: number, b: number): number {
+  console.log("adding", a, b);
   return a + b;
 }
diff --git a/README.md b/README.md
index abcdef..123456 100644
--- a/README.md
+++ b/README.md
@@ -10,2 +10,3 @@
-This is an old line.
+This is a new line.
+More content.
  Existing context.
`;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(diffString));
      controller.close();
    },
  });

  const hunks = await parseHunks(stream);

  assertEquals(hunks.length, 2);
  assertEquals(hunks[0].file, "main.ts");
  assertEquals(hunks[0].range, { start: 1, end: 4 });
  assertEquals(hunks[1].file, "README.md");
  assertEquals(hunks[1].range, { start: 10, end: 12 });
});

Deno.test("parseHunks handles omitted counts", async () => {
  const diffString = `
--- a/test.ts
+++ b/test.ts
@@ -1 +1 @@
-old
+new
`;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(diffString));
      controller.close();
    },
  });

  const hunks = await parseHunks(stream);
  assertEquals(hunks[0].range, { start: 1, end: 1 });
});
