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
    .from("searches")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { session_id, id } = body;
  if (!session_id || !id) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { error } = await db()
    .from("searches")
    .delete()
    .eq("id", id)
    .eq("session_id", session_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { session_id, query, profile_count } = body;
  if (!session_id || !query) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { data, error } = await db()
    .from("searches")
    .insert({ session_id, query, profile_count: profile_count ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
