import type { Node, Edge } from "@xyflow/react";
import type { CallsData, ArchData } from "@/lib/types";
import { applyDagreLayout } from "@/lib/layout/dagre-layout";

export interface FunctionNodeData {
  label: string;
  file: string;
  function: string;
  callCount: number;
  isEntry?: boolean;
  isLeaf?: boolean;
}

export interface FileGroupNodeData {
  label: string;
  file: string;
  functionCount: number;
}

// Check if a file is a test file
export function isTestFile(path: string): boolean {
  return path.includes(".test.") || path.includes(".spec.") || path.includes("__tests__");
}

export interface TransformOptions {
  hideTests?: boolean;
  archData?: ArchData | null;
  selectedEntryPoint?: string | null; // Filter to show only call chain from this entry point
}

export function transformCallsToGraph(
  data: CallsData,
  options: TransformOptions = {}
): {
  nodes: Node[];
  edges: Edge[];
} {
  const { hideTests = false, archData = null, selectedEntryPoint = null } = options;

  // Build sets of entry and leaf functions for quick lookup
  const entryFunctions = new Set<string>();
  const leafFunctions = new Set<string>();

  if (archData) {
    for (const entry of archData.entry_layer) {
      entryFunctions.add(`${entry.file}::${entry.function}`);
    }
    for (const leaf of archData.leaf_layer) {
      leafFunctions.add(`${leaf.file}::${leaf.function}`);
    }
  }

  // Filter edges based on hideTests
  let filteredEdges = hideTests
    ? data.edges.filter(
        (e) => !isTestFile(e.from_file) && !isTestFile(e.to_file)
      )
    : data.edges;

  // Filter to show only call chain from selected entry point
  if (selectedEntryPoint) {
    const reachable = new Set<string>([selectedEntryPoint]);
    let changed = true;

    // Build adjacency for BFS
    const adjacency = new Map<string, string[]>();
    for (const edge of filteredEdges) {
      const sourceId = `${edge.from_file}::${edge.from_func}`;
      const targetId = `${edge.to_file}::${edge.to_func}`;
      if (!adjacency.has(sourceId)) adjacency.set(sourceId, []);
      adjacency.get(sourceId)!.push(targetId);
    }

    // BFS to find all reachable functions
    while (changed) {
      changed = false;
      for (const node of reachable) {
        const neighbors = adjacency.get(node) || [];
        for (const neighbor of neighbors) {
          if (!reachable.has(neighbor)) {
            reachable.add(neighbor);
            changed = true;
          }
        }
      }
    }

    // Filter edges to only those within reachable set
    filteredEdges = filteredEdges.filter((e) => {
      const sourceId = `${e.from_file}::${e.from_func}`;
      const targetId = `${e.to_file}::${e.to_func}`;
      return reachable.has(sourceId) && reachable.has(targetId);
    });
  }

  const fileMap = new Map<string, Set<string>>();
  const functionCallCounts = new Map<string, number>();

  // Collect all unique files and functions from filtered edges
  for (const edge of filteredEdges) {
    // From
    if (!fileMap.has(edge.from_file)) {
      fileMap.set(edge.from_file, new Set());
    }
    fileMap.get(edge.from_file)!.add(edge.from_func);

    // To
    if (!fileMap.has(edge.to_file)) {
      fileMap.set(edge.to_file, new Set());
    }
    fileMap.get(edge.to_file)!.add(edge.to_func);

    // Count incoming calls
    const toKey = `${edge.to_file}::${edge.to_func}`;
    functionCallCounts.set(toKey, (functionCallCounts.get(toKey) || 0) + 1);
  }

  let nodes: Node[] = [];
  let edges: Edge[] = [];

  // Create function nodes (positions will be computed by Dagre)
  for (const [file, functions] of fileMap) {
    for (const func of functions) {
      const nodeId = `${file}::${func}`;
      const callCount = functionCallCounts.get(nodeId) || 0;
      const isEntry = entryFunctions.has(nodeId);
      const isLeaf = leafFunctions.has(nodeId);

      nodes.push({
        id: nodeId,
        type: "functionNode",
        position: { x: 0, y: 0 }, // Will be computed by Dagre
        data: {
          label: func,
          file: file,
          function: func,
          callCount,
          isEntry,
          isLeaf,
        } satisfies FunctionNodeData,
      });
    }
  }

  // Create edges (deduplicated)
  const edgeSet = new Set<string>();

  for (const edge of filteredEdges) {
    const sourceId = `${edge.from_file}::${edge.from_func}`;
    const targetId = `${edge.to_file}::${edge.to_func}`;
    const edgeKey = `${sourceId}->${targetId}`;

    if (!edgeSet.has(edgeKey)) {
      edgeSet.add(edgeKey);
      edges.push({
        id: edgeKey,
        source: sourceId,
        target: targetId,
        animated: true,
        style: { stroke: "#60a5fa", strokeWidth: 2 },
      });
    }
  }

  // Apply Dagre layout to compute optimal positions
  if (nodes.length > 0) {
    const layouted = applyDagreLayout(nodes, edges, {
      direction: "TB", // Top to bottom flow
      nodeWidth: 200,
      nodeHeight: 60,
      rankSep: 80, // Space between layers
      nodeSep: 40, // Space between nodes in same layer
    });
    nodes = layouted.nodes;
    edges = layouted.edges;
  }

  return { nodes, edges };
}

// Get max call count for heat map normalization
export function getMaxCallCount(data: CallsData): number {
  const counts = new Map<string, number>();
  for (const edge of data.edges) {
    const key = `${edge.to_file}::${edge.to_func}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Math.max(...Array.from(counts.values()), 1);
}

// Get color based on call count (heat map)
export function getHeatColor(count: number, max: number): string {
  const intensity = count / max;
  // From cyan to orange/red
  if (intensity < 0.33) {
    return `oklch(0.75 0.12 185)`; // Cyan
  } else if (intensity < 0.66) {
    return `oklch(0.75 0.15 90)`; // Yellow
  } else {
    return `oklch(0.65 0.20 30)`; // Orange/red
  }
}
