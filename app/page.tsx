"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GridLinearPanel } from "@/features/visualization/GridLinearPanel";
import { TimelineControls } from "@/features/playback/TimelineControls";
import { ProvaRuntime } from "@/features/execution/runtime";
import { streamExplain } from "@/features/fallback/useExplainStream";
import { AnnotatedStep, AnalyzeMetadata } from "@/types/prova";
import { useProvaStore } from "@/store/useProvaStore";

const SAMPLE_CODE = [
  "from collections import deque",
  "",
  "def bfs(grid, sr, sc):",
  "    q = deque([(sr, sc)])",
  "    visited = [[False]*5 for _ in range(5)]",
  "    while q:",
  "        r, c = q.popleft()",
  "        if visited[r][c]:",
  "            continue",
  "        visited[r][c] = True",
  "        for nr, nc in [(r+1,c),(r,c+1)]:",
  "            if nr < 5 and nc < 5:",
  "                q.append((nr, nc))",
  "    return visited",
  "",
  "print('done')"
].join("\n");

function runButtonLabel(status: string, hasTrace: boolean) {
  if (status === "loading") return "Python 준비 중...";
  if (status === "running") return "실행 중...";
  if (status === "reinitializing") return "🔄 초기화 중...";
  if (status === "error") return "실행 불가";
  return hasTrace ? "▶ 다시 실행" : "▶ 실행";
}

