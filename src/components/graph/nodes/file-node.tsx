"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { FileNodeData } from "@/lib/transformers/structure-to-graph";
import { Badge } from "@/components/ui/badge";
import { IconFile, IconCode, IconBoxModel, IconUnlink } from "@tabler/icons-react";

interface FileNodeProps {
  data: FileNodeData;
  selected?: boolean;
}

function FileNodeComponent({ data, selected }: FileNodeProps) {
  const hasFunctions = data.functions.length > 0;
  const hasClasses = data.classes.length > 0;
  const isIsolated = data.isIsolated;

  return (
    <div
      className={`
        px-3 py-2 rounded-lg border-2 min-w-[180px] bg-card
        ${selected ? "border-primary ring-2 ring-primary/30" : isIsolated ? "border-dashed border-muted-foreground/50" : "border-border"}
        ${isIsolated ? "opacity-70" : ""}
        transition-all duration-150
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />

      <div className="flex items-center gap-2">
        <IconFile size={16} className="text-muted-foreground" />
        <span className="font-mono text-sm font-medium truncate">
          {data.label}
        </span>
        {isIsolated && (
          <span title="Isolated: not imported by or importing any other files in the codebase">
            <IconUnlink size={14} className="text-muted-foreground/70" />
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        {hasFunctions && (
          <Badge variant="outline" className="text-xs gap-1">
            <IconCode size={12} />
            {data.functions.length}
          </Badge>
        )}
        {hasClasses && (
          <Badge variant="outline" className="text-xs gap-1">
            <IconBoxModel size={12} />
            {data.classes.length}
          </Badge>
        )}
        {data.imports > 0 && (
          <Badge variant="secondary" className="text-xs">
            {data.imports} imports
          </Badge>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
}

export const FileNode = memo(FileNodeComponent);
