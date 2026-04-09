import { NextRequest } from "next/server";
import { AnnotatedStep, RawTraceStep } from "@/types/prova";

function buildStep(step: RawTraceStep): AnnotatedStep {
  if (step.runtimeError) {
    return {
      explanation: "인덱스 범위 초과로 실행이 중단되었습니다.",
      visual_actions: ["markError", "pause"],
      aiError: {
        root_cause: "배열/그리드 범위를 초과한 인덱스 접근",
        fix_hint: "접근 전 범위 조건을 확인하세요."
      }
    };
  }
  return {
    explanation: `L.${step.line} 단계 실행`,
    visual_actions: step.step % 2 === 0 ? ["focusGrid"] : ["updateLinear"],
    aiError: null
  };
}

export async function POST(req: NextRequest) {
  const { rawTrace, failNetwork } = await req.json();
  const steps = (rawTrace ?? []) as RawTraceStep[];

  if (failNetwork) {
    return new Response("network fail", { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const chunkSize = 4;
      let index = 0;
      const timer = setInterval(() => {
        if (index >= steps.length) {
          controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
          clearInterval(timer);
          controller.close();
          return;
        }
        const chunk = steps.slice(index, index + chunkSize).map(buildStep);
        controller.enqueue(
          encoder.encode(`event: chunk\ndata: ${JSON.stringify({ index, chunk })}\n\n`)
        );
        index += chunkSize;
      }, 120);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