export default function Page() {
  const [code] = useState(SAMPLE_CODE);
  const [toasts, setToasts] = useState<Array<{ id: number; kind: "warn" | "ok"; message: string }>>([]);
  const runtimeRef = useRef<ProvaRuntime | null>(null);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    pyodideStatus,
    uiMode,
    rawTrace,
    mergedTrace,
    metadata,
    branchLines,
    playback,
    stdin,
    setStdin,
    setPyodideStatus,
    setWorkerResult,
    setMetadata,
    setAnnotated,
    setUiMode,
    setGlobalError,
    setCurrentStep,
    setPlaying,
    setSpeed,
    resetForRun
  } = useProvaStore();

  const currentStep = mergedTrace[playback.currentStep] ?? null;
  const previousStep = mergedTrace[playback.currentStep - 1] ?? null;
  const isRunning = pyodideStatus === "running";
  const isFallback = uiMode === "dataExploration";

  const addToast = (kind: "warn" | "ok", message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [{ id, kind, message }, ...prev].slice(0, 3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, kind === "ok" ? 4000 : 5000);
  };

  useEffect(() => {
    const runtime = new ProvaRuntime({
      onReady: () => setPyodideStatus("ready"),
      onDone: async (payload) => {
        setWorkerResult(payload);
        try {
          const analyze = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, varTypes: payload.varTypes })
          });
          const meta = (await analyze.json()) as AnalyzeMetadata;
          setMetadata(meta);

          const fullAnnotated: AnnotatedStep[] = Array.from(
            { length: payload.rawTrace.length },
            () => ({ explanation: "", visual_actions: [], aiError: null })
          );

          const failNetwork = `${code}\n${stdin}`.toLowerCase().includes("fallback");
          await streamExplain(
            payload.rawTrace,
            (index, chunk) => {
              chunk.forEach((item, idx) => {
                fullAnnotated[index + idx] = item;
              });
              setAnnotated([...fullAnnotated]);
            },
            { failNetwork }
          );

          setUiMode(payload.rawTrace.some((step) => step.runtimeError) ? "errorStep" : "visualizing");
          setCurrentStep(payload.rawTrace.findIndex((step) => step.runtimeError) >= 0
            ? payload.rawTrace.findIndex((step) => step.runtimeError)
            : 0);
          setPyodideStatus("ready");
        } catch {
          setUiMode("dataExploration");
          setPyodideStatus("ready");
          addToast("warn", "⚠️ AI 설명 연결에 실패했습니다. 변수 데이터만으로 탐색합니다.");
        }
      },
      onError: (error) => {
        setPyodideStatus("error");
        setGlobalError({ type: "RUNTIME", message: error.message });
      },
      onTimeout: () => {
        setPyodideStatus("reinitializing");
        addToast("warn", "⚠️ 실행 시간이 너무 길어 안전을 위해 중단하고 환경을 재설정합니다.");
        setTimeout(() => {
          setPyodideStatus("ready");
          addToast("ok", "✅ 환경 준비 완료. 코드를 수정 후 다시 시도해 주세요.");
        }, 900);
      }
    });
    runtime.init();
    runtimeRef.current = runtime;
    return () => runtime.destroy();
  }, [code, setAnnotated, setCurrentStep, setGlobalError, setMetadata, setPyodideStatus, setUiMode, setWorkerResult, stdin]);

  useEffect(() => {
    if (!playback.isPlaying) {
      if (playTimer.current) clearInterval(playTimer.current);
      playTimer.current = null;
      return;
    }
    if (playTimer.current) clearInterval(playTimer.current);
    playTimer.current = setInterval(() => {
      const next = playback.currentStep + 1;
      if (next >= mergedTrace.length) {
        setPlaying(false);
        return;
      }
      if (mergedTrace[next]?.runtimeError) {
        setCurrentStep(next);
        setPlaying(false);
        setUiMode("errorStep");
        return;
      }
      setCurrentStep(next);
    }, Math.max(300, 900 / playback.playbackSpeed));
    return () => {
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, [mergedTrace, playback.currentStep, playback.isPlaying, playback.playbackSpeed, setCurrentStep, setPlaying, setUiMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrentStep(playback.currentStep - 1);
      if (e.key === "ArrowRight") setCurrentStep(playback.currentStep + 1);
      if (e.key === " ") {
        e.preventDefault();
        setPlaying(!playback.isPlaying);
      }
      if (e.key === "Home") setCurrentStep(0);
      if (e.key === "End") setCurrentStep(mergedTrace.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mergedTrace.length, playback.currentStep, playback.isPlaying, setCurrentStep, setPlaying]);

  const headerBadge = useMemo(() => {
    if (isRunning) return "알고리즘 분석 중...";
    if (isFallback) return "○ 알고리즘 감지 실패";
    if (metadata?.display_name) return `● ${metadata.display_name}`;
    return "알고리즘 감지 전";
  }, [isFallback, isRunning, metadata?.display_name]);

  return (
    <div className="h-screen grid grid-rows-[auto_auto_1fr_auto] bg-prova-bg">
      <div className={`h-[3px] ${isRunning ? "opacity-100 animate-pulse bg-gradient-to-r from-[#58a6ff] via-prova-green to-[#58a6ff]" : "opacity-0"}`} />

      {(pyodideStatus === "loading" || pyodideStatus === "error" || isFallback) && (
        <div
          className={`min-h-9 flex items-center justify-between px-3 text-xs ${
            pyodideStatus === "loading"
              ? "bg-[#3d2b00] text-prova-amber"
              : pyodideStatus === "error"
                ? "bg-[#5a1212] text-[#ffc1c1]"
                : "bg-[#7c4a00] text-[#ffe09a]"
          }`}
        >
          <span>
            {pyodideStatus === "loading" && "⏳ Python 환경 준비 중입니다. 잠시만 기다려 주세요."}
            {pyodideStatus === "error" && "✕ Python 환경 초기화에 실패했습니다. 페이지를 새로고침해 주세요."}
            {isFallback && "⚠ AI 연결에 실패했습니다. 기본 변수 뷰로 코드 흐름을 추적합니다."}
          </span>
          {pyodideStatus === "error" && (
            <button className="border border-current rounded px-2 py-1" onClick={() => window.location.reload()}>
              새로고침
            </button>
          )}
        </div>
      )}

      <header className="h-12 border-b border-prova-line px-3 grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="font-bold">
          Pro<span className="text-prova-green">va</span>
        </div>
        <div className={`text-xs rounded-full border px-3 py-1 ${metadata ? "border-prova-green bg-[#1a4731]" : "border-prova-line"}`}>
          {headerBadge}
        </div>
        <div className="justify-self-end text-prova-muted text-sm">도움말 ?</div>
      </header>

      <main className="grid grid-cols-[30%_45%_25%] min-h-0">
        <section className="border-r border-prova-line min-h-0 flex flex-col">
          <p className="text-[11px] text-prova-muted uppercase tracking-wide px-3 mt-3 mb-2">Python Editor</p>
          <div className="mx-3 mb-3 border border-prova-line rounded bg-[#0f141a] flex-1 overflow-auto">
            {code.split("\n").map((line, index) => {
              const lineNo = index + 1;
              const active = currentStep?.line === lineNo;
              const error = active && currentStep?.runtimeError;
              return (
                <div
                  key={lineNo}
                  className={`grid grid-cols-[34px_1fr] gap-2 px-2 py-[1px] font-mono text-[12px] ${
                    active ? (error ? "bg-[#3d0b0b] border-l-2 border-prova-red" : "bg-[#f0e68c]/20 border-l-2 border-[#f0e68c]") : ""
                  }`}
                >
                  <span className="text-[#6e7681] text-right">{lineNo}</span>
                  <span>{line || " "}</span>
                </div>
              );
            })}
          </div>
          <p className="mx-3 mb-3 text-[11px] text-prova-muted border border-prova-line rounded-full px-3 py-1">
            Python 3.11 표준 라이브러리 지원 · 외부 패키지 미지원
          </p>
        </section>

        <section className="border-r border-prova-line min-h-0 flex flex-col">
          <p className="text-[11px] text-prova-muted uppercase tracking-wide px-3 mt-3 mb-2">Visualization</p>
          <div className="mx-3 mb-3 border border-prova-line rounded bg-[#1c2128] flex-1 min-h-0 overflow-hidden">
            <GridLinearPanel
              step={currentStep}
              previousStep={previousStep}
              fallback={isFallback}
            />
          </div>
        </section>

        <section className="min-h-0 flex flex-col">
          <p className="text-[11px] text-prova-muted uppercase tracking-wide px-3 mt-3 mb-2">Variables / AI</p>
          <div className="mx-3 mb-3 border border-prova-line rounded flex-1 min-h-0 grid grid-rows-[auto_1fr_auto_1fr]">
            <div className="px-3 py-2 text-xs text-prova-muted border-b border-prova-line">
              {currentStep ? `<global> > ${currentStep.scope.func} (depth: ${currentStep.scope.depth})` : "<global> (depth: 0)"}
            </div>
            <div className="p-3 overflow-auto text-sm">
              {!currentStep && <p className="text-prova-muted">실행 후 변수가 표시됩니다.</p>}
              {currentStep &&
                Object.entries(currentStep.vars).map(([key, value]) => {
                  const changed =
                    previousStep &&
                    JSON.stringify(previousStep.vars[key]) !== JSON.stringify(value);
                  const isKey = metadata?.key_vars.includes(key);
                  return (
                    <div key={key} className={`grid grid-cols-[1fr_1fr] gap-2 py-1 border-b border-dashed border-[#28303a] ${changed ? "bg-[#3d2b00]/30" : ""}`}>
                      <span className={isKey ? "text-[#9ee5aa] font-semibold" : ""}>{key}</span>
                      <span className="truncate">{JSON.stringify(value)}</span>
                    </div>
                  );
                })}
            </div>
            <div className="px-3 py-2 text-xs text-prova-muted border-y border-prova-line">AI 단계 설명</div>
            <div className="p-3 overflow-auto text-sm">
              {!currentStep && <p className="text-prova-muted italic">(설명 없음)</p>}
              {currentStep && !currentStep.explanation && <p className="text-prova-muted italic">(설명 없음) AI 연결에 실패했습니다.</p>}
              {currentStep?.explanation && (
                <div className={`rounded border p-2 ${currentStep.runtimeError ? "border-prova-red bg-[#2d1112]" : "border-[#2d333b]"}`}>
                  <p className="text-xs text-prova-muted mb-1">L.{currentStep.line}</p>
                  <p>{currentStep.explanation}</p>
                  {currentStep.aiError && (
                    <div className="mt-2 text-xs space-y-1 border-t border-[#4e2424] pt-2">
                      <p>원인: {currentStep.aiError.root_cause}</p>
                      <p>힌트: {currentStep.aiError.fix_hint}</p>
                      <button
                        className="mt-1 h-7 px-2 rounded border border-prova-red bg-[#2d1112]"
                        onClick={() => setCurrentStep(Math.max(0, playback.currentStep - 1))}
                      >
                        ↩ 에러 이전으로 되돌아가기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <section className="border-t border-prova-line bg-[#13161a] p-3 grid grid-cols-[1fr_auto] gap-3 items-center">
        <textarea
          className="h-14 rounded border border-prova-line bg-[#0f141a] text-sm p-2 resize-none disabled:opacity-60"
          placeholder="줄마다 입력값을 작성하세요 (예: 5 3↵2 4 1)"
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          disabled={isRunning || pyodideStatus === "error"}
        />
        <button
          className={`h-10 px-4 rounded font-semibold border ${
            pyodideStatus === "ready"
              ? "bg-[#238636] border-transparent"
              : pyodideStatus === "error"
                ? "bg-[#2d1112] border-prova-red text-[#f8b4b4]"
                : "bg-[#21262d] border-prova-line text-[#9ba3ad]"
          }`}
          disabled={pyodideStatus !== "ready"}
          onClick={() => {
            if (pyodideStatus !== "ready") return;
            resetForRun();
            setPyodideStatus("running");
            runtimeRef.current?.run(code, stdin);
          }}
        >
          {runButtonLabel(pyodideStatus, mergedTrace.length > 0)}
        </button>
      </section>

      <TimelineControls
        steps={mergedTrace}
        branchLines={branchLines}
        currentStep={playback.currentStep}
        isRunning={isRunning}
        isPlaying={playback.isPlaying}
        speed={playback.playbackSpeed}
        onStepChange={(step) => setCurrentStep(step)}
        onTogglePlay={() => setPlaying(!playback.isPlaying)}
        onSpeedChange={(value) => setSpeed(value)}
      />

      <div className="fixed right-4 bottom-4 w-[360px] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded border px-3 py-2 text-xs ${
              toast.kind === "ok"
                ? "bg-[#0d4429] border-prova-green"
                : "bg-[#5a3600] border-prova-amber"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
