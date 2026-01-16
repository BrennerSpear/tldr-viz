"use client";

import { create } from "zustand";
import type { StructureData, CallsData, ArchData, ViewType, ClassificationsData } from "@/lib/types";

interface GraphStore {
  // Data
  structureData: StructureData | null;
  callsData: CallsData | null;
  archData: ArchData | null;
  classificationsData: ClassificationsData | null;

  // View state
  activeView: ViewType;
  selectedNodeId: string | null;
  expandedFiles: Set<string>;
  searchQuery: string;

  // Filters
  hideTests: boolean;
  selectedEntryPoint: string | null; // Filter to show only calls from this entry point
  showOnlyUserFacing: boolean; // Filter to show only user-facing entry points

  // Analysis state
  isAnalyzing: boolean;
  analysisError: string | null;

  // Actions
  setStructureData: (data: StructureData) => void;
  setCallsData: (data: CallsData) => void;
  setArchData: (data: ArchData) => void;
  setClassificationsData: (data: ClassificationsData | null) => void;
  setActiveView: (view: ViewType) => void;
  selectNode: (id: string | null) => void;
  toggleFileExpanded: (fileId: string) => void;
  setSearchQuery: (query: string) => void;
  setHideTests: (hide: boolean) => void;
  setSelectedEntryPoint: (entryPoint: string | null) => void;
  setShowOnlyUserFacing: (show: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisError: (error: string | null) => void;
  clearData: () => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  // Initial state
  structureData: null,
  callsData: null,
  archData: null,
  classificationsData: null,
  activeView: "calls",
  selectedNodeId: null,
  expandedFiles: new Set(),
  searchQuery: "",
  hideTests: true, // Hide test files by default
  selectedEntryPoint: null,
  showOnlyUserFacing: false,
  isAnalyzing: false,
  analysisError: null,

  // Actions
  setStructureData: (data) => set({ structureData: data }),
  setCallsData: (data) => set({ callsData: data }),
  setArchData: (data) => set({ archData: data }),
  setClassificationsData: (data) => set({ classificationsData: data }),
  setActiveView: (view) => set({ activeView: view, selectedNodeId: null }),
  selectNode: (id) => set({ selectedNodeId: id }),
  toggleFileExpanded: (fileId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFiles);
      if (newExpanded.has(fileId)) {
        newExpanded.delete(fileId);
      } else {
        newExpanded.add(fileId);
      }
      return { expandedFiles: newExpanded };
    }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setHideTests: (hide) => set({ hideTests: hide }),
  setSelectedEntryPoint: (entryPoint) => set({ selectedEntryPoint: entryPoint }),
  setShowOnlyUserFacing: (show) => set({ showOnlyUserFacing: show }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setAnalysisError: (error) => set({ analysisError: error }),
  clearData: () =>
    set({
      structureData: null,
      callsData: null,
      archData: null,
      classificationsData: null,
      selectedNodeId: null,
      expandedFiles: new Set(),
      selectedEntryPoint: null,
    }),
}));
