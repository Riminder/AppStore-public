import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import type { SourcedProfile } from "@/app/lib/types";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function buildPrompt(profile: SourcedProfile): string {
  const experience = profile.experiences[0]
    ? `${profile.experiences[0].title} chez ${profile.experiences[0].company}`
    : profile.title;

  const github = profile.sources.find((s) => s.type === "github");
  const sourceDetail = github
    ? `présent sur GitHub (${github.label})`
    : `profil sourcé sur ${profile.sources[0]?.label ?? "le web"}`;

  return `Tu es un recruteur expert. Génère un message d'approche personnalisé en français (5-7 lignes maximum) pour ce candidat passif.

Profil :
- Nom : ${profile.name}
- Titre : ${profile.title}
- Localisation : ${profile.location}
- Expérience : ${profile.experience_years} ans
- Dernière expérience : ${experience}
- Compétences clés : ${profile.skills.slice(0, 5).join(", ")}
- Source : ${sourceDetail}
- Résumé : ${profile.summary}

Règles STRICTES :
1. Cite 1-2 détails CONCRETS et SPÉCIFIQUES du profil (projet, ancienne boîte, technologie rare)
2. Ton professionnel mais humain — pas de bullshit corporate
3. Commence par "Bonjour ${profile.name.split(" ")[0]},"
4. Termine par UNE question ouverte simple (disponibilité, intérêt)
5. Maximum 7 lignes, pas de signature`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { profile, session_id } = body as { profile: SourcedProfile; session_id: string };

  if (!profile || !session_id) {
    return new Response("missing profile or session_id", { status: 400 });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return new Response("MISTRAL_API_KEY not configured", { status: 500 });
  }

  const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      max_tokens: 400,
      stream: true,
      messages: [{ role: "user", content: buildPrompt(profile) }],
    }),
  });

  if (!mistralRes.ok) {
    const err = await mistralRes.text();
    return new Response(`Mistral error: ${err}`, { status: 500 });
  }

  let fullMessage = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = mistralRes.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const json = line.slice(6);
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              fullMessage += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          } catch {}
        }
      }

      if (fullMessage) {
        await db().from("outreach").insert({
          session_id,
          profile_key: profile.key,
          profile_name: profile.name,
          message: fullMessage,
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
