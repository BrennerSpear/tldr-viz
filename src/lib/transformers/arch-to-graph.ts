import type { Node, Edge } from "@xyflow/react";
import type { ArchData, DirectoryLayer } from "@/lib/types";

export interface DirectoryNodeData {
  label: string;
  directory: string;
  callsOut: number;
  callsIn: number;
  inferredLayer: string;
  functionCount: number;
}

type LayerType = "HIGH" | "MIDDLE" | "LOW";

function getLayerType(inferredLayer: string): LayerType {
  if (inferredLayer.includes("HIGH")) return "HIGH";
  if (inferredLayer.includes("MIDDLE")) return "MIDDLE";
  return "LOW";
}

function getLayerColor(layer: LayerType): string {
  switch (layer) {
    case "HIGH":
      return "oklch(0.75 0.12 185)"; // Cyan - entry/controller
    case "MIDDLE":
      return "oklch(0.75 0.12 140)"; // Teal - service
    case "LOW":
      return "oklch(0.75 0.10 280)"; // Purple - utility/data
  }
}

export function transformArchToGraph(data: ArchData): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];

  // Group directories by layer
  const layers: Record<LayerType, DirectoryLayer[]> = {
    HIGH: [],
    MIDDLE: [],
    LOW: [],
  };

  for (const dir of data.directory_layers) {
    const layer = getLayerType(dir.inferred_layer);
    layers[layer].push(dir);
  }

  // Position nodes in horizontal layers
  const layerYPositions: Record<LayerType, number> = {
    HIGH: 0,
    MIDDLE: 200,
    LOW: 400,
  };

  // Create nodes for each layer
  for (const [layer, dirs] of Object.entries(layers) as [LayerType, DirectoryLayer[]][]) {
    const y = layerYPositions[layer];
    const totalWidth = dirs.length * 280;
    const startX = -totalWidth / 2;

    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      const x = startX + i * 280;

      nodes.push({
        id: dir.directory,
        type: "directoryNode",
        position: { x, y },
        data: {
          label: dir.directory === "." ? "root" : dir.directory.split("/").pop() || dir.directory,
          directory: dir.directory,
          callsOut: dir.calls_out,
          callsIn: dir.calls_in,
          inferredLayer: dir.inferred_layer,
          functionCount: dir.function_count,
        } satisfies DirectoryNodeData,
        style: {
          background: getLayerColor(layer),
        },
      });
    }
  }

  // No edges for arch view - it shows layers only
  return { nodes, edges: [] };
}

export function getArchStats(data: ArchData) {
  return {
    entryFunctions: data.entry_layer.length,
    leafFunctions: data.leaf_layer.length,
    middleFunctions: data.middle_layer_count,
    totalDirectories: data.directory_layers.length,
    circularDeps: data.circular_dependencies.length,
  };
}
