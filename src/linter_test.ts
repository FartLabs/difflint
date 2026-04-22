import { assertEquals } from "@std/assert";
import { lint } from "./linter.ts";
import * as path from "@std/path";

Deno.test("lint integration test", async () => {
  const tempDir = await Deno.makeTempDir();
  const originalCwd = Deno.cwd();
  Deno.chdir(tempDir);

  try {
    // Setup files
    const file1 = "main.ts";
    // This rule says: if target.ts (ID range) changes, this range must also change.
    const content1 = `
//LINT.IF target.ts:ID
some code
//LINT.END ID
`;
    await Deno.writeTextFile(file1, content1);

    const file2 = "target.ts";
    // This defines the ID range level
    const content2 = `
//LINT.IF
some other code
//LINT.END ID
`;
    await Deno.writeTextFile(file2, content2);

    // Mock diff (changing target.ts:ID but not main.ts)
    const diffString = `
--- a/target.ts
+++ b/target.ts
@@ -1,4 +1,5 @@
 //LINT.IF
+// changed line
 some other code
 //LINT.END ID
`;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(diffString));
        controller.close();
      },
    });

    // Run lint
    const result = await lint(stream, { templates: ["//LINT.?"] });

    // Expected: main.ts has an unsatisfied rule because target.ts:ID was modified but main.ts wasn't.
    assertEquals(result.unsatisfiedRules.length, 1);
    assertEquals(
      path.basename(result.unsatisfiedRules[0].rule.hunk.file),
      "main.ts",
    );
    assertEquals(result.unsatisfiedRules[0].unsatisfiedTargets.size, 1);
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});
