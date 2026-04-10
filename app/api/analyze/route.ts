import { NextRequest, NextResponse } from "next/server";
import { AnalyzeMetadata } from "@/types/prova";
import { inferGraphModeFromCode } from "@/lib/graphModeInference";
import { normalizeAndDedupeTags } from "@/lib/tagNormalize";

type Panel = "GRID" | "LINEAR" | "GRAPH" | "VARIABLES";
type Strategy = "GRID" | "LINEAR" | "GRID_LINEAR" | "GRAPH";

type AnalyzeAiResponse = {
  algorithm: string;
  display_name: string;
  strategy: Strategy;
  tags: string[];
  detected_data_structures?: string[];
  detected_algorithms?: string[];
  summary?: string;
  graph_mode?: "directed" | "undirected";
  graph_var_name?: string;
  graph_representation?: "GRID" | "MAP";
  uses_bitmasking?: boolean;
  time_complexity?: string;
  key_vars: string[];
  var_mapping: Record<string, { var_name: string; panel: Panel }>;
};

const ANALYZE_CODE_CHAR_LIMIT = 5000;
const ANALYZE_VAR_TYPES_LIMIT = 40;
const ANALYZE_REQUEST_TIMEOUT_MS = 20000;

function pickProvider() {
  const gemini = process.env.GEMINI_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  if (gemini) return "gemini" as const;
  if (openai) return "openai" as const;
  return null;
}

function availableProviders() {
  const providers: Array<"gemini" | "openai"> = [];
  if (process.env.GEMINI_API_KEY) providers.push("gemini");
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  return providers;
}

function stripCodeFence(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
}

function extractFirstJsonObject(text: string) {
  const cleaned = stripCodeFence(text);
  const start = cleaned.indexOf("{");
  if (start < 0) return cleaned;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return cleaned.slice(start, i + 1);
      }
    }
  }
  return cleaned;
}

function tryParseAnalyzeJson(text: string): AnalyzeAiResponse | null {
  const candidate = extractFirstJsonObject(text);
  try {
    return JSON.parse(candidate) as AnalyzeAiResponse;
  } catch {
    return null;
  }
}

function uniq(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function compactCodeForAnalyze(code: string) {
  const compactLimit = 3200;
  if (code.length <= compactLimit) return code;
  const head = code.slice(0, Math.floor(compactLimit * 0.8));
  const tail = code.slice(-Math.floor(compactLimit * 0.2));
  return `${head}\n# ... truncated for token optimization ...\n${tail}`;
}

function compactVarTypes(varTypes: Record<string, string>) {
  return Object.fromEntries(Object.entries(varTypes).slice(0, ANALYZE_VAR_TYPES_LIMIT));
}

function detectDequeVars(code: string) {
  const vars = new Set<string>();
  const lines = code.split("\n");
  for (const raw of lines) {
    const line = raw.replace(/#.*/, "");
    const m = line.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*deque\s*\(/);
    if (m) vars.add(m[1]);
  }
  return Array.from(vars);
}

function detectDirectionMapVars(code: string) {
  const vars = new Set<string>();
  const lines = code.split("\n");
  for (const raw of lines) {
    const line = raw.replace(/#.*/, "");
    const mapLike = line.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{.*\}/);
    if (!mapLike) continue;
    const name = mapLike[1];
    if (!/dir|dirs|direction|delta|move|step/i.test(name)) continue;
    if (/\([ ]*-?\d+[ ]*,[ ]*-?\d+[ ]*\)/.test(line)) {
      vars.add(name);
    }
  }
  return Array.from(vars);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

async function fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastRes: Response | null = null;
  for (let i = 0; i < attempts; i += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ANALYZE_REQUEST_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      clearTimeout(timeout);
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") {
        if (i === attempts - 1) throw new Error("AI_TIMEOUT");
        await sleep(300 * (2 ** i));
        continue;
      }
      if (i === attempts - 1) throw err;
      await sleep(300 * (2 ** i));
      continue;
    } finally {
      clearTimeout(timeout);
    }
    if (res.ok) return res;
    lastRes = res;
    if (!RETRYABLE_STATUS.has(res.status) || i === attempts - 1) return res;

    const retryAfter = Number(res.headers.get("retry-after") ?? "0");
    const baseBackoff = res.status === 503 ? 1200 : 300;
    const backoff = retryAfter > 0 ? retryAfter * 1000 : baseBackoff * (2 ** i);
    await sleep(backoff);
  }
  return lastRes ?? (await fetch(url, init));
}

