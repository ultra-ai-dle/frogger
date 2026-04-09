"use client";

import { BranchLines, MergedTraceStep } from "@/types/prova";

type Props = {
  steps: MergedTraceStep[];
  branchLines: BranchLines;
  currentStep: number;
  isRunning: boolean;
  isPlaying: boolean;
  speed: number;
  onStepChange: (step: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
};

export function TimelineControls({
  steps,
  branchLines,
  currentStep,
  isRunning,
  isPlaying,
  speed,
  onStepChange,
  onTogglePlay,
  onSpeedChange
}: Props) {
  const disabled = isRunning || steps.length === 0;

  return (
    <section className="h-12 border-t border-prova-line grid grid-cols-[1fr_auto] items-center gap-3 px-3">
      <div className="dot-scrollbar flex items-center gap-1 overflow-x-auto">
        {steps.length === 0 && <span className="text-xs text-prova-muted">빈 타임라인</span>}
        {steps.map((step, index) => {
          const isLoop = branchLines.loop.includes(step.line);
          const isBranch = branchLines.branch.includes(step.line);
          const base = step.runtimeError
            ? "bg-prova-red w-3 h-3"
            : isLoop
              ? "bg-prova-blue"
              : isBranch
                ? "bg-prova-purple rotate-45 rounded-[1px]"
                : "bg-prova-line";
          const current = index === currentStep ? "w-3 h-3 bg-white" : "w-2 h-2";
          return (
            <button
              key={`${step.step}-${step.line}`}
              className={`${base} ${current} rounded-full shrink-0`}
              onClick={() => onStepChange(index)}
              aria-label={`step-${index + 1}`}
              disabled={disabled}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-1">
        <button
          className="h-7 px-2 rounded border border-prova-line bg-[#21262d] disabled:opacity-40"
          onClick={() => onStepChange(currentStep - 1)}
          disabled={disabled}
        >
          ◀
        </button>
        <button
          className="h-7 px-2 rounded border border-prova-line bg-[#21262d] disabled:opacity-40"
          onClick={() => onStepChange(currentStep + 1)}
          disabled={disabled}
        >
          ▶
        </button>
        <button
          className="h-7 px-2 rounded border border-prova-line bg-[#21262d] disabled:opacity-40"
          onClick={onTogglePlay}
          disabled={disabled}
        >
          {isPlaying ? "⏸" : "▷"}
        </button>
        <select
          className="h-7 rounded border border-prova-line bg-[#21262d] px-1"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          disabled={disabled}
        >
          <option value={0.5}>×0.5</option>
          <option value={1}>×1</option>
          <option value={1.5}>×1.5</option>
          <option value={2}>×2</option>
        </select>
      </div>
    </section>
  );
}
