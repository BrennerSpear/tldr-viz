import type { Node, Edge } from "@xyflow/react";
import type { StructureData } from "@/lib/types";
import { isTestFile } from "./calls-to-graph";
import { applyDagreLayout } from "@/lib/layout/dagre-layout";

export interface StructureTransformOptions {
  hideTests?: boolean;
}

export interface FileNodeData {
  label: string;
  path: string;
  functions: string[];
  classes: string[];
  imports: number;
  isIsolated?: boolean; // No imports to/from other files in codebase
  isExpanded?: boolean;
}

// Get filename from path
function getFilename(path: string): string {
  return path.split("/").pop() || path;
}

// Get parent folder name
function getParentFolder(path: string): string {
  const parts = path.split("/");
  if (parts.length < 2) return "";
  return parts[parts.length - 2];
}

// Extract the import path from a module string like:
// '{ foo } from "./path/to/file"' -> './path/to/file'
// or '"./path/to/file"' -> './path/to/file'
function extractImportPath(moduleStr: string): string | null {
  // Try to match 'from "path"' or "from 'path'"
  const fromMatch = moduleStr.match(/from\s+["']([^"']+)["']/);
  if (fromMatch) {
    return fromMatch[1];
  }
  // Try to match just a quoted path (for side-effect imports)
  const directMatch = moduleStr.match(/^["']([^"']+)["']$/);
  if (directMatch) {
    return directMatch[1];
  }
  return null;
}

// Normalize a path by removing leading ./ and resolving relative parts
function normalizePath(importPath: string): string {
  return importPath
    .replace(/^\.\//, "") // Remove leading ./
    .replace(/\.(ts|tsx|js|jsx)$/, ""); // Remove extension
}

export function transformStructureToGraph(
  data: StructureData,
  options: StructureTransformOptions = {}
): {
  nodes: Node[];
  edges: Edge[];
} {
  const { hideTests = false } = options;

  // Filter files based on hideTests and remove empty barrel files
  const filteredFiles = data.files.filter((f) => {
    // Filter test files if hideTests is enabled
    if (hideTests && isTestFile(f.path)) return false;

    // Filter empty barrel files (index files with no imports, functions, or classes)
    const filename = getFilename(f.path);
    const isIndexFile = /^index\.(ts|tsx|js|jsx)$/.test(filename);
    const isEmpty = f.imports.length === 0 && f.functions.length === 0 && f.classes.length === 0;
    if (isIndexFile && isEmpty) return false;

    return true;
  });

  // Detect duplicate filenames
  const filenameCount = new Map<string, number>();
  for (const file of filteredFiles) {
    const name = getFilename(file.path);
    filenameCount.set(name, (filenameCount.get(name) || 0) + 1);
  }

  // Build a map from normalized paths to file paths for quick lookup
  const normalizedToFile = new Map<string, string>();
  for (const file of filteredFiles) {
    const normalized = normalizePath(file.path);
    normalizedToFile.set(normalized, file.path);
    // Also add just the filename without extension for matching
    const filenameNoExt = getFilename(file.path).replace(/\.(ts|tsx|js|jsx)$/, "");
    // Don't overwrite if already exists (prefer full path)
    if (!normalizedToFile.has(filenameNoExt)) {
      normalizedToFile.set(filenameNoExt, file.path);
    }
  }

  // Create edges first to determine which files are connected
  let edges: Edge[] = [];
  const edgeSet = new Set<string>();
  const connectedFiles = new Set<string>();

  for (const file of filteredFiles) {
    const fileDir = file.path.includes("/")
      ? file.path.split("/").slice(0, -1).join("/")
      : "";

    for (const imp of file.imports) {
      const importPath = extractImportPath(imp.module);
      if (!importPath) continue;

      // Skip external packages (not starting with . or not containing /)
      if (!importPath.startsWith(".") && !importPath.startsWith("/")) continue;

      // Resolve the import path relative to the importing file
      let resolvedPath = importPath;
      if (importPath.startsWith("./") || importPath.startsWith("../")) {
        // Relative import - resolve from file's directory
        const parts = fileDir.split("/").filter(Boolean);
        const importParts = importPath.split("/");

        for (const part of importParts) {
          if (part === ".") continue;
          if (part === "..") {
            parts.pop();
          } else {
            parts.push(part);
          }
        }
        resolvedPath = parts.join("/");
      } else if (importPath.startsWith("/")) {
        resolvedPath = importPath.slice(1); // Remove leading /
      }

      // Normalize and try to find the target file
      const normalized = normalizePath(resolvedPath);

      // Try exact match first
      let targetPath = normalizedToFile.get(normalized);

      // Try with /index if not found
      if (!targetPath) {
        targetPath = normalizedToFile.get(normalized + "/index");
      }

      // Try just the last segment
      if (!targetPath) {
        const lastSegment = normalized.split("/").pop() || "";
        targetPath = normalizedToFile.get(lastSegment);
      }

      if (targetPath && targetPath !== file.path) {
        const edgeKey = `${file.path}->${targetPath}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            id: edgeKey,
            source: file.path,
            target: targetPath,
            style: { stroke: "#94a3b8", strokeWidth: 2 },
          });
          connectedFiles.add(file.path);
          connectedFiles.add(targetPath);
        }
      }
    }
  }

  // Create nodes
  let nodes: Node[] = [];

  for (const file of filteredFiles) {
    const filename = getFilename(file.path);
    const isDuplicate = (filenameCount.get(filename) || 0) > 1;
    const isIsolated = !connectedFiles.has(file.path);

    // Build label with parent folder if duplicate
    let label = filename;
    if (isDuplicate) {
      const parent = getParentFolder(file.path);
      if (parent) {
        label = `${parent}/${filename}`;
      }
    }

    nodes.push({
      id: file.path,
      type: "fileNode",
      position: { x: 0, y: 0 }, // Will be computed by Dagre
      data: {
        label,
        path: file.path,
        functions: file.functions,
        classes: file.classes,
        imports: file.imports.length,
        isIsolated,
      } satisfies FileNodeData,
    });
  }

  // Apply Dagre layout for hierarchical view
  // Files that import others are "above" them (entry points at top)
  if (nodes.length > 0) {
    const layouted = applyDagreLayout(nodes, edges, {
      direction: "TB", // Top to bottom - importers above imported
      nodeWidth: 180,
      nodeHeight: 50,
      rankSep: 80,
      nodeSep: 30,
    });
    nodes = layouted.nodes;
    edges = layouted.edges;
  }

  return { nodes, edges };
}

export function getStructureStats(data: StructureData) {
  let totalFunctions = 0;
  let totalClasses = 0;
  let totalImports = 0;

  for (const file of data.files) {
    totalFunctions += file.functions.length;
    totalClasses += file.classes.length;
    totalImports += file.imports.length;
  }

  return {
    totalFiles: data.files.length,
    totalFunctions,
    totalClasses,
    totalImports,
    languages: data.languages,
  };
}
