"use client";

import { WorkerDonePayload } from "@/types/prova";

type RuntimeCallbacks = {
  onReady: () => void;
  onDone: (payload: WorkerDonePayload & { scenario?: string }) => void;
  onError: (error: Error) => void;
  onTimeout: () => void;
};

export class ProvaRuntime {
  private worker: Worker | null = null;

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private callbacks: RuntimeCallbacks) {}

  init() {
    this.createWorker();
  }

  run(code: string, stdin: string) {
    if (!this.worker) {
      this.createWorker();
    }
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      this.worker?.terminate();
      this.callbacks.onTimeout();
      this.createWorker();
    }, 5000);
    this.worker?.postMessage({ code, stdin });
  }

  destroy() {
    this.clearTimeout();
    this.worker?.terminate();
    this.worker = null;
  }

  private createWorker() {
    this.worker?.terminate();
    this.worker = new Worker("/worker/pyodide.worker.js");
    this.worker.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (data.type === "ready") {
        this.callbacks.onReady();
        return;
      }
      if (data.type === "done") {
        this.clearTimeout();
        this.callbacks.onDone(data);
      }
    };
    this.worker.onerror = (event) => {
      this.clearTimeout();
      this.callbacks.onError(new Error(event.message));
    };
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
