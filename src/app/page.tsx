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
  IconSparkles,
  IconLoader2,
} from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { StructureData, CallsData, ArchData, ViewType, ClassificationsData, EntryPointClassification } from "@/lib/types";

interface EntryPointsListProps {
  classifications: EntryPointClassification[];
  selectedEntryPoint: string | null;
  setSelectedEntryPoint: (entryPoint: string | null) => void;
  showOnlyUserFacing: boolean;
  setShowOnlyUserFacing: (show: boolean) => void;
}

function EntryPointsList({
  classifications,
  selectedEntryPoint,
  setSelectedEntryPoint,
  showOnlyUserFacing,
  setShowOnlyUserFacing,
}: EntryPointsListProps) {
  const userFacing = classifications.filter((c) => c.isUserFacing);
  const notUserFacing = classifications.filter((c) => !c.isUserFacing);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          User-facing ({userFacing.length})
        </Label>
        <Switch
          id="user-facing"
          checked={showOnlyUserFacing}
          onCheckedChange={setShowOnlyUserFacing}
        />
      </div>

      {/* User-facing entries */}
      <div className="space-y-1 max-h-48 overflow-auto">
        {userFacing.map((c) => {
          const key = `${c.file}::${c.function}`;
          const isSelected = selectedEntryPoint === key;
          return (
            <button
              type="button"
              key={key}
              onClick={() => setSelectedEntryPoint(isSelected ? null : key)}
              className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-1">
                <IconPlayerPlay size={12} className={isSelected ? "" : "text-green-600"} />
                <span className="font-medium">{c.function}</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                  {c.type}
                </Badge>
              </div>
              <p className="text-[10px] opacity-70 mt-0.5 line-clamp-1">
                {c.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Non-user-facing entries (collapsed by default) */}
      {!showOnlyUserFacing && notUserFacing.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground py-1">
            Other entries ({notUserFacing.length})
          </summary>
          <div className="space-y-1 mt-1 max-h-32 overflow-auto">
            {notUserFacing.map((c) => {
              const key = `${c.file}::${c.function}`;
              const isSelected = selectedEntryPoint === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedEntryPoint(isSelected ? null : key)}
                  className={`w-full text-left p-1.5 rounded text-[10px] transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="font-medium">{c.function}</span>
                  <span className="text-muted-foreground ml-1">({c.type})</span>
                </button>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}

interface SelectedEntryPointCardProps {
  classification: EntryPointClassification;
  onClear: () => void;
}

function SelectedEntryPointCard({ classification, onClear }: SelectedEntryPointCardProps) {
  return (
    <Card className="bg-muted/50 border-primary/50">
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{classification.function}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onClear}
          >
            Clear
          </Button>
        </div>
        <p className="text-xs">{classification.description}</p>
        {classification.userAction && (
          <p className="text-xs text-muted-foreground italic">
            {classification.userAction}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground truncate">
          {classification.file}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const {
    activeView,
    setActiveView,
    structureData,
    callsData,
    archData,
    classificationsData,
    setStructureData,
    setCallsData,
    setArchData,
    setClassificationsData,
    hideTests,
    setHideTests,
    selectedEntryPoint,
    setSelectedEntryPoint,
    showOnlyUserFacing,
    setShowOnlyUserFacing,
    isAnalyzing,
    setIsAnalyzing,
    analysisError,
    setAnalysisError,
    hideUtilities,
    setHideUtilities,
    utilityThreshold,
    setUtilityThreshold,
  } = useGraphStore();

  // Load demo data on mount
  useEffect(() => {
    async function loadDemoData() {
      try {
        const [structureRes, callsRes, archRes, classificationsRes] = await Promise.all([
          fetch("/data/clarity/structure.json"),
          fetch("/data/clarity/calls.json"),
          fetch("/data/clarity/arch.json"),
          fetch("/data/clarity/classifications.json"),
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
        if (classificationsRes.ok) {
          const data = (await classificationsRes.json()) as ClassificationsData;
          setClassificationsData(data);
        }
      } catch (e) {
        console.log("Demo data not available, use file upload");
      }
    }

    loadDemoData();
  }, [setStructureData, setCallsData, setArchData, setClassificationsData]);

  // Analyze entry points with LLM
  const analyzeEntryPoints = useCallback(async () => {
    if (!archData || !callsData) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/classify-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: archData.entry_layer,
          calls: callsData.edges,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const data = await response.json();
      const newClassificationsData: ClassificationsData = {
        classifications: data.classifications,
        analyzedAt: new Date().toISOString(),
      };
      setClassificationsData(newClassificationsData);

      // Save to file for persistence (non-critical, just log errors)
      fetch("/api/save-classifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClassificationsData),
      }).catch((err) => {
        console.error("Failed to save classifications:", err);
      });
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, [archData, callsData, setClassificationsData, setIsAnalyzing, setAnalysisError]);

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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hide-utilities" className="text-sm">
                Hide utilities
              </Label>
              <Switch
                id="hide-utilities"
                checked={hideUtilities}
                onCheckedChange={setHideUtilities}
              />
            </div>
            {hideUtilities && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Called by &gt;</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={utilityThreshold}
                  onChange={(e) => setUtilityThreshold(Number(e.target.value))}
                  className="w-14 h-7 px-2 rounded border border-border bg-background text-center text-sm"
                />
              </div>
            )}
          </div>

          {archData && archData.entry_layer.length > 0 && (
            <div className="space-y-3">
              {/* Analyze Entry Points Button */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={analyzeEntryPoints}
                  disabled={isAnalyzing || !archData || !callsData}
                >
                  {isAnalyzing ? (
                    <>
                      <IconLoader2 size={14} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <IconSparkles size={14} />
                      {classificationsData ? "Re-analyze" : "Analyze Entry Points"}
                    </>
                  )}
                </Button>
                {analysisError && (
                  <p className="text-xs text-destructive">{analysisError}</p>
                )}
                {classificationsData && (
                  <p className="text-xs text-muted-foreground">
                    Analyzed {classificationsData.classifications.length} entries
                  </p>
                )}
              </div>

              {/* User-facing entry points list */}
              {classificationsData && (
                <EntryPointsList
                  classifications={classificationsData.classifications}
                  selectedEntryPoint={selectedEntryPoint}
                  setSelectedEntryPoint={setSelectedEntryPoint}
                  showOnlyUserFacing={showOnlyUserFacing}
                  setShowOnlyUserFacing={setShowOnlyUserFacing}
                />
              )}

              {/* Show selected entry point details */}
              {selectedEntryPoint && classificationsData && (() => {
                const classification = classificationsData.classifications.find(
                  (c) => `${c.file}::${c.function}` === selectedEntryPoint
                );
                if (!classification) return null;
                return (
                  <SelectedEntryPointCard
                    classification={classification}
                    onClear={() => setSelectedEntryPoint(null)}
                  />
                );
              })()}
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