function extractProviderHttpStatus(message: string): number | null {
  const m = message.match(/(?:GEMINI_HTTP_|OPENAI_HTTP_)(\d{3})/);
  if (!m) return null;
  const status = Number(m[1]);
  return Number.isFinite(status) ? status : null;
}

function isTransientAiError(message: string) {
  if (/AI_TIMEOUT|EMPTY_RESPONSE|ANALYZE_PARSE_FAILED/i.test(message)) return true;
  const status = extractProviderHttpStatus(message);
  return status !== null && RETRYABLE_STATUS.has(status);
}

async function callGemini(prompt: string, model: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is missing");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 900,
        // Strongly constrain structure to reduce parse failures.
        responseSchema: {
          type: "object",
          properties: {
            algorithm: { type: "string" },
            display_name: { type: "string" },
            strategy: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            detected_data_structures: { type: "array", items: { type: "string" } },
            detected_algorithms: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            graph_mode: { type: "string" },
            graph_var_name: { type: "string" },
            graph_representation: { type: "string" },
            uses_bitmasking: { type: "boolean" },
            time_complexity: { type: "string" },
            key_vars: { type: "array", items: { type: "string" } },
            var_mapping: { type: "object" }
          },
          required: ["algorithm", "display_name", "strategy", "tags", "key_vars", "var_mapping"]
        }
      }
    })
  }, 1);
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      detail = "";
    }
    throw new Error(`GEMINI_HTTP_${res.status}${detail ? `:${detail.slice(0, 300)}` : ""}`);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");
  return String(text);
}

