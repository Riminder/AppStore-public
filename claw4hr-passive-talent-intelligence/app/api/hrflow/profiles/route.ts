import { NextRequest, NextResponse } from "next/server";
import { hrflow, type HrFlowMode } from "@/app/lib/hrflow";

/** GET /api/hrflow/profiles?limit=...&page=...&keywords=...&mode=demo|live — Search profiles */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = searchParams.get("limit");
  const page = searchParams.get("page");
  const keywords = searchParams.get("keywords");
  const mode = (searchParams.get("mode") as HrFlowMode) || undefined;

  const result = await hrflow.searchProfiles({
    limit: limit ? parseInt(limit, 10) : undefined,
    page: page ? parseInt(page, 10) : undefined,
    text_keywords: keywords ? keywords.split(",").map((k) => k.trim()) : undefined,
    mode,
  });

  return NextResponse.json(result, { status: result.code ?? 500 });
}
