import { NextRequest, NextResponse } from "next/server";
import { hrflow, type HrFlowMode } from "@/app/lib/hrflow";

/** GET /api/hrflow/profiles?limit=...&page=...&keywords=...&mode=demo|live — Search profiles */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawLimit = searchParams.get("limit");
  const rawPage = searchParams.get("page");
  const keywords = searchParams.get("keywords");
  const mode = (searchParams.get("mode") as HrFlowMode) || undefined;

  const limit = Math.min(100, Math.max(1, parseInt(rawLimit || "30", 10) || 30));
  const page = Math.max(1, parseInt(rawPage || "1", 10) || 1);

  const result = await hrflow.searchProfiles({
    limit,
    page,
    text_keywords: keywords ? keywords.split(",").map((k) => k.trim()) : undefined,
    mode,
  });

  return NextResponse.json(result, { status: result.code ?? 500 });
}
