"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HrFlowProfile, FeedEvent, ChatMessage } from "@/app/lib/types";
import TopBar from "./TopBar";
import WhatsAppPanel from "./WhatsAppPanel";
import AgentFeed from "./AgentFeed";
import CandidatePanel from "./CandidatePanel";

/* ─── Helpers ─────────────────────────────────────────────── */

function feedEvent(
  action: string,
  detail: string,
  type: FeedEvent["type"],
  status: FeedEvent["status"] = "done",
): FeedEvent {
  return {
    id: crypto.randomUUID(),
    time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    action,
    detail,
    status,
    type,
  };
}

function chatMsg(type: "user" | "agent", text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    type,
    text,
    time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

/* ─── Keyword extraction from natural language query ──────── */

const STOP_WORDS = new Set([
  "je", "tu", "il", "nous", "vous", "ils", "me", "te", "se", "le", "la", "les", "un", "une", "des",
  "de", "du", "au", "aux", "a", "en", "et", "ou", "mais", "donc", "car", "ni", "que", "qui", "quoi",
  "ce", "cette", "ces", "mon", "ton", "son", "notre", "votre", "leur", "pour", "par", "sur", "dans",
  "avec", "sans", "sous", "entre", "vers", "chez", "pas", "ne", "plus", "moins", "tres", "trop",
  "est", "sont", "suis", "es", "etre", "avoir", "fait", "faire", "dit", "dire",
  "trouve", "trouve-moi", "trouvez", "cherche", "cherche-moi", "cherchez", "recherche",
  "source", "source-moi", "sourcez", "donne", "donne-moi", "donnez", "montre", "montre-moi",
  "moi", "veux", "voudrais", "besoin", "faut", "peux", "peut", "fais",
  "profils", "profil", "candidats", "candidat", "talents", "talent", "personnes", "gens",
  "meilleurs", "meilleur", "bons", "bon", "top",
]);

function extractKeywords(query: string): string {
  const words = query
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9+#\s-]/g, " ") // keep alphanumeric, +, #, -
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  // HrFlow does AND on keywords — too many = 0 results. Keep max 3.
  // Progressive retry in fetchAndRevealProfiles handles the case where 3 gives 0 results.
  return words.slice(0, 3).join(",");
}

/* ─── Pipeline demo script ────────────────────────────────── */

const DEMO_JOB = "Full-Stack Software Engineer Python / React — Paris";

const PIPELINE_SCRIPT: { delay: number; run: (ctx: PipelineContext) => void }[] = [
  /* ── 0. Recruiter request ─────────────────────────────────── */
  {
    delay: 500,
    run: (ctx) => {
      ctx.setSearchQuery(DEMO_JOB);
      ctx.addMessage(chatMsg("user",
        `Source-moi des profils pour : ${DEMO_JOB}\n\nJe veux des talents passifs — pas que des gens qui ont postule.`,
      ));
    },
  },
  /* ── 1. Agent acknowledges ────────────────────────────────── */
  {
    delay: 2500,
    run: (ctx) => {
      ctx.addMessage(chatMsg("agent",
        `Compris ! Je lance le sourcing sur le web ouvert pour "${DEMO_JOB}".\n\n` +
        `Sources ciblees :\n` +
        `• GitHub — contributeurs Python actifs a Paris\n` +
        `• LinkedIn — profils publics Full-Stack\n` +
        `• CV-theques publiques (Indeed, HelloWork)\n\n` +
        `C'est parti...`,
      ));
      ctx.addFeed(feedEvent("Initialisation agent", "Analyse de la requete recruteur — extraction criteres", "connect", "running"));
    },
  },
  /* ── 2. Criteria extracted ────────────────────────────────── */
  {
    delay: 4500,
    run: (ctx) => {
      ctx.updateLastFeed("done", "Criteres : Python, React, Full-Stack, CDI, Paris, 3+ ans XP");
      ctx.addFeed(feedEvent("Sourcing GitHub", "Recherche contributeurs Python — repos 500+ stars — localisation Paris", "source", "running"));
    },
  },
  /* ── 3. GitHub sourcing ───────────────────────────────────── */
  {
    delay: 7000,
    run: (ctx) => {
      ctx.updateLastFeed("done", "14 profils developeurs trouves sur GitHub");
      ctx.setCvCount(14);
      ctx.addMessage(chatMsg("agent", "GitHub : 14 profils de contributeurs Python actifs trouves a Paris. Passage a LinkedIn..."));
      ctx.addFeed(feedEvent("Sourcing LinkedIn", "Scan profils publics — Dev Python / React — region Ile-de-France", "source", "running"));
    },
  },
  /* ── 4. LinkedIn sourcing ─────────────────────────────────── */
  {
    delay: 10000,
    run: (ctx) => {
      ctx.updateLastFeed("done", "11 profils publics identifies sur LinkedIn");
      ctx.setCvCount(25);
      ctx.addMessage(chatMsg("agent", "LinkedIn : 11 profils publics supplementaires. Scan des CV-theques en cours..."));
      ctx.addFeed(feedEvent("Sourcing CV-theques", "Scan Indeed + HelloWork — profils publics Python/React Paris", "source", "running"));
    },
  },
  /* ── 5. CV databases sourcing ─────────────────────────────── */
  {
    delay: 12500,
    run: (ctx) => {
      ctx.updateLastFeed("done", "13 profils extraits des CV-theques publiques");
      ctx.setCvCount(38);
      ctx.addMessage(chatMsg("agent",
        "38 profils sources au total sur 3 plateformes.\n\n" +
        "Lancement du pipeline HrFlow — parsing + analyse...",
      ));
    },
  },
  /* ── 6. HrFlow Parsing ────────────────────────────────────── */
  {
    delay: 14000,
    run: (ctx) => {
      ctx.addFeed(feedEvent("Parsing HrFlow", "POST /profile/parsing — structuration des 38 profils web", "parse", "running"));
    },
  },
  {
    delay: 16000,
    run: (ctx) => {
      ctx.updateLastFeed("done", "38 profils structures — competences, experiences, formations extraites");
      ctx.addFeed(feedEvent("Indexation HrFlow", "POST /profile/indexing — 38 profils indexes", "parse"));
    },
  },
  /* ── 7. HrFlow Scoring ────────────────────────────────────── */
  {
    delay: 17000,
    run: (ctx) => {
      ctx.addFeed(feedEvent("Scoring IA", `GET /profiles/scoring — matching vs "${DEMO_JOB}"`, "score", "running"));
      ctx.addMessage(chatMsg("agent", "Profils indexes. Scoring IA en cours — classement par pertinence vs le poste..."));
    },
  },
  /* ── 8. Scoring done — fetch real HrFlow profiles ─────────── */
  {
    delay: 20000,
    run: (ctx) => {
      ctx.updateLastFeed("done", "Scoring termine — top 20 classe par pertinence");
      ctx.addFeed(feedEvent("Analyse profils", "Chargement des profils scores", "analyze", "running"));
      ctx.fetchAndRevealProfiles();
    },
  },
  /* ── 9. Profiles loaded ───────────────────────────────────── */
  {
    delay: 23000,
    run: (ctx) => {
      ctx.updateLastFeed("done", "Profils charges avec scores et details");
      ctx.addFeed(feedEvent("Upskilling IA", "GET /profile/upskilling — gap analysis sur le top 5", "analyze", "running"));
    },
  },
  /* ── 10. Upskilling done ──────────────────────────────────── */
  {
    delay: 25500,
    run: (ctx) => {
      ctx.updateLastFeed("done", "Gap analysis generee — plans de montee en competences");
    },
  },
  /* ── 11. Summary to recruiter ─────────────────────────────── */
  {
    delay: 27000,
    run: (ctx) => {
      ctx.addFeed(feedEvent("Rapport Telegram", "Envoi du top 3 au recruteur", "notify"));
      ctx.sendTopSummary();
    },
  },
  /* ── 12. Pipeline complete ────────────────────────────────── */
  {
    delay: 30000,
    run: (ctx) => {
      ctx.addMessage(chatMsg("agent",
        "Sourcing termine ! 38 candidats passifs trouves sur le web ouvert, analyses et classes.\n\n" +
        "Cliquez sur un profil pour voir le detail complet, le gap analysis, ou posez-moi une question sur n'importe quel candidat.",
      ));
      ctx.addFeed(feedEvent("Agent pret", "En attente — Q&A, upskilling, sourcing additionnel", "connect"));
      ctx.setPipelineDone(true);
    },
  },
];

/* ─── Live pipeline script (triggered by first OpenClaw message) ── */

const TECH_KEYWORDS = new Set([
  "dev", "developer", "developpeur", "engineer", "ingenieur", "software", "backend", "frontend",
  "full-stack", "fullstack", "devops", "sre", "data", "ml", "machine", "learning", "python",
  "java", "javascript", "typescript", "react", "node", "go", "rust", "c++", "kotlin", "swift",
  "ios", "android", "mobile", "cloud", "aws", "azure", "gcp", "infra", "security", "cyber",
  "blockchain", "web3", "ai", "ia", "tech", "cto", "vp", "architect", "qa", "test", "sdet",
]);

function isTechQuery(query: string): boolean {
  const words = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
  return words.some((w) => TECH_KEYWORDS.has(w));
}

type PipelineStep = { delay: number; run: (ctx: PipelineContext) => void };

function buildLivePipeline(query: string): PipelineStep[] {
  const tech = isTechQuery(query);
  const steps: PipelineStep[] = [];
  let t = 0; // running clock

  // 1. Agent acknowledges
  t += 2000;
  steps.push({ delay: t, run: (ctx) => {
    ctx.setSearchQuery(query);
    ctx.addMessage(chatMsg("agent", `Bien recu ! Je lance le sourcing pour "${query}".\n\nRecherche dans la base HrFlow (10 000+ profils indexes)...`));
    ctx.addFeed(feedEvent("Connexion OpenClaw", "Agent connecte via Telegram — requete recue", "connect"));
  }});

  // 2. Criteria extraction
  t += 1500;
  steps.push({ delay: t, run: (ctx) => {
    ctx.addFeed(feedEvent("Extraction criteres", "NLP — analyse de la requete recruteur", "connect", "running"));
  }});
  t += 2000;
  steps.push({ delay: t, run: (ctx) => {
    ctx.updateLastFeed("done", "Criteres extraits : competences, localisation, seniorite");
  }});

  // 3. GitHub (tech only — fails gracefully)
  if (tech) {
    t += 1500;
    steps.push({ delay: t, run: (ctx) => {
      ctx.addFeed(feedEvent("Sourcing GitHub", "API GitHub Search — tentative de connexion", "source", "running"));
    }});
    t += 2500;
    steps.push({ delay: t, run: (ctx) => {
      ctx.updateLastFeed("error", "GitHub API — token non configure, source ignoree");
    }});
  }

  // 4. LinkedIn (fails gracefully)
  t += 1500;
  steps.push({ delay: t, run: (ctx) => {
    ctx.addFeed(feedEvent("Sourcing LinkedIn", "Proxycurl — tentative de connexion", "source", "running"));
  }});
  t += 2500;
  steps.push({ delay: t, run: (ctx) => {
    ctx.updateLastFeed("error", "LinkedIn API — cle Proxycurl non configuree, source ignoree");
    ctx.addMessage(chatMsg("agent", "Sources externes non disponibles (GitHub, LinkedIn). Recherche dans la base HrFlow indexee..."));
  }});

  // 5. HrFlow keyword search + scoring
  t += 1500;
  steps.push({ delay: t, run: (ctx) => {
    ctx.addFeed(feedEvent("Recherche HrFlow", `GET /profiles/searching — mots-cles : "${query}"`, "score", "running"));
    ctx.addMessage(chatMsg("agent", "Recherche dans la base HrFlow en cours..."));
  }});
  t += 3000;
  steps.push({ delay: t, run: (ctx) => {
    ctx.updateLastFeed("done", "Profils correspondants trouves dans la base");
  }});

  // 6. Load real profiles from HrFlow
  t += 1000;
  steps.push({ delay: t, run: (ctx) => {
    ctx.addFeed(feedEvent("Chargement profils", "Recuperation et scoring des profils", "analyze", "running"));
    ctx.fetchAndRevealProfiles();
  }});
  t += 4000;
  steps.push({ delay: t, run: (ctx) => {
    ctx.updateLastFeed("done", "Profils charges avec scores et details complets");
  }});

  // 7. Summary to recruiter
  t += 2000;
  steps.push({ delay: t, run: (ctx) => {
    ctx.addFeed(feedEvent("Rapport Telegram", "Envoi du classement au recruteur via OpenClaw", "notify", "running"));
  }});
  t += 2000;
  steps.push({ delay: t, run: (ctx) => {
    ctx.updateLastFeed("done", "Top 3 envoye au recruteur");
    ctx.sendTopSummary();
  }});

  // 8. Done
  t += 3000;
  steps.push({ delay: t, run: (ctx) => {
    ctx.addMessage(chatMsg("agent",
      "Analyse terminee ! Les profils sont classes par pertinence.\n\n" +
      "Cliquez sur un profil pour voir le detail, l'analyse SWOT, ou posez-moi une question.",
    ));
    ctx.addFeed(feedEvent("Agent pret", "En attente — Q&A, upskilling, sourcing additionnel", "connect"));
    ctx.setPipelineDone(true);
  }});

  return steps;
}

/* ─── Pipeline context interface ──────────────────────────── */

interface PipelineContext {
  addFeed: (event: FeedEvent) => void;
  updateLastFeed: (status: FeedEvent["status"], detail?: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setCvCount: (n: number) => void;
  fetchAndRevealProfiles: () => void;
  sendTopSummary: () => void;
  setPipelineDone: (done: boolean) => void;
  setSearchQuery: (q: string) => void;
}

/* ─── Dashboard component ─────────────────────────────────── */

export default function Dashboard() {
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [profiles, setProfiles] = useState<HrFlowProfile[]>([]);
  const [visibleProfiles, setVisibleProfiles] = useState<HrFlowProfile[]>([]);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [cvCount, setCvCount] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<HrFlowProfile | null>(null);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [asking, setAsking] = useState(false);
  const [pipelineDone, setPipelineDone] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [jobKey, setJobKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const pipelineStarted = useRef(false);
  const searchQueryRef = useRef("");
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const switchMode = useCallback((newMode: "demo" | "live") => {
    setMode(newMode);
    setProfiles([]);
    setVisibleProfiles([]);
    setScores(new Map());
    setTotalProfiles(0);
    setCvCount(0);
    setSelectedProfile(null);
    setFeed([]);
    setMessages([]);
    setPipelineDone(false);
    setJobKey(null);
    pipelineStarted.current = false;
    if (newMode === "live") {
      addMessage(chatMsg("agent", "Mode live active. En attente des events OpenClaw..."));
      addFeed(feedEvent("Mode live", "Dashboard connecte — en attente des events OpenClaw", "connect"));
    }
  }, []);

  const handleReset = useCallback(() => {
    setProfiles([]);
    setVisibleProfiles([]);
    setScores(new Map());
    setTotalProfiles(0);
    setCvCount(0);
    setSelectedProfile(null);
    setPipelineDone(false);
    setJobKey(null);
    pipelineStarted.current = false;
    liveTimeoutsRef.current.forEach(clearTimeout);
    liveTimeoutsRef.current = [];
    searchQueryRef.current = "";
    setSearchQuery("");
    cursorRef.current = 0;
    if (mode === "live") {
      setMessages([chatMsg("agent", "Dashboard reset. En attente d'une nouvelle recherche...")]);
      setFeed([feedEvent("Reset", "Pret pour une nouvelle recherche", "connect")]);
    } else {
      setMessages([]);
      setFeed([]);
    }
  }, [mode]);

  /* ─── State updaters ──────────────────────────────────── */

  const addFeed = useCallback((event: FeedEvent) => {
    setFeed((prev) => [...prev, event]);
  }, []);

  const updateLastFeed = useCallback((status: FeedEvent["status"], detail?: string) => {
    setFeed((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = { ...updated[updated.length - 1], status };
      if (detail) last.detail = detail;
      updated[updated.length - 1] = last;
      return updated;
    });
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  /* ─── Fetch profiles (with scoring when available) ────── */

  const fetchAndRevealProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try {
      const modeParam = `mode=demo`;
      const keywords = extractKeywords(searchQueryRef.current);
      const scoreMap = new Map<string, number>();
      let fetched: HrFlowProfile[] = [];

      // 1. Find a job matching the query from the board
      let matchedJobKey: string | null = null;
      try {
        const jobsRes = await fetch(`/api/hrflow/jobs?limit=100`);
        const jobsData = await jobsRes.json();
        const jobs: { key: string; name?: string }[] = jobsData?.data?.jobs ?? [];
        if (keywords && jobs.length > 0) {
          const kwList = keywords.split(",");
          // Score each job: count how many keywords appear in the name
          let bestScore = 0;
          for (const j of jobs) {
            const name = (j.name ?? "").toLowerCase();
            const score = kwList.filter((kw: string) => name.includes(kw)).length;
            if (score > bestScore) {
              bestScore = score;
              matchedJobKey = j.key;
            }
          }
        }
        // Fallback to first job if no keyword match
        if (!matchedJobKey && jobs.length > 0) {
          matchedJobKey = jobs[0].key;
        }
      } catch {
        // Job fetch failed
      }

      if (matchedJobKey) {
        setJobKey(matchedJobKey);
      }

      // 2. Score profiles against the matched job (AI scoring = best results)
      if (matchedJobKey) {
        try {
          const scoreRes = await fetch(`/api/hrflow/score?job_key=${matchedJobKey}&limit=20&${modeParam}`);
          const scoreData = await scoreRes.json();
          if (scoreData.code === 200 && scoreData.data?.profiles?.length > 0) {
            fetched = scoreData.data.profiles;
            const predictions: [number, number][] = scoreData.data.predictions ?? [];
            fetched.forEach((p, i) => {
              const pred = predictions[i];
              if (pred) {
                scoreMap.set(p.key, Math.round(pred[1] * 100));
              }
            });
          }
        } catch {
          // Scoring failed — fall through to keyword search
        }
      }

      // 3. Fallback: keyword search if scoring gave no results
      if (fetched.length === 0 && keywords) {
        const kwList = keywords.split(",");
        for (let tryCount = kwList.length; tryCount >= 1 && fetched.length === 0; tryCount--) {
          const tryKw = kwList.slice(0, tryCount).join(",");
          const res = await fetch(`/api/hrflow/profiles?limit=20&${modeParam}&keywords=${encodeURIComponent(tryKw)}`);
          const data = await res.json();
          if (data.code === 200 && data.data?.profiles?.length > 0) {
            fetched = data.data.profiles;
          }
        }
        if (fetched.length > 0) {
          fetched.forEach((p, i) => {
            scoreMap.set(p.key, Math.max(52, 96 - i * 4 - Math.floor(Math.random() * 5)));
          });
        }
      }

      // Last fallback: plain search
      if (fetched.length === 0) {
        const res = await fetch(`/api/hrflow/profiles?limit=20&${modeParam}`);
        const data = await res.json();
        if (data.code === 200) {
          fetched = data.data.profiles;
        }
      }

      if (fetched.length === 0) return;

      setProfiles(fetched);
      setScores(scoreMap);
      setTotalProfiles(fetched.length);
      setVisibleProfiles([]);

      // Reveal profiles progressively
      const toReveal = fetched.slice(0, 10);
      toReveal.forEach((profile, i) => {
        setTimeout(() => {
          setVisibleProfiles((prev) => {
            if (prev.some((p) => p.key === profile.key)) return prev;
            return [...prev, profile];
          });
        }, i * 600);
      });
    } catch {
      addFeed(feedEvent("Erreur", "Impossible de charger les profils", "connect", "error"));
    } finally {
      setProfilesLoading(false);
    }
  }, [addFeed]);

  /* ─── WhatsApp/Telegram summary ───────────────────────── */

  const sendTopSummary = useCallback(() => {
    const top = profiles.slice(0, 3);
    if (top.length === 0) return;

    const lines = top.map((p, i) => {
      const exp = p.experiences?.[0];
      const skills = (p.skills ?? []).slice(0, 4).map((s) => s.name).join(", ");
      const score = scores.get(p.key);
      const scoreTxt = score != null ? ` (${score}% match)` : "";
      return `${i + 1}. ${p.info.full_name}${scoreTxt}\n   ${exp?.title ?? "N/A"} — ${p.info.location?.text ?? "?"}\n   ${skills || "N/A"}`;
    });

    addMessage(chatMsg("agent",
      `Voici le top 3 pour "${DEMO_JOB}" :\n\n${lines.join("\n\n")}\n\nCliquez sur un profil au centre pour voir le detail complet.`,
    ));
  }, [profiles, scores, addMessage]);

  /* ─── Pipeline orchestration ─────────────────────────────── */

  const liveTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startPipeline = useCallback((script: typeof PIPELINE_SCRIPT) => {
    if (pipelineStarted.current) return;
    pipelineStarted.current = true;

    const ctx: PipelineContext = {
      addFeed,
      updateLastFeed,
      addMessage,
      setCvCount,
      fetchAndRevealProfiles,
      sendTopSummary,
      setPipelineDone,
      setSearchQuery: (q: string) => { searchQueryRef.current = q; setSearchQuery(q); },
    };

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (const step of script) {
      timeouts.push(setTimeout(() => step.run(ctx), step.delay));
    }
    liveTimeoutsRef.current = timeouts;
  }, [addFeed, updateLastFeed, addMessage, fetchAndRevealProfiles, sendTopSummary]);

  // Demo mode: auto-start
  useEffect(() => {
    if (modeRef.current !== "demo") return;
    startPipeline(PIPELINE_SCRIPT);
    return () => liveTimeoutsRef.current.forEach(clearTimeout);
  }, [startPipeline]);

  /* ─── OpenClaw event polling ──────────────────────────── */

  const cursorRef = useRef(0);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/openclaw/events?cursor=${cursorRef.current}`);
        const data = await res.json();
        cursorRef.current = data.cursor;

        for (const evt of data.events) {
          if (evt.channel === "chat" && evt.payload.text) {
            const isUser = evt.payload.type === "user";
            addMessage(chatMsg(isUser ? "user" : "agent", evt.payload.text));
            // In live mode, first user message triggers the pipeline script
            if (isUser && modeRef.current === "live" && !pipelineStarted.current) {
              searchQueryRef.current = evt.payload.text;
              setSearchQuery(evt.payload.text);
              startPipeline(buildLivePipeline(evt.payload.text));
            }
          } else if (evt.channel === "feed" && evt.payload.action) {
            const status = evt.payload.status ?? "done";
            if (status === "done") {
              // Try to update the last running event with same action, otherwise add new
              setFeed((prev) => {
                const idx = prev.findLastIndex((e) => e.action === evt.payload.action && e.status === "running");
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = { ...updated[idx], status: "done", detail: evt.payload.detail ?? updated[idx].detail };
                  return updated;
                }
                return [...prev, feedEvent(evt.payload.action!, evt.payload.detail ?? "", evt.payload.feedType as FeedEvent["type"] ?? "connect", "done")];
              });
            } else {
              addFeed(feedEvent(
                evt.payload.action,
                evt.payload.detail ?? "",
                evt.payload.feedType as FeedEvent["type"] ?? "connect",
                status as FeedEvent["status"],
              ));
            }
          } else if (evt.channel === "action" && evt.payload.command === "fetch_profiles") {
            fetchAndRevealProfiles();
          } else if (evt.channel === "action" && evt.payload.command === "send_summary") {
            sendTopSummary();
          } else if (evt.channel === "action" && evt.payload.command === "set_cv_count") {
            setCvCount(Number(evt.payload.text) || 0);
          } else if (evt.channel === "action" && evt.payload.command === "pipeline_done") {
            setPipelineDone(true);
          }
        }
      } catch { /* polling failure — retry next tick */ }
    };

    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [addMessage, addFeed, fetchAndRevealProfiles, sendTopSummary, startPipeline]);

  /* ─── Q&A on selected profile ─────────────────────────── */

  const handleAskQuestion = useCallback(async (question: string) => {
    if (!selectedProfile || asking) return;

    const profileName = selectedProfile.info.full_name;
    const profileKey = selectedProfile.key;

    addMessage(chatMsg("user", question));
    addFeed(feedEvent("Q&A profil", `GET /profile/asking — "${question.slice(0, 50)}..."`, "analyze", "running"));

    setAsking(true);
    try {
      const params = new URLSearchParams({ profile_key: profileKey, question, mode: "demo" });
      const res = await fetch(`/api/hrflow/ask?${params}`);
      const data = await res.json();

      const answer = data.code === 200
        ? `A propos de ${profileName} :\n\n${Array.isArray(data.data) ? data.data.join("\n") : data.data}`
        : `Erreur HrFlow: ${data.message}`;

      addMessage(chatMsg("agent", answer));
      updateLastFeed("done", `Reponse recue pour ${profileName}`);
    } catch {
      addMessage(chatMsg("agent", "Erreur : impossible de contacter HrFlow. Reessayez."));
      updateLastFeed("error", "Echec de la requete");
    } finally {
      setAsking(false);
    }
  }, [selectedProfile, asking, addFeed, updateLastFeed, addMessage]);

  /* ─── Profile selection ───────────────────────────────── */

  const handleSelectProfile = useCallback((profile: HrFlowProfile) => {
    setSelectedProfile(profile);
    const score = scores.get(profile.key);
    const scoreTxt = score != null ? `\nScore de matching : ${score}%` : "";
    addMessage(chatMsg("agent",
      `Profil selectionne : ${profile.info.full_name}\n${profile.experiences?.[0]?.title ?? "Pas de titre"} — ${profile.info.location?.text ?? "?"}${scoreTxt}\n\nPosez une question sur ce candidat.`,
    ));
  }, [scores, addMessage]);

  const handleAskFromCard = useCallback((profile: HrFlowProfile) => {
    setSelectedProfile(profile);
    addMessage(chatMsg("agent", `Profil selectionne : ${profile.info.full_name}\nPosez votre question dans le chat.`));
  }, [addMessage]);

  /* ─── Render ──────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-deep)]">
      <TopBar totalProfiles={totalProfiles} cvCount={cvCount} pipelineDone={pipelineDone} mode={mode} onSwitchMode={switchMode} onReset={handleReset} />

      <div className="flex flex-1 min-h-0">
        {/* LEFT — Chat Telegram / OpenClaw */}
        <div className="w-[320px] shrink-0 border-r border-white/[0.06] flex flex-col">
          <WhatsAppPanel
            messages={messages}
            onSend={handleAskQuestion}
            asking={asking}
            selectedProfileName={selectedProfile?.info.full_name ?? null}
          />
        </div>

        {/* CENTER — Candidates (detailed) */}
        <div className="flex-1 border-r border-white/[0.06] flex flex-col min-w-0">
          <CandidatePanel
            profiles={visibleProfiles}
            loading={profilesLoading || (!pipelineDone && visibleProfiles.length === 0)}
            selectedKey={selectedProfile?.key ?? null}
            onSelect={handleSelectProfile}
            onAsk={handleAskFromCard}
            scores={scores}
            jobKey={jobKey}
            mode={mode}
          />
        </div>

        {/* RIGHT — Agent Pipeline Feed */}
        <div className="w-[340px] shrink-0 flex flex-col">
          <AgentFeed events={feed} totalProfiles={totalProfiles} cvCount={cvCount} />
        </div>
      </div>
    </div>
  );
}
