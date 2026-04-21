import { NextRequest, NextResponse } from "next/server";
import { hrflow, type HrFlowMode } from "@/app/lib/hrflow";

/** GET /api/hrflow/upskill?profile_key=...&job_key=...&mode=demo|live — SWOT analysis of profile↔job matching */
export async function GET(req: NextRequest) {
  const algorithmKey = process.env.HRFLOW_ALGORITHM_KEY;
  if (!algorithmKey) {
    return NextResponse.json(
      { error: "Service temporairement indisponible" },
      { status: 503 },
    );
  }

  const { searchParams } = req.nextUrl;
  const profileKey = searchParams.get("profile_key");
  const jobKey = searchParams.get("job_key");
  const mode = (searchParams.get("mode") as HrFlowMode) || undefined;

  if (!profileKey || !jobKey) {
    return NextResponse.json({ error: "Missing profile_key or job_key parameter" }, { status: 400 });
  }

  const result = await hrflow.upskillProfile(profileKey, jobKey, algorithmKey, mode);
  return NextResponse.json(result, { status: result.code ?? 500 });
}
