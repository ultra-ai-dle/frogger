"use client";

import { MergedTraceStep } from "@/types/prova";
import { ThreeDVolumePanel } from "@/features/visualization/ThreeDVolumePanel";

type Props = {
  step: MergedTraceStep | null;
  fallback: boolean;
  previousStep: MergedTraceStep | null;
  strategy?: "GRID" | "LINEAR" | "GRID_LINEAR" | "GRAPH";
  bitmaskMode?: boolean;
  bitWidth?: number;
};

function is2DArray(value: unknown): value is unknown[][] {
  return Array.isArray(value) && Array.isArray(value[0]);
}

function isScalar(value: unknown) {
  return value == null || ["number", "string", "boolean"].includes(typeof value);
}

function isScalar2DArray(value: unknown): value is unknown[][] {
  return is2DArray(value) && (value as unknown[][]).every((row) => row.every((cell) => isScalar(cell)));
}

function isScalar3DArray(value: unknown): value is unknown[][][] {
  return Array.isArray(value)
    && Array.isArray(value[0])
    && Array.isArray((value as unknown[][][])[0]?.[0])
    && (value as unknown[][][]).every(
      (plane) => Array.isArray(plane) && plane.every((row) => Array.isArray(row) && row.every((cell) => isScalar(cell)))
    );
}

function getFirst3DVar(step: MergedTraceStep) {
  const entries = Object.entries(step.vars);
  const dpFirst = entries.find(([name, value]) => /dp/i.test(name) && isScalar3DArray(value));
  if (dpFirst) return { name: dpFirst[0], value: dpFirst[1] as unknown[][][] };
  const entry = entries.find(([, value]) => isScalar3DArray(value));
  return entry ? { name: entry[0], value: entry[1] as unknown[][][] } : null;
}

function getFirst2DVar(step: MergedTraceStep) {
  const entries = Object.entries(step.vars);
  // Prefer grid-like 2D arrays with scalar cells (dp/visited/board).
  const scalarEntry = entries.find(([, value]) => isScalar2DArray(value));
  if (scalarEntry) return { name: scalarEntry[0], value: scalarEntry[1] as unknown[][] };
  const entry = entries.find(([, value]) => is2DArray(value));
  return entry ? { name: entry[0], value: entry[1] as unknown[][] } : null;
}

function getFirstLinearVar(step: MergedTraceStep) {
  const entry = Object.entries(step.vars).find(([, value]) => Array.isArray(value) && !Array.isArray(value[0]));
  return entry ? { name: entry[0], value: entry[1] as unknown[] } : null;
}

function toCells(step: MergedTraceStep, grid: unknown[][], previousGrid?: unknown[][] | null) {
  return grid.flatMap((row, y) =>
    row.map((value, x) => {
      const isCurrent = typeof step.vars.r === "number" && typeof step.vars.c === "number"
        ? step.vars.r === y && step.vars.c === x
        : false;
      const prevValue = previousGrid?.[y]?.[x];
      const changed = previousGrid ? JSON.stringify(prevValue) !== JSON.stringify(value) : false;
      return { value, isCurrent, changed };
    }),
  );
}

function formatCellValue(value: unknown, bitmaskMode = false, bitWidth = 1) {
  if (value == null) return "";
  if (typeof value === "number") {
    if (bitmaskMode && Number.isInteger(value) && value >= 0) {
      return `${value.toString(2).padStart(Math.max(1, bitWidth), "0")}`;
    }
    return String(value);
  }
  if (typeof value === "boolean") return String(value);
  if (typeof value === "string") return value.length > 8 ? `${value.slice(0, 8)}…` : value;
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === "object") return "{...}";
  return String(value);
}

const GridIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-[#30363d]"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

export function GridLinearPanel({ step, fallback, previousStep, strategy, bitmaskMode = false, bitWidth = 1 }: Props) {
  if (!step) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-4">
        <GridIcon />
        <div>
          <p className="text-sm text-[#c9d1d9] mb-2 font-medium">
            Visualization will appear here after execution
          </p>
          <p className="text-xs text-prova-muted leading-relaxed">
            Automatically detects <span className="text-[#58a6ff]">BFS</span>,{" "}
            <span className="text-[#58a6ff]">DFS</span>,{" "}
            <span className="text-[#58a6ff]">Stacks</span>,{" "}
            <span className="text-[#58a6ff]">Queues</span>, and Grid traversals.
          </p>
        </div>
      </div>
    );
  }

  if (fallback) {
    const vars = Object.entries(step.vars);
    return (
      <div className="h-full overflow-auto p-4 text-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-prova-muted uppercase tracking-widest">
            Variable State
          </span>
          <span className="text-[10px] text-prova-muted font-mono">
            — Step {step.step + 1}
          </span>
        </div>
        <div className="space-y-[2px]">
          {vars.map(([key, value]) => {
            const changed =
              previousStep &&
              JSON.stringify(previousStep.vars[key]) !== JSON.stringify(value);
            return (
              <div
                key={key}
                className={`grid grid-cols-[1fr_2fr] gap-3 border-b border-[#1c2128] px-2 py-[5px] rounded transition-colors ${
                  changed ? "bg-[#3d2b00]/40" : "hover:bg-[#161b22]"
                }`}
              >
                <span
                  className={`font-mono truncate ${changed ? "text-[#e3b341]" : "text-prova-muted"}`}
                >
                  {key}
                </span>
                <span className="font-mono text-[#c9d1d9] truncate">
                  {JSON.stringify(value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const gridVar = getFirst2DVar(step);
  const previousGridVar = previousStep ? getFirst2DVar(previousStep) : null;
  const grid3DVar = getFirst3DVar(step);
  const prev3DVar = previousStep ? getFirst3DVar(previousStep) : null;
  const focusIndex = typeof step.vars.nk === "number"
    ? step.vars.nk
    : (typeof step.vars.k === "number" ? step.vars.k : 0);
  const linearVar = getFirstLinearVar(step);
  const shouldRender3D = strategy !== "LINEAR" && strategy !== "GRAPH" && !!grid3DVar;
  const shouldRenderGrid = !shouldRender3D && strategy !== "LINEAR" && strategy !== "GRAPH" && !!gridVar;
  const cells = shouldRenderGrid
    ? toCells(
      step,
      gridVar.value,
      previousGridVar && previousGridVar.name === gridVar?.name ? previousGridVar.value : null
    )
    : [];
  const queue = linearVar?.value ?? [];
  const hasError = !!step.runtimeError;

  if (!shouldRenderGrid && !shouldRender3D && !linearVar) {
    const vars = Object.entries(step.vars);
    return (
      <div className="h-full overflow-auto p-4 text-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-prova-muted uppercase tracking-widest">
            Variable State
          </span>
          <span className="text-[10px] text-prova-muted font-mono">
            — Step {step.step + 1}
          </span>
        </div>
        <div className="space-y-[2px]">
          {vars.map(([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-[1fr_2fr] gap-3 border-b border-[#1c2128] px-2 py-[5px] rounded"
            >
              <span className="font-mono truncate text-prova-muted">{key}</span>
              <span className="font-mono text-[#c9d1d9] truncate">{JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 3D Slice Grid */}
      {shouldRender3D && grid3DVar && (
        <ThreeDVolumePanel
          name={grid3DVar.name}
          volume={grid3DVar.value}
          prevVolume={prev3DVar && prev3DVar.name === grid3DVar.name ? prev3DVar.value : null}
          focusIndex={focusIndex}
          bitmaskMode={bitmaskMode}
          bitWidth={bitWidth}
        />
      )}

      {/* Grid */}
      {shouldRenderGrid && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="inline-grid gap-[5px]">
            <div
              className="grid gap-[5px]"
              style={{ gridTemplateColumns: `26px repeat(${(gridVar?.value?.[0] ?? []).length || 1}, 40px)` }}
            >
              <div />
              {Array.from({ length: (gridVar?.value?.[0] ?? []).length || 0 }, (_, c) => (
                <div key={`col-${c}`} className="text-[10px] text-prova-muted text-center font-mono">
                  c{c}
                </div>
              ))}
              {Array.from({ length: gridVar?.value?.length || 0 }, (_, r) => (
                <div key={`row-wrap-${r}`} className="contents">
                  <div className="text-[10px] text-prova-muted text-right pr-1 font-mono self-center">r{r}</div>
                  {Array.from({ length: (gridVar?.value?.[0] ?? []).length || 0 }, (_, c) => {
                    const idx = r * ((gridVar?.value?.[0] ?? []).length || 1) + c;
                    const cell = cells[idx];
                    if (!cell) return <div key={`cell-empty-${r}-${c}`} className="w-10 h-10" />;
                    return (
                      <div
                        key={`cell-${r}-${c}`}
                        className={`w-10 h-10 rounded-md border grid place-items-center text-sm font-bold transition-all duration-200 ${
                          hasError && cell.isCurrent
                            ? "border-prova-red bg-[#3d0b0b] text-prova-red"
                            : cell.isCurrent
                              ? "border-prova-green bg-[#0d4429] text-prova-green"
                              : cell.changed
                                ? "border-[#388bfd] bg-[#1f3555]/70 text-[#9ac7ff]"
                                : "border-[#21262d] bg-[#161b22] text-[#c9d1d9]"
                        }`}
                      >
                        {cell.isCurrent && !hasError ? "→" : formatCellValue(cell.value, bitmaskMode, bitWidth)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error label */}
      {hasError && step.runtimeError && (
        <div className="shrink-0 mx-4 mb-2 px-3 py-2 rounded border border-prova-red/40 bg-[#2d1112]/60 text-xs flex items-center gap-2">
          <span className="text-prova-red font-bold">✕</span>
          <span className="text-[#fca5a5]">
            {typeof step.runtimeError === "string"
              ? step.runtimeError
              : "Runtime error occurred"}
          </span>
        </div>
      )}

      {/* Queue display */}
      {!hasError && linearVar && (
        <div className="shrink-0 border-t border-prova-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-prova-muted uppercase tracking-widest shrink-0">
              {linearVar.name}
            </span>
            <span className="text-[10px] text-prova-muted font-mono shrink-0">
              {queue.length > 0
                ? `${queue.length} item${queue.length > 1 ? "s" : ""}`
                : "empty"}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 overflow-x-auto dot-scrollbar pb-1">
            {queue.length === 0 && (
              <span className="text-[11px] text-prova-muted italic">
                Queue is empty
              </span>
            )}
            {queue.map((item, i) => (
              <span
                key={`${JSON.stringify(item)}-${i}`}
                className={`shrink-0 inline-flex items-center rounded border px-2 py-[3px] text-[11px] font-mono transition-all ${
                  i === 0
                    ? "border-prova-green/60 bg-[#0d4429]/60 text-prova-green"
                    : "border-[#388bfd]/40 bg-[#1f3555]/60 text-[#79c0ff]"
                }`}
              >
                {typeof item === "number" && bitmaskMode && Number.isInteger(item) && item >= 0
                  ? item.toString(2).padStart(Math.max(1, bitWidth), "0")
                  : typeof item === "object"
                    ? JSON.stringify(item)
                    : String(item)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
