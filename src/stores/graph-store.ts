"use client";

import { create } from "zustand";
import type { StructureData, CallsData, ArchData, ViewType } from "@/lib/types";

interface GraphStore {
  // Data
  structureData: StructureData | null;
  callsData: CallsData | null;
  archData: ArchData | null;

  // View state
  activeView: ViewType;
  selectedNodeId: string | null;
  expandedFiles: Set<string>;
  searchQuery: string;

  // Filters
  hideTests: boolean;
  selectedEntryPoint: string | null; // Filter to show only calls from this entry point

  // Actions
  setStructureData: (data: StructureData) => void;
  setCallsData: (data: CallsData) => void;
  setArchData: (data: ArchData) => void;
  setActiveView: (view: ViewType) => void;
  selectNode: (id: string | null) => void;
  toggleFileExpanded: (fileId: string) => void;
  setSearchQuery: (query: string) => void;
  setHideTests: (hide: boolean) => void;
  setSelectedEntryPoint: (entryPoint: string | null) => void;
  clearData: () => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  // Initial state
  structureData: null,
  callsData: null,
  archData: null,
  activeView: "calls",
  selectedNodeId: null,
  expandedFiles: new Set(),
  searchQuery: "",
  hideTests: true, // Hide test files by default
  selectedEntryPoint: null,

  // Actions
  setStructureData: (data) => set({ structureData: data }),
  setCallsData: (data) => set({ callsData: data }),
  setArchData: (data) => set({ archData: data }),
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
  clearData: () =>
    set({
      structureData: null,
      callsData: null,
      archData: null,
      selectedNodeId: null,
      expandedFiles: new Set(),
      selectedEntryPoint: null,
    }),
}));
