"use client";

import { useEffect } from "react";

export function AbortErrorGuard() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason as Error | undefined;
      if (reason?.name === "AbortError") {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}

