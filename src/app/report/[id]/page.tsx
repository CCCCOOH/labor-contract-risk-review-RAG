"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReviewReport, Contract } from "@/lib/types";
import RiskReport from "@/components/RiskReport";
import ReviewProgress, { DimensionProgress } from "@/components/ReviewProgress";
import { REVIEW_DIMENSIONS } from "@/lib/review/dimensions";

const ALL_DIMENSIONS = REVIEW_DIMENSIONS.map((d) => ({
  key: d.key,
  name: d.name,
}));

function makeInitialProgress(): DimensionProgress[] {
  return ALL_DIMENSIONS.map((d, i) => ({
    dimensionKey: d.key,
    dimensionName: d.name,
    status: i === 0 ? ("active" as const) : ("pending" as const),
    findings: [],
  }));
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [reviewing, setReviewing] = useState(true);
  const [error, setError] = useState("");
  const [dims, setDims] = useState<DimensionProgress[]>(makeInitialProgress);
  const [progress, setProgress] = useState({ current: 0, total: ALL_DIMENSIONS.length });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const res = await fetch(`/api/review/${id}`, {
          method: "POST",
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "审查失败");
        }

        const contentType = res.headers.get("content-type") || "";

        // Cached response: JSON, not SSE
        if (contentType.includes("application/json")) {
          const data = await res.json();
          if (cancelled) return;
          setReport(data.report);
          setReviewing(false);
          const cres = await fetch(`/api/review/${id}`);
          if (cres.ok) setContract((await cres.json()).contract);
          return;
        }

        // SSE streaming
        const reader = res.body?.getReader();
        if (!reader) throw new Error("无法读取响应流");

        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (cancelled) {
            reader.cancel();
            return;
          }

          buf += decoder.decode(value, { stream: true });

          // Process complete SSE frames (separated by \n\n)
          while (buf.includes("\n\n")) {
            const idx = buf.indexOf("\n\n");
            const frame = buf.slice(0, idx);
            buf = buf.slice(idx + 2);

            // Parse lines in this frame
            let eventType = "";
            let eventData: any = null;
            for (const line of frame.split("\n")) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                try {
                  eventData = JSON.parse(line.slice(6));
                } catch { /* skip */ }
              }
            }

            if (!eventData) continue;

            if (eventType === "progress") {
              setDims((prev) => {
                return prev.map((d, i) => {
                  if (d.dimensionKey === eventData.dimensionKey) {
                    return {
                      ...d,
                      status: eventData.error ? "error" : "done",
                      findings: eventData.findings || [],
                      error: eventData.error,
                    };
                  }
                  // The dimension right after the just-completed one becomes active
                  if (i === eventData.current && d.status === "pending") {
                    return { ...d, status: "active" };
                  }
                  return d;
                });
              });
              setProgress({ current: eventData.current, total: eventData.total });
            } else if (eventType === "complete") {
              setReport(eventData.report);
              setReviewing(false);
            } else if (eventType === "error") {
              setError(eventData.error);
              setReviewing(false);
            }
          }
        }

        // Stream ended — fetch contract for header
        const cres = await fetch(`/api/review/${id}`);
        if (!cancelled && cres.ok) {
          setContract((await cres.json()).contract);
        }
        setReviewing(false);
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setError(e.message || String(e));
        setReviewing(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id]);

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  // Progress screen — shown during live review
  if (reviewing && !report) {
    return (
      <div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">风险审查报告</h1>
        </div>
        <ReviewProgress
          dimensions={dims}
          current={progress.current}
          total={progress.total}
        />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">风险审查报告</h1>
          {contract && (
            <p className="text-sm text-gray-500 mt-1">
              {contract.fileName} · {contract.clauses.length} 条条款
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            ← 返回
          </button>
          <button
            onClick={() => router.push(`/chat/${id}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            💬 深入对话
          </button>
        </div>
      </div>

      <RiskReport report={report} contractId={id} />
    </div>
  );
}