async function callOpenAI(prompt: string, model: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is missing");
  const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "Return ONLY strict JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    })
  }, 1);
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      detail = "";
    }
    throw new Error(`OPENAI_HTTP_${res.status}${detail ? `:${detail.slice(0, 300)}` : ""}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OPENAI_EMPTY_RESPONSE");
  return String(text);
}

function normalizeResponse(parsed: AnalyzeAiResponse, varTypes: Record<string, string>): AnalyzeMetadata {
  const validStrategy: Strategy[] = ["GRID", "LINEAR", "GRID_LINEAR", "GRAPH"];
  const strategy = validStrategy.includes(parsed.strategy) ? parsed.strategy : "LINEAR";

  const varNames = Object.keys(varTypes);
  const validMap: Record<string, { var_name: string; panel: Panel }> = {};
  const panelSet = new Set<Panel>(["GRID", "LINEAR", "GRAPH", "VARIABLES"]);
  Object.entries(parsed.var_mapping ?? {}).forEach(([role, item]) => {
    if (!item || typeof item.var_name !== "string") return;
    if (!varNames.includes(item.var_name)) return;
    const panel = panelSet.has(item.panel) ? item.panel : "VARIABLES";
    validMap[role] = { var_name: item.var_name, panel };
  });

  const keyVars = (parsed.key_vars ?? []).filter((k) => varNames.includes(k)).slice(0, 8);
  const detectedDataStructures = uniq((parsed.detected_data_structures ?? []).map(String)).slice(0, 8);
  const detectedAlgorithms = uniq((parsed.detected_algorithms ?? []).map(String)).slice(0, 8);
  const rawTc = typeof parsed.time_complexity === "string" ? parsed.time_complexity.trim() : "";
  const timeComplexity = rawTc
    ? rawTc.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 96)
    : undefined;

  const tags = normalizeAndDedupeTags(
    [
      ...(parsed.tags ?? []).map(String),
      ...detectedDataStructures,
      ...detectedAlgorithms
    ],
    10
  );

  return {
    algorithm: parsed.algorithm || "Unknown",
    display_name: parsed.display_name || strategy,
    strategy,
    tags: tags.length > 0 ? tags : ["일반-구현"],
    detected_data_structures: detectedDataStructures,
    detected_algorithms: detectedAlgorithms,
    summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 120) : undefined,
    graph_mode: parsed.graph_mode === "directed" ? "directed" : parsed.graph_mode === "undirected" ? "undirected" : undefined,
    graph_var_name: typeof parsed.graph_var_name === "string" ? parsed.graph_var_name : undefined,
    graph_representation: parsed.graph_representation === "GRID"
      ? "GRID"
      : parsed.graph_representation === "MAP"
        ? "MAP"
        : undefined,
    uses_bitmasking: !!parsed.uses_bitmasking,
    time_complexity: timeComplexity,
    key_vars: keyVars,
    var_mapping: validMap
  };
}

function applyDequeHints(meta: AnalyzeMetadata, code: string, varTypes: Record<string, string>): AnalyzeMetadata {
  const dequeVars = detectDequeVars(code).filter((v) => Object.prototype.hasOwnProperty.call(varTypes, v));
  if (dequeVars.length === 0) return meta;

  const hasQueueOps = /\.popleft\s*\(|\.append\s*\(/.test(code);
  const hasStackOps = /\.pop\s*\(|\.appendleft\s*\(/.test(code);
  const extraTags = [
    "deque",
    hasQueueOps ? "queue" : "",
    hasStackOps ? "stack" : "",
    hasQueueOps ? "BFS" : ""
  ].filter(Boolean);

  const next: AnalyzeMetadata = {
    ...meta,
    tags: normalizeAndDedupeTags([...(meta.tags ?? []), ...extraTags], 10),
    detected_data_structures: uniq([
      ...(meta.detected_data_structures ?? []),
      "deque",
      ...(hasQueueOps ? ["queue"] : []),
      ...(hasStackOps ? ["stack"] : [])
    ]).slice(0, 8),
    key_vars: uniq([...(meta.key_vars ?? []), ...dequeVars]).slice(0, 8),
    var_mapping: { ...meta.var_mapping }
  };

  const panel: Panel = "LINEAR";
  if (!next.var_mapping.QUEUE && hasQueueOps) {
    next.var_mapping.QUEUE = { var_name: dequeVars[0], panel };
  }
  if (!next.var_mapping.STACK && hasStackOps) {
    next.var_mapping.STACK = { var_name: dequeVars[0], panel };
  }
  if (next.strategy === "GRID" && (hasQueueOps || hasStackOps)) {
    next.strategy = "GRID_LINEAR";
  }
  if (next.strategy === "GRAPH" && (hasQueueOps || hasStackOps)) {
    next.strategy = "LINEAR";
  }
  return next;
}

function applyDirectionMapGuards(meta: AnalyzeMetadata, code: string): AnalyzeMetadata {
  const directionVars = detectDirectionMapVars(code);
  if (directionVars.length === 0) return meta;

  const blocked = new Set(directionVars);
  const nextMapping = Object.fromEntries(
    Object.entries(meta.var_mapping ?? {}).filter(([, item]) => !blocked.has(item.var_name))
  );
  const nextKeyVars = (meta.key_vars ?? []).filter((v) => !blocked.has(v));

  return {
    ...meta,
    var_mapping: nextMapping,
    key_vars: nextKeyVars,
    tags: normalizeAndDedupeTags(
      (meta.tags ?? []).filter((t) => !/graph|grid|격자|그래프|matrix/i.test(t)),
      10
    ),
    detected_data_structures: uniq((meta.detected_data_structures ?? []).filter((t) => !/graph|grid|matrix|adj/i.test(t))).slice(0, 8),
    strategy: meta.strategy === "GRAPH" ? "LINEAR" : meta.strategy
  };
}

function applyGraphModeInference(meta: AnalyzeMetadata, code: string): AnalyzeMetadata {
  if (meta.graph_mode === "directed" || meta.graph_mode === "undirected") return meta;
  const inferred = inferGraphModeFromCode(code);
  if (!inferred) return meta;
  return { ...meta, graph_mode: inferred };
}

async function analyzeWithAi(code: string, varTypes: Record<string, string>) {
  const providers = availableProviders();
  if (providers.length === 0) throw new Error("NO_AI_PROVIDER_KEY");
  const compactCode = compactCodeForAnalyze(code);
  const compactTypes = compactVarTypes(varTypes);
  const prompt = [
    "Python 코드의 자료구조/알고리즘 분류기다.",
    "설명 없이 JSON 객체 하나만 출력.",
    "strategy는 GRID|LINEAR|GRID_LINEAR|GRAPH 중 하나.",
    "var_mapping[].var_name은 반드시 varTypes 키여야 한다.",
    "",
    "【최우선】strategy·graph_var_name·var_mapping의 panel은 변수 ‘이름’이 아니라 코드 안에서 그 값이 하는 ‘역할’로만 결정한다.",
    "2차원 리스트([[...]])라고 해서 무조건 GRID도 GRAPH도 아니다. 반드시 읽기: 이중 루프로 dp[i][j] 갱신·최적화 점화식이면 GRID/GRID_LINEAR, graph[u].append(v)·인접 탐색·간선 순회면 GRAPH.",
    "인접행렬(0/1 또는 가중치)로 정점 간 연결을 나타내고 BFS/DFS/다익스트라에 쓰이면 GRAPH(표현은 graph_representation=GRID일 수 있음). 행렬체인·배낭처럼 구간/부분문제 최적값만 담으면 GRID.",
    "dict로 정점→이웃 목록이면 graph_representation=MAP. graph_var_name은 ‘그래프 자료구조’로 쓰인 변수 하나만.",
    "변수명이 graph라도 보드 게임 격자만 담으면 GRAPH 전략이 아님. 이름이 dp여도 인접 리스트로만 쓰이면 GRAPH일 수 있음(드묾)—맥락이 우선.",
    "",
    "비트마스킹(<<, >>, &, |, ^, mask state DP 등) 사용 시 uses_bitmasking=true로 반환.",
    "가중치 그래프(예: graph = [[]...], graph[u].append([cost, v]) / (v, w) / edges with weight)는 반드시 GRAPH로 분류.",
    "가중치 그래프일 때 graph_var_name은 해당 인접리스트/간선 변수명으로 설정.",
    "GRAPH일 때 graph_representation도 함께 반환: 2D 인접행렬/격자형이면 GRID, dict/adjacency map 형태면 MAP.",
    "그래프(GRAPH)는 인접 리스트/딕트(graph[u]→이웃), 간선 리스트(edges), in_degree, BFS/DFS 탐색 등 ‘정점·간선’ 모델일 때만.",
    "2차원 리스트가 숫자/스칼라만 담는 표(행렬 체인, 배낭, LCS, 플로이드 비용 등)면 GRID 또는 GRID_LINEAR이지 GRAPH가 아님.",
    "트리 parent/children 배열, union-find 부모 배열은 GRAPH가 아니라 LINEAR 또는 VARIABLES.",
    "가중치가 있으면 tags/detected_data_structures에 weighted graph 성격을 반영.",
    "GRAPH일 때 graph_mode는 반드시 directed 또는 undirected로 채운다.",
    "단방향 간선만 쓰는 경우(예: add(a,b) 한 번만, in_degree/in_degrees, 위상정렬·Kahn·DAG, 방향 최단경로): graph_mode=directed.",
    "무방향만 다루는 경우(예: 양쪽에 간선 추가, MST·Kruskal·Union-Find): graph_mode=undirected.",
    "DIRS/dirs/direction/delta 형태의 방향 벡터 맵은 GRAPH/GRID가 아닌 VARIABLES로 취급.",
    "deque()는 반드시 자료구조로 감지하고 append+popleft면 queue/BFS 반영.",
    "tags 배열 값은 반드시 lower-kebab-case(소문자, 단어는 하이픈으로 연결, 공백 금지). 예: topological-sort, directed-graph.",
    "time_complexity: 코드 기준 최악 시간 복잡도 한 줄. Big-O 표기(예: O(n), O(n log n), O(V+E), O(n·m)). 변수는 코드에서 쓰인 기호(n,m,V,E 등)에 맞출 것.",
    "",
    "출력 JSON 스키마:",
    '{"algorithm":"string","display_name":"string","strategy":"GRID|LINEAR|GRID_LINEAR|GRAPH","tags":["string"],"detected_data_structures":["string"],"detected_algorithms":["string"],"summary":"string","graph_mode":"directed|undirected","graph_var_name":"string","graph_representation":"GRID|MAP","uses_bitmasking":"boolean","time_complexity":"string","key_vars":["string"],"var_mapping":{"ROLE":{"var_name":"string","panel":"GRID|LINEAR|GRAPH|VARIABLES"}}}',
    "",
    `[code]\n${compactCode}`,
    "",
    `[varTypes]\n${JSON.stringify(compactTypes)}`
  ].join("\n");

  const geminiModel =
    process.env.ANALYZE_MODEL_GEMINI
    || (process.env.ANALYZE_MODEL && !/^gpt|^o[1-9]/i.test(process.env.ANALYZE_MODEL) ? process.env.ANALYZE_MODEL : "")
    || "gemini-2.5-flash-lite";
  const openaiModel =
    process.env.ANALYZE_MODEL_OPENAI
    || (process.env.ANALYZE_MODEL && /^gpt|^o[1-9]/i.test(process.env.ANALYZE_MODEL) ? process.env.ANALYZE_MODEL : "")
    || "gpt-4o-mini";

  const parseAndPostProcess = (raw: string) => {
    const parsed = tryParseAnalyzeJson(raw);
    if (!parsed) throw new Error("ANALYZE_PARSE_FAILED");
    const normalized = normalizeResponse(parsed, varTypes);
    const withDeque = applyDequeHints(normalized, code, varTypes);
    const guarded = applyDirectionMapGuards(withDeque, code);
    return applyGraphModeInference(guarded, code);
  };

  const geminiCandidates = uniq([
    geminiModel,
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash"
  ]);

  const providerOrder: Array<"gemini" | "openai"> = [];
  if (providers.includes("gemini")) providerOrder.push("gemini");
  if (providers.includes("openai")) providerOrder.push("openai");

  let lastError: Error | null = null;
  for (const provider of providerOrder) {
    try {
      if (provider === "gemini") {
        for (const model of geminiCandidates) {
          try {
            const raw = await callGemini(prompt, model);
            return parseAndPostProcess(raw);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            lastError = err instanceof Error ? err : new Error(message);
            if (!isTransientAiError(message)) break;
          }
        }
      } else {
        const raw = await callOpenAI(prompt, openaiModel);
        return parseAndPostProcess(raw);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = err instanceof Error ? err : new Error(message);
      if (!isTransientAiError(message)) break;
    }
  }

  throw (lastError ?? new Error("ANALYZE_UNKNOWN_FAILURE"));
}

function fallbackAnalyzeMetadata(varTypes: Record<string, string>): AnalyzeMetadata {
  const varNames = Object.keys(varTypes);
  const firstLinear = varNames.find((k) => /queue|deque|stack|list|arr|path|order/i.test(k)) ?? varNames[0];
  const mapping: AnalyzeMetadata["var_mapping"] = {};
  if (firstLinear) {
    mapping.PRIMARY = { var_name: firstLinear, panel: "LINEAR" };
  }
  return {
    algorithm: "Unknown",
    display_name: "기본 분석",
    strategy: "LINEAR",
    tags: ["기본-분석"],
    detected_data_structures: [],
    detected_algorithms: [],
    summary: "AI 과부하로 기본 분석 결과를 표시합니다.",
    uses_bitmasking: false,
    key_vars: firstLinear ? [firstLinear] : [],
    var_mapping: mapping
  };
}

export async function POST(req: NextRequest) {
  let code = "";
  let varTypes: Record<string, string> = {};
  try {
    const body = await req.json();
    code = String(body?.code ?? "");
    varTypes = (body?.varTypes ?? {}) as Record<string, string>;
    if (code.trim().length === 0) {
      return NextResponse.json(
        { message: "code is required" },
        { status: 400 }
      );
    }
    const metadata = await analyzeWithAi(code, varTypes);
    return NextResponse.json(metadata);
  } catch (error) {
    // Keep fallback behavior, but log root cause for debugging.
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/analyze] fallback triggered:", message);
    return NextResponse.json(fallbackAnalyzeMetadata(varTypes), { status: 200 });
  }
}
