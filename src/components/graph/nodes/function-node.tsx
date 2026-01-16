"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { FunctionNodeData } from "@/lib/transformers/calls-to-graph";
import { getHeatColor } from "@/lib/transformers/calls-to-graph";
import { Badge } from "@/components/ui/badge";
import { IconPlayerPlay, IconLeaf } from "@tabler/icons-react";

interface FunctionNodeProps {
  data: FunctionNodeData;
  selected?: boolean;
}

function FunctionNodeComponent({ data, selected }: FunctionNodeProps) {
  const bgColor = getHeatColor(data.callCount, 10);

  // Entry points get a green left border, leaf functions get purple
  const borderClass = data.isEntry
    ? "border-l-4 border-l-green-500"
    : data.isLeaf
    ? "border-l-4 border-l-purple-500"
    : "";

  return (
    <div
      className={`
        px-3 py-2 rounded-md border-2 min-w-[140px]
        ${selected ? "border-primary ring-2 ring-primary/30" : "border-border"}
        ${borderClass}
        transition-all duration-150
      `}
      style={{ backgroundColor: bgColor }}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {data.isEntry && (
            <IconPlayerPlay size={12} className="text-green-600 shrink-0" />
          )}
          {data.isLeaf && (
            <IconLeaf size={12} className="text-purple-600 shrink-0" />
          )}
          <span className="font-mono text-sm font-medium truncate text-foreground">
            {data.label}
          </span>
        </div>
        {data.callCount > 0 && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {data.callCount}
          </Badge>
        )}
      </div>

      <div className="text-xs text-muted-foreground truncate mt-1">
        {data.file.split("/").pop()}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
}

export const FunctionNode = memo(FunctionNodeComponent);
