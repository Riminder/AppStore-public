import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ data: [] });

  const { data, error } = await db()
    .from("shortlist")
    .select("*")
    .eq("session_id", sessionId)
    .order("saved_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { session_id, profile_key, profile_data } = body;
  if (!session_id || !profile_key || !profile_data) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { data, error } = await db()
    .from("shortlist")
    .upsert({ session_id, profile_key, profile_data }, { onConflict: "session_id,profile_key" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { session_id, profile_key } = body;
  if (!session_id || !profile_key) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { error } = await db()
    .from("shortlist")
    .delete()
    .eq("session_id", session_id)
    .eq("profile_key", profile_key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { session_id, profile_key, pipeline_stage } = body;
  if (!session_id || !profile_key || !pipeline_stage) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const VALID_STAGES = ["shortlisted", "contacted", "waiting", "discussing", "archived"] as const;
  if (!VALID_STAGES.includes(pipeline_stage as typeof VALID_STAGES[number])) {
    return NextResponse.json({ error: "invalid pipeline_stage" }, { status: 400 });
  }

  const { data, error } = await db()
    .from("shortlist")
    .update({ pipeline_stage })
    .eq("session_id", session_id)
    .eq("profile_key", profile_key)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
