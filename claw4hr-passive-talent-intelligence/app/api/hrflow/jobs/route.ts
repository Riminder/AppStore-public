import { NextRequest, NextResponse } from "next/server";
import { hrflow } from "@/app/lib/hrflow";

/** GET /api/hrflow/jobs?limit=...&page=... — List jobs from the board */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawLimit = searchParams.get("limit");
  const rawPage = searchParams.get("page");

  const name = searchParams.get("name");

  const limit = Math.min(100, Math.max(1, parseInt(rawLimit || "30", 10) || 30));
  const page = Math.max(1, parseInt(rawPage || "1", 10) || 1);

  const result = await hrflow.searchJobs({
    limit,
    page,
    name: name ?? undefined,
  });

  return NextResponse.json(result, { status: result.code ?? 500 });
}
