import { NextRequest, NextResponse } from "next/server";
import type { SourcedProfile } from "@/app/lib/types";

/**
 * POST /api/demo/swot
 * Generate SWOT analysis for demo profiles (no HrFlow key) via Mistral.
 * Body: { profile: SourcedProfile, job_title?: string }
 */
export async function POST(req: NextRequest) {
  const { profile, job_title } = (await req.json()) as {
    profile: SourcedProfile;
    job_title?: string;
  };

  if (!profile) {
    return NextResponse.json({ error: "Missing profile" }, { status: 400 });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ data: buildFallback(profile) });
  }

  const jobContext = job_title ?? "Lead Data Scientist Python Paris";

  const prompt = `Tu es un expert RH. Analyse ce profil candidat pour le poste "${jobContext}".

Profil:
- Nom: ${profile.name}
- Titre: ${profile.title}
- Expérience: ${profile.experience_years} ans
- Compétences: ${profile.skills.join(", ")}
- Poste actuel: ${profile.experiences[0]?.title ?? profile.title} chez ${profile.experiences[0]?.company ?? "N/A"}
- Résumé: ${profile.summary}

Réponds en JSON strict avec ce format exact:
{
  "strengths": ["force 1", "force 2", "force 3"],
  "improvements": ["point d'attention 1", "point d'attention 2"]
}

3 forces maximum, 2 points d'attention maximum. Chaque item = 1 phrase courte et factuelle. JSON pur, sans markdown.`;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return NextResponse.json({ data: buildFallback(profile) });

    const completion = await res.json();
    const text = completion.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);

    return NextResponse.json({
      data: {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 2) : [],
      },
    });
  } catch {
    return NextResponse.json({ data: buildFallback(profile) });
  }
}

function buildFallback(profile: SourcedProfile) {
  const topSkills = profile.skills.slice(0, 3).join(", ");
  return {
    strengths: [
      `${profile.experience_years} ans d'expérience dans le domaine`,
      topSkills ? `Maîtrise de ${topSkills}` : "Profil technique confirmé",
      profile.experiences[0]?.company ? `Expérience en entreprise : ${profile.experiences[0].company}` : "Parcours solide",
    ],
    improvements: [
      "Informations complémentaires à vérifier en entretien",
      "Motivations pour une opportunité passive à confirmer",
    ],
  };
}
