/**
 * DefaultTemplates is the default list of directive templates.
 */
export const DefaultTemplates: string[] = [
  "#LINT.?",
  "//LINT.?",
  "/*LINT.?",
  "<!--LINT.?",
  "'LINT.?",
];

/**
 * DefaultFileExtMap is the default map of file extensions to directive template indices.
 */
export const DefaultFileExtMap: Record<string, number[]> = {
  "py": [0],
  "sh": [0],
  "go": [1],
  "js": [1, 2],
  "jsx": [1, 2],
  "mjs": [1, 2],
  "ts": [1, 2],
  "tsx": [1, 2],
  "jsonc": [1, 2],
  "c": [1, 2],
  "cc": [1, 2],
  "cpp": [1, 2],
  "h": [1, 2],
  "hpp": [1, 2],
  "java": [1],
  "rs": [1],
  "swift": [1],
  "svelte": [1, 2, 3],
  "css": [2],
  "html": [3],
  "md": [3],
  "markdown": [3],
  "bas": [4],
};

/**
 * ExtMap represents the extensions and templates for a linting operation.
 */
export class ExtMap {
  public templates: string[];
  public fileExtMap: Record<string, number[]>;

  constructor(
    customMap?: Record<string, string[]>,
    templates = DefaultTemplates,
    fileExtMap = DefaultFileExtMap,
  ) {
    this.templates = [...templates];
    this.fileExtMap = { ...fileExtMap };

    if (customMap) {
      for (const [ext, tpls] of Object.entries(customMap)) {
        tpls.forEach((tpl) => this.add(ext, tpl));
      }
    }
  }

  /**
   * add adds a directive template for a file extension.
   */
  private add(ext: string, tpl: string) {
    let tplIndex = this.templates.indexOf(tpl);

    if (tplIndex === -1) {
      tplIndex = this.templates.length;
      this.templates.push(tpl);
    }

    if (!this.fileExtMap[ext]) {
      this.fileExtMap[ext] = [];
    }

    if (!this.fileExtMap[ext].includes(tplIndex)) {
      this.fileExtMap[ext].push(tplIndex);
    }
  }

  /**
   * getTemplatesForFile returns the directive templates for the given file path.
   */
  public getTemplatesForFile(filePath: string): string[] {
    const ext = filePath.split(".").pop() || "";
    // If we have a mapping for this extension, use it.
    // BUT only if the indices are within bounds of our current templates.
    const indices = this.fileExtMap[ext];
    if (indices) {
      const result = indices
        .map((i) => this.templates[i])
        .filter((t): t is string => !!t);
      if (result.length > 0) return result;
    }

    // Default to the first template if nothing else matches or indices were invalid.
    return this.templates.length > 0 ? [this.templates[0]] : [];
  }
}
