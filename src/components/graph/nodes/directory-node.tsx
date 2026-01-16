"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { DirectoryNodeData } from "@/lib/transformers/arch-to-graph";
import { Badge } from "@/components/ui/badge";
import { IconFolder, IconArrowUp, IconArrowDown } from "@tabler/icons-react";

interface DirectoryNodeProps {
  data: DirectoryNodeData;
  selected?: boolean;
}

function DirectoryNodeComponent({ data, selected }: DirectoryNodeProps) {
  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 min-w-[200px] bg-card/80 backdrop-blur
        ${selected ? "border-primary ring-2 ring-primary/30" : "border-border"}
        transition-all duration-150
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />

      <div className="flex items-center gap-2">
        <IconFolder size={18} className="text-muted-foreground" />
        <span className="font-mono text-sm font-semibold">
          {data.label}
        </span>
      </div>

      <div className="text-xs text-muted-foreground mt-1 truncate">
        {data.directory}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Badge variant="outline" className="text-xs gap-1">
          <IconArrowUp size={12} />
          {data.callsOut} out
        </Badge>
        <Badge variant="outline" className="text-xs gap-1">
          <IconArrowDown size={12} />
          {data.callsIn} in
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {data.functionCount} fn
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground/80 mt-2">
        {data.inferredLayer}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
}

export const DirectoryNode = memo(DirectoryNodeComponent);
