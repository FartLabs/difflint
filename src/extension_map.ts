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
 * DefaultFileExtensionMap is the default map of file extensions to directive template indices.
 */
export const DefaultFileExtensionMap: Record<string, number[]> = {
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
 * ExtensionMap represents the extensions and templates for a linting operation.
 */
export class ExtensionMap {
  public templates: string[];
  public fileExtensionMap: Record<string, number[]>;

  constructor(
    customMap?: Record<string, string[]>,
    templates = DefaultTemplates,
    fileExtensionMap = DefaultFileExtensionMap,
  ) {
    this.templates = [...templates];
    this.fileExtensionMap = { ...fileExtensionMap };

    if (customMap) {
      for (const [extension, templates] of Object.entries(customMap)) {
        templates.forEach((template) => this.add(extension, template));
      }
    }
  }

  /**
   * add adds a directive template for a file extension.
   */
  private add(extension: string, template: string) {
    let templateIndex = this.templates.indexOf(template);

    if (templateIndex === -1) {
      templateIndex = this.templates.length;
      this.templates.push(template);
    }

    if (!this.fileExtensionMap[extension]) {
      this.fileExtensionMap[extension] = [];
    }

    if (!this.fileExtensionMap[extension].includes(templateIndex)) {
      this.fileExtensionMap[extension].push(templateIndex);
    }
  }

  /**
   * getTemplatesForFile returns the directive templates for the given file path.
   */
  public getTemplatesForFile(filePath: string): string[] {
    const extension = filePath.split(".").pop() || "";
    // If we have a mapping for this extension, use it.
    // BUT only if the indices are within bounds of our current templates.
    const indices = this.fileExtensionMap[extension];
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
