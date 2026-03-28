import { NextRequest, NextResponse } from "next/server";
import { hrflow, type HrFlowMode } from "@/app/lib/hrflow";

/** GET /api/hrflow/ask?profile_key=...&question=...&mode=demo|live — Ask a question about a profile */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const profileKey = searchParams.get("profile_key");
  const question = searchParams.get("question");
  const mode = (searchParams.get("mode") as HrFlowMode) || undefined;

  if (!profileKey || !question) {
    return NextResponse.json(
      { error: "Missing profile_key or question parameter" },
      { status: 400 },
    );
  }

  const result = await hrflow.askProfile(profileKey, [question], mode);

  return NextResponse.json(result, { status: result.code ?? 500 });
}
