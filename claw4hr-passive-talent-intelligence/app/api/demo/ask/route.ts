import { NextRequest, NextResponse } from "next/server";
import type { SourcedProfile } from "@/app/lib/types";

/**
 * POST /api/demo/ask
 * Q&A on demo profiles (no HrFlow key) — uses Claude directly.
 * Body: { profile: SourcedProfile, question: string }
 */
export async function POST(req: NextRequest) {
  const { profile, question } = (await req.json()) as {
    profile: SourcedProfile;
    question: string;
  };

  if (!profile || !question) {
    return NextResponse.json({ error: "Missing profile or question" }, { status: 400 });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ data: { response: profile.summary } });
  }

  const systemPrompt = `Tu es un assistant recruteur expert. On te fournit le profil d'un candidat passif et une question d'un recruteur. Réponds en français, de façon concise (3-5 phrases max), factuelle et utile pour un recruteur.

Profil :
- Nom : ${profile.name}
- Titre : ${profile.title}
- Localisation : ${profile.location}
- Expérience : ${profile.experience_years} ans
- Entreprise actuelle : ${profile.experiences[0]?.company ?? "N/A"}
- Poste actuel : ${profile.experiences[0]?.title ?? profile.title}
- Compétences : ${profile.skills.join(", ")}
- Résumé : ${profile.summary}
${profile.experiences[1] ? `- Expérience précédente : ${profile.experiences[1].title} chez ${profile.experiences[1].company}` : ""}
${profile.educations[0] ? `- Formation : ${profile.educations[0].degree}, ${profile.educations[0].school}` : ""}`;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        max_tokens: 300,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ data: { response: profile.summary } });
    }

    const data = await res.json();
    const response = data.choices?.[0]?.message?.content ?? profile.summary;
    return NextResponse.json({ data: { response } });
  } catch {
    return NextResponse.json({ data: { response: profile.summary } });
  }
}
