import { NextRequest, NextResponse } from "next/server";
import { hrflow } from "@/app/lib/hrflow";

/** GET /api/hrflow/jobs?limit=...&page=... — List jobs from the board */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = searchParams.get("limit");
  const page = searchParams.get("page");

  const name = searchParams.get("name");

  const result = await hrflow.searchJobs({
    limit: limit ? parseInt(limit, 10) : undefined,
    page: page ? parseInt(page, 10) : undefined,
    name: name ?? undefined,
  });

  return NextResponse.json(result, { status: result.code ?? 500 });
}
