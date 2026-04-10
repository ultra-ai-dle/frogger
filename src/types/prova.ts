export type PyodideStatus =
  | "loading"
  | "ready"
  | "running"
  | "reinitializing"
  | "error";

export type TraceErrorType = "TIMEOUT" | "NETWORK" | "RUNTIME";

export interface TraceError {
  type: TraceErrorType;
  message: string;
}

export interface ScopeInfo {
  func: string;
  depth: number;
}

export interface ParentFrame {
  scope: ScopeInfo;
  vars: Record<string, unknown>;
}

export interface RuntimeErrorInfo {
  type: string;
  message: string;
  line: number;
}

export interface RawTraceStep {
  step: number;
  line: number;
  vars: Record<string, unknown>;
  scope: ScopeInfo;
  parent_frames: ParentFrame[];
  stdout?: string[];
  runtimeError: RuntimeErrorInfo | null;
}

export interface AiErrorInfo {
  root_cause: string;
  fix_hint: string;
}

export interface AnnotatedStep {
  explanation: string;
  visual_actions: string[];
  aiError: AiErrorInfo | null;
}

export interface MergedTraceStep extends RawTraceStep, AnnotatedStep {}

export interface BranchLines {
  loop: number[];
  branch: number[];
}

export interface AnalyzeMetadata {
  algorithm: string;
  display_name: string;
  strategy: "GRID" | "LINEAR" | "GRID_LINEAR" | "GRAPH";
  tags: string[];
  detected_data_structures?: string[];
  detected_algorithms?: string[];
  summary?: string;
  graph_mode?: "directed" | "undirected";
  graph_var_name?: string;
  graph_representation?: "GRID" | "MAP";
  uses_bitmasking?: boolean;
  /** AI 추정 최악 시간 복잡도 (예: O(V+E), O(n log n)) */
  time_complexity?: string;
  key_vars: string[];
  var_mapping: Record<string, { var_name: string; panel: "GRID" | "LINEAR" | "GRAPH" | "VARIABLES" }>;
}

export interface WorkerDonePayload {
  rawTrace: RawTraceStep[];
  branchLines: BranchLines;
  varTypes: Record<string, string>;
}

export interface PlaybackState {
  currentStep: number;
  isPlaying: boolean;
  playbackSpeed: number;
}
