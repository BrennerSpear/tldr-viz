"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useGraphStore } from "@/stores/graph-store";
import { transformCallsToGraph } from "@/lib/transformers/calls-to-graph";
import { transformStructureToGraph } from "@/lib/transformers/structure-to-graph";
import { transformArchToGraph } from "@/lib/transformers/arch-to-graph";
import { FunctionNode, FileNode, DirectoryNode } from "./nodes";

const nodeTypes = {
  functionNode: FunctionNode,
  fileNode: FileNode,
  directoryNode: DirectoryNode,
};

export function GraphCanvas() {
  const {
    activeView,
    structureData,
    callsData,
    archData,
    selectNode,
    selectedNodeId,
    hideTests,
    selectedEntryPoint,
  } = useGraphStore();

  // Transform data based on active view
  const { initialNodes, initialEdges } = useMemo(() => {
    let nodes: Node[] = [];
    let edges: Edge[] = [];

    if (activeView === "calls" && callsData) {
      const result = transformCallsToGraph(callsData, {
        hideTests,
        archData,
        selectedEntryPoint,
      });
      nodes = result.nodes;
      edges = result.edges;
    } else if (activeView === "structure" && structureData) {
      const result = transformStructureToGraph(structureData, { hideTests });
      nodes = result.nodes;
      edges = result.edges;
    } else if (activeView === "arch" && archData) {
      const result = transformArchToGraph(archData);
      nodes = result.nodes;
      edges = result.edges;
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [activeView, structureData, callsData, archData, hideTests, selectedEntryPoint]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  if (!structureData && !callsData && !archData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Load data to see visualization
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background color="#333" gap={20} />
        <Controls />
        <MiniMap
          nodeStrokeColor="#666"
          nodeColor={(node) => {
            if (node.id === selectedNodeId) return "#60a5fa";
            return "#333";
          }}
        />
      </ReactFlow>
    </div>
  );
}
