import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ valid: false });

  const { data, error } = await db().rpc("validate_invite_token", { input_token: token });

  if (error) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: !!data });
}
