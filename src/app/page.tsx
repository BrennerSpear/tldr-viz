"use client";

import { useCallback, useEffect } from "react";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { useGraphStore } from "@/stores/graph-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconUpload,
  IconCode,
  IconArrowsSplit,
  IconStack2,
  IconPlayerPlay,
  IconLeaf,
} from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { StructureData, CallsData, ArchData, ViewType } from "@/lib/types";

export default function Home() {
  const {
    activeView,
    setActiveView,
    structureData,
    callsData,
    archData,
    setStructureData,
    setCallsData,
    setArchData,
    hideTests,
    setHideTests,
    selectedEntryPoint,
    setSelectedEntryPoint,
  } = useGraphStore();

  // Load demo data on mount
  useEffect(() => {
    async function loadDemoData() {
      try {
        const [structureRes, callsRes, archRes] = await Promise.all([
          fetch("/data/clarity/structure.json"),
          fetch("/data/clarity/calls.json"),
          fetch("/data/clarity/arch.json"),
        ]);

        if (structureRes.ok) {
          const data = (await structureRes.json()) as StructureData;
          setStructureData(data);
        }
        if (callsRes.ok) {
          const data = (await callsRes.json()) as CallsData;
          setCallsData(data);
        }
        if (archRes.ok) {
          const data = (await archRes.json()) as ArchData;
          setArchData(data);
        }
      } catch (e) {
        console.log("Demo data not available, use file upload");
      }
    }

    loadDemoData();
  }, [setStructureData, setCallsData, setArchData]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      for (const file of Array.from(files)) {
        const text = await file.text();
        const data = JSON.parse(text);

        if (file.name.includes("structure")) {
          setStructureData(data as StructureData);
        } else if (file.name.includes("calls")) {
          setCallsData(data as CallsData);
        } else if (file.name.includes("arch")) {
          setArchData(data as ArchData);
        }
      }
    },
    [setStructureData, setCallsData, setArchData]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer.files;

      for (const file of Array.from(files)) {
        const text = await file.text();
        const data = JSON.parse(text);

        if (file.name.includes("structure")) {
          setStructureData(data as StructureData);
        } else if (file.name.includes("calls")) {
          setCallsData(data as CallsData);
        } else if (file.name.includes("arch")) {
          setArchData(data as ArchData);
        }
      }
    },
    [setStructureData, setCallsData, setArchData]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div
      className="flex h-screen bg-background"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Sidebar */}
      <aside className="w-72 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold">tldr-viz</h1>
          <p className="text-sm text-muted-foreground">
            Codebase visualization
          </p>
        </div>

        {/* View Selector */}
        <div className="p-4">
          <Tabs
            value={activeView}
            onValueChange={(v) => setActiveView(v as ViewType)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="calls" className="flex-1 gap-1">
                <IconArrowsSplit size={14} />
                Calls
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex-1 gap-1">
                <IconCode size={14} />
                Structure
              </TabsTrigger>
              <TabsTrigger value="arch" className="flex-1 gap-1">
                <IconStack2 size={14} />
                Arch
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Separator />

        {/* Filters */}
        <div className="p-4 space-y-4">
          <h3 className="font-semibold mb-3">Filters</h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="hide-tests" className="text-sm">
              Hide test files
            </Label>
            <Switch
              id="hide-tests"
              checked={hideTests}
              onCheckedChange={setHideTests}
            />
          </div>

          {archData && archData.entry_layer.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="entry-point" className="text-sm">Entry point flow</Label>
              <select
                id="entry-point"
                value={selectedEntryPoint || "all"}
                onChange={(e) => setSelectedEntryPoint(e.target.value === "all" ? null : e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Show all functions</option>
                {archData.entry_layer.map((entry) => {
                  const key = `${entry.file}::${entry.function}`;
                  return (
                    <option key={key} value={key}>
                      {entry.function}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-muted-foreground">
                Filter to show only calls from an entry point
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Legend */}
        <div className="p-4">
          <h3 className="font-semibold mb-3">Legend</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "oklch(0.75 0.12 185)" }} />
              <span className="text-muted-foreground">Few incoming calls</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "oklch(0.75 0.15 90)" }} />
              <span className="text-muted-foreground">Medium calls</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "oklch(0.65 0.20 30)" }} />
              <span className="text-muted-foreground">Many incoming calls</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <IconPlayerPlay size={14} className="text-green-600" />
              <span className="text-muted-foreground">Entry point</span>
            </div>
            <div className="flex items-center gap-2">
              <IconLeaf size={14} className="text-purple-600" />
              <span className="text-muted-foreground">Leaf function</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div className="p-4 flex-1 overflow-auto">
          <h3 className="font-semibold mb-3">Statistics</h3>

          {callsData && (
            <Card className="mb-3">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Call Graph</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="text-2xl font-bold">{callsData.edges.length}</div>
                <div className="text-xs text-muted-foreground">function calls</div>
              </CardContent>
            </Card>
          )}

          {structureData && (
            <Card className="mb-3">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Structure</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {structureData.files.length}
                  </span>
                  <span className="text-xs text-muted-foreground">files</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {structureData.languages.map((lang) => (
                    <Badge key={lang} variant="secondary">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {archData && (
            <Card className="mb-3">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Architecture</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold">
                      {archData.summary.entry_count}
                    </div>
                    <div className="text-xs text-muted-foreground">Entry</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {archData.summary.middle_count}
                    </div>
                    <div className="text-xs text-muted-foreground">Middle</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {archData.summary.leaf_count}
                    </div>
                    <div className="text-xs text-muted-foreground">Leaf</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* File Upload */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <IconUpload size={16} />
            Upload JSON files
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".json"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Drop files or click to upload
          </p>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1">
        <GraphCanvas />
      </main>
    </div>
  );
}
