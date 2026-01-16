// Types for tldr CLI output

export interface Import {
  module: string;
  names: string[];
  is_from: boolean;
}

export interface FileInfo {
  path: string;
  functions: string[];
  classes: string[];
  methods: string[];
  imports: Import[];
}

export interface StructureData {
  root: string;
  languages: string[];
  files: FileInfo[];
}

export interface CallEdge {
  from_file: string;
  from_func: string;
  to_file: string;
  to_func: string;
}

export interface CallsData {
  edges: CallEdge[];
}

export interface LayerFunction {
  file: string;
  function: string;
}

export interface DirectoryLayer {
  directory: string;
  calls_out: number;
  calls_in: number;
  inferred_layer: string;
  function_count: number;
}

export interface ArchData {
  entry_layer: LayerFunction[];
  leaf_layer: LayerFunction[];
  middle_layer_count: number;
  directory_layers: DirectoryLayer[];
  circular_dependencies: unknown[];
  summary: {
    entry_count: number;
    leaf_count: number;
    middle_count: number;
    circular_count: number;
  };
}

export type ViewType = "structure" | "calls" | "arch";
