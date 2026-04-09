import { NextRequest, NextResponse } from "next/server";
import { AnalyzeMetadata } from "@/types/prova";

function detectAlgorithm(code: string): AnalyzeMetadata {
  const lower = code.toLowerCase();
  const isBfs = lower.includes("deque") || lower.includes("bfs");
  return {
    algorithm: isBfs ? "BFS" : "Unknown",
    display_name: isBfs ? "BFS - 격자 탐색" : "알고리즘 감지 실패",
    strategy: "GRID_LINEAR",
    key_vars: ["queue", "visited"],
    var_mapping: {
      MAIN_QUEUE: { var_name: "queue", panel: "LINEAR" },
      VISITED_GRID: { var_name: "visited", panel: "GRID" }
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body?.code ?? "");
    const metadata = detectAlgorithm(code);
    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json(
      { message: "analyze failed", error: String(error) },
      { status: 500 }
    );
  }
}
