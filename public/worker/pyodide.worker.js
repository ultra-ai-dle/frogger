/* eslint-disable no-restricted-globals */

function inferType(value) {
  if (Array.isArray(value) && Array.isArray(value[0])) return "list2d";
  if (Array.isArray(value)) return "list";
  if (typeof value === "number") return "int";
  if (typeof value === "boolean") return "bool";
  return typeof value;
}

function buildMockTrace(kind) {
  const trace = [];
  const visited = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false));
  const queue = [
    [0, 0],
    [1, 0],
    [0, 1],
    [2, 1]
  ];
  const lines = [4, 6, 7, 8, 10, 12, 6, 7, 10, 12, 16];
  for (let i = 0; i < lines.length; i += 1) {
    const cur = queue[i % queue.length];
    if (i > 0 && i < 8) visited[Math.min(cur[0], 4)][Math.min(cur[1], 4)] = true;
    trace.push({
      step: i,
      line: lines[i],
      vars: {
        queue: queue.slice(0, Math.max(1, 4 - (i % 4))),
        visited,
        r: cur[0],
        c: cur[1],
        step: i
      },
      scope: { func: "bfs", depth: 1 },
      parent_frames: [{ scope: { func: "<global>", depth: 0 }, vars: { grid: "[5x5]" } }],
      runtimeError: null
    });
  }

  if (kind === "runtimeError") {
    const last = trace[trace.length - 1];
    last.line = 17;
    last.vars.r = 5;
    last.runtimeError = {
      type: "IndexError",
      message: "list index out of range",
      line: 17
    };
  }

  return trace;
}

function extractVarTypesUnion(rawTrace) {
  const result = {};
  rawTrace.forEach((step) => {
    Object.entries(step.vars).forEach(([key, value]) => {
      if (!result[key]) {
        result[key] = inferType(value);
      }
    });
  });
  return result;
}

self.postMessage({ type: "ready" });

self.onmessage = async (event) => {
  const { code = "", stdin = "" } = event.data || {};
  const signal = `${code}\n${stdin}`.toLowerCase();
  let kind = "normal";
  if (signal.includes("timeout")) kind = "timeout";
  if (signal.includes("fallback")) kind = "fallback";
  if (signal.includes("indexerror") || signal.includes("error_case")) kind = "runtimeError";

  if (kind === "timeout") {
    await new Promise((r) => setTimeout(r, 6000));
    return;
  }

  const rawTrace = buildMockTrace(kind);
  const varTypes = extractVarTypesUnion(rawTrace);
  self.postMessage({
    type: "done",
    rawTrace,
    branchLines: { loop: [6], branch: [8, 12] },
    varTypes,
    scenario: kind
  });
};
