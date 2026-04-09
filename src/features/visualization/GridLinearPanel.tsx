"use client";

import { MergedTraceStep } from "@/types/prova";

type Props = {
  step: MergedTraceStep | null;
  fallback: boolean;
  previousStep: MergedTraceStep | null;
};

function toCells(step: MergedTraceStep) {
  const visited = (step.vars.visited as boolean[][] | undefined) ?? [];
  return visited.flatMap((row, y) =>
    row.map((value, x) => {
      const isCurrent = step.vars.r === y && step.vars.c === x;
      const isWall = (x === 1 && y === 0) || (x === 2 && y === 3);
      return { value, isCurrent, isWall };
    })
  );
}

export function GridLinearPanel({ step, fallback, previousStep }: Props) {
  if (!step) {
    return (
      <div className="h-full grid place-items-center text-prova-muted text-center px-8">
        <div>
          <div className="text-3xl mb-2">▦</div>
          <p className="text-lg text-white mb-1">코드를 실행하면 시각화가 여기에 표시됩니다</p>
          <p className="text-sm">BFS, DFS, 스택, 큐 등을 자동 감지합니다.</p>
        </div>
      </div>
    );
  }

  if (fallback) {
    const vars = Object.entries(step.vars);
    return (
      <div className="h-full overflow-auto p-4 text-sm">
        <p className="text-prova-muted mb-3">
          📋 변수 상태 — Step {step.step + 1}
        </p>
        <div className="space-y-1">
          {vars.map(([key, value]) => {
            const changed = previousStep && JSON.stringify(previousStep.vars[key]) !== JSON.stringify(value);
            return (
              <div
                key={key}
                className={`grid grid-cols-[1fr_2fr] gap-3 border-b border-[#232a33] p-2 ${
                  changed ? "bg-[#3d2b00]/40" : ""
                }`}
              >
                <span>{key}</span>
                <span className="truncate">{JSON.stringify(value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const cells = toCells(step);
  const queue = (step.vars.queue as Array<[number, number]> | undefined) ?? [];

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-5 gap-1 p-4">
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={`h-14 rounded border border-[#28303a] grid place-items-center ${
              cell.isWall ? "bg-[#30363d]" : ""
            } ${cell.value ? "bg-[#0d4429]" : "bg-[#1c2128]"} ${
              cell.isCurrent && !step.runtimeError ? "bg-[#3fb950] text-black font-semibold" : ""
            } ${cell.isCurrent && step.runtimeError ? "bg-[#5a1212] text-white" : ""}`}
          >
            {cell.isCurrent ? (step.runtimeError ? "✕" : "→") : ""}
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-prova-line p-4 text-xs text-[#adbac7]">
        <span>HEAD → </span>
        {queue.map((item) => (
          <span
            key={`${item[0]}-${item[1]}`}
            className="inline-block mr-1 rounded-full border border-[#388bfd] bg-[#1f3555] px-2 py-1"
          >
            ({item[0]},{item[1]})
          </span>
        ))}
        <span>→ TAIL</span>
      </div>
    </div>
  );
}
