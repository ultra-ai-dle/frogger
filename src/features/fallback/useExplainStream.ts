"use client";

import { AnnotatedStep, RawTraceStep } from "@/types/prova";

export async function streamExplain(
  rawTrace: RawTraceStep[],
  onChunk: (index: number, chunk: AnnotatedStep[]) => void,
  options?: { failNetwork?: boolean }
) {
  const response = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawTrace, failNetwork: options?.failNetwork ?? false })
  });

  if (!response.ok || !response.body) {
    throw new Error("NETWORK_EXPLAIN_FAILED");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const packets = buffer.split("\n\n");
    buffer = packets.pop() ?? "";

    packets.forEach((packet) => {
      if (!packet.includes("event: chunk")) return;
      const dataLine = packet
        .split("\n")
        .find((line) => line.startsWith("data: "));
      if (!dataLine) return;
      const parsed = JSON.parse(dataLine.replace("data: ", ""));
      onChunk(parsed.index as number, parsed.chunk as AnnotatedStep[]);
    });
  }
}
