import { NextRequest, NextResponse } from "next/server";
import { hrflow, type HrFlowMode } from "@/app/lib/hrflow";

/** GET /api/hrflow/score?job_key=...&limit=...&page=...&mode=demo|live — Score profiles against a job */
export async function GET(req: NextRequest) {
  const ALGORITHM_KEY = process.env.HRFLOW_ALGORITHM_KEY;
  if (!ALGORITHM_KEY) {
    return NextResponse.json(
      { error: "Service temporairement indisponible" },
      { status: 503 },
    );
  }

  const { searchParams } = req.nextUrl;
  const jobKey = searchParams.get("job_key");
  const rawLimit = searchParams.get("limit");
  const rawPage = searchParams.get("page");
  const mode = (searchParams.get("mode") as HrFlowMode) || undefined;

  if (!jobKey) {
    return NextResponse.json({ error: "Missing job_key parameter" }, { status: 400 });
  }

  const limit = Math.min(100, Math.max(1, parseInt(rawLimit || "30", 10) || 30));
  const page = Math.max(1, parseInt(rawPage || "1", 10) || 1);

  const result = await hrflow.scoreProfiles(jobKey, ALGORITHM_KEY, {
    limit,
    page,
    mode,
  });

  return NextResponse.json(result, { status: result.code ?? 500 });
}
