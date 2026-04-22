import { TextLineStream } from "@std/streams/text-line-stream";

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
 * Hunk represents a diff hunk that must be present in the diff.
 */
export interface Hunk {
  /** File specifier of the defined range. */
  file: string;
  /** Range of code in which a diff hunk intersects. */
  range: Range;
}

/**
 * parseHunks parses a unified diff and returns the extracted file paths
 * along with associated line number ranges.
 *
 * @param reader The readable stream of the unified diff.
 * @returns A promise that resolves to an array of Hunks.
 */
export async function parseHunks(
  reader: ReadableStream<Uint8Array>,
): Promise<Hunk[]> {
  const lineStream = reader
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  const hunks: Hunk[] = [];
  let currentFile = "";

  for await (const line of lineStream) {
    // Look for the target file name (e.g., +++ b/main.ts)
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice(6);
      continue;
    }

    // Look for the hunk header (e.g., @@ -1,1 +1,1 @@)
    if (line.startsWith("@@ ") && currentFile) {
      const match = line.match(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,(\d+))?\s+@@/);
      if (match) {
        const start = parseInt(match[1], 10);
        const count = match[2] ? parseInt(match[2], 10) : 1;

        hunks.push({
          file: currentFile,
          range: {
            start,
            end: start + count - 1,
          },
        });
      }
    }
  }

  return hunks;
}
