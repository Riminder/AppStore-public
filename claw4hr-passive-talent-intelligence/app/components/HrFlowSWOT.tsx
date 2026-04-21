"use client";

import { useEffect, useState } from "react";
import type { SourcedProfile } from "@/app/lib/types";

interface SWOTData {
  strengths: string[];
  improvements: string[];
}

interface HrFlowSWOTProps {
  profile: SourcedProfile;
  jobKey?: string;
}

export default function HrFlowSWOT({ profile, jobKey }: HrFlowSWOTProps) {
  const [data, setData] = useState<SWOTData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(false);
    setData(null);

    const defaultJobKey = process.env.NEXT_PUBLIC_HRFLOW_DEFAULT_JOB_KEY ?? "";
    const effectiveJobKey = jobKey ?? defaultJobKey;

    const fetchSwot = profile.hrflow_key && effectiveJobKey
      ? fetch(`/api/hrflow/upskill?profile_key=${encodeURIComponent(profile.hrflow_key)}&job_key=${encodeURIComponent(effectiveJobKey)}`, { signal: controller.signal })
          .then((r) => r.json())
          .then((res) => {
            const raw = res?.data ?? {};
            const strengths: string[] = extractBullets(raw, "positive") ?? [];
            const improvements: string[] = extractBullets(raw, "negative") ?? [];
            return { strengths, improvements };
          })
      : fetch("/api/demo/swot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
          signal: controller.signal,
        })
          .then((r) => r.json())
          .then((res) => res?.data ?? { strengths: [], improvements: [] });

    fetchSwot
      .then((swot) => setData(swot))
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [profile.key, profile.hrflow_key, jobKey]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#4f46e5", borderTopColor: "transparent" }} />
          <span className="text-xs font-mono" style={{ color: "#9ca3af" }}>Analyse HrFlow en cours…</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 rounded-lg animate-pulse" style={{ background: "#f3f4f6", width: `${60 + i * 10}%` }} />
        ))}
      </div>
    );
  }

  if (error || !data || (data.strengths.length === 0 && data.improvements.length === 0)) {
    return (
      <div className="p-4 rounded-xl text-center" style={{ background: "#f9fafb", border: "1px dashed #e5e7eb" }}>
        <p className="text-xs font-mono" style={{ color: "#9ca3af" }}>Analyse HrFlow non disponible pour ce profil</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Powered by HrFlow badge */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#9ca3af" }}>
          Analyse HrFlow
        </p>
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide"
          style={{ background: "rgba(79,70,229,0.1)", color: "#4f46e5" }}
        >
          Powered by HrFlow
        </span>
      </div>

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {data.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <span className="text-sm leading-none mt-0.5 flex-shrink-0" style={{ color: "#10b981" }}>✓</span>
              <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{s}</p>
            </div>
          ))}
        </div>
      )}

      {/* Improvements */}
      {data.improvements.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {data.improvements.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <span className="text-sm leading-none mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }}>△</span>
              <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{s}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function extractBullets(raw: Record<string, unknown>, polarity: "positive" | "negative"): string[] | null {
  if (polarity === "positive" && Array.isArray(raw.strengths)) return raw.strengths as string[];
  if (polarity === "negative" && Array.isArray(raw.improvements)) return raw.improvements as string[];

  if (Array.isArray(raw.predictions)) {
    const predictions = raw.predictions as Array<{ name?: string; value?: number; type?: string }>;
    return predictions
      .filter((p) => polarity === "positive" ? (p.value ?? 0) > 0 : (p.value ?? 0) < 0)
      .slice(0, 3)
      .map((p) => p.name ?? "")
      .filter(Boolean);
  }

  if (typeof raw.explanation === "string") {
    const lines = raw.explanation.split("\n").filter((l) => l.trim().length > 0);
    return polarity === "positive" ? lines.slice(0, 3) : lines.slice(3, 5);
  }

  return null;
}
