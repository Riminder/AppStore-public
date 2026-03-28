import { NextRequest, NextResponse } from "next/server";
import { hrflow } from "@/app/lib/hrflow";

/** POST /api/hrflow/parse — Upload and parse a CV file */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const reference = formData.get("reference") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const result = await hrflow.parseCV(file, reference ?? undefined);

  return NextResponse.json(result, { status: result.code });
}
