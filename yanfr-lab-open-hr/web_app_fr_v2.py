"""
AI Agent avec OpenClaw — Version 2
Nouveautés v2 :
  - Question de stabilité des employés dans le questionnaire général
  - Poids dynamiques par question (slider côté frontend → envoyés au backend)
  - Évaluation de la stabilité des candidats (durée moyenne de tenure)
Port 8002.
"""

import json
import os
import re
import sys
import time
import uuid
from collections import Counter
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(__file__))

from config import config
from hrflow.client import HrFlowClient

app = FastAPI(title="AI Agent avec OpenClaw v2")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory="static"), name="static")

sessions: dict = {}
hrflow = HrFlowClient()


# ─── Request Models ───────────────────────────────────────────────────────────

class StartRequest(BaseModel):
    job_title: str
    job_description: str

class SubmitAnswersRequest(BaseModel):
    session_id: str
    answers: dict
    weights: dict = {}   # { question_id: slider_value (1–5) }

class RefineRequest(BaseModel):
    session_id: str
    refinement: str


# ─── Catégorie de poste ────────────────────────────────────────────────────────

CATEGORY_SIGNALS = {
    "frontend":  ["frontend","front-end","前端","react","vue","angular","svelte","css","html",
                  "webpack","vite","nextjs","nuxt","ui/ux","界面","interface","intégration"],
    "backend":   ["backend","back-end","后端","服务端","api","server","django","flask","fastapi",
                  "spring","rails","express","nestjs","grpc","microservice","微服务","serveur"],
    "fullstack":  ["fullstack","full-stack","全栈","full stack","complet","polyvalent"],
    "mobile":    ["mobile","移动端","ios","android","swift","kotlin","react native","flutter","xamarin","application mobile"],
    "devops":    ["devops","sre","运维","infrastructure","kubernetes","k8s","docker","ci/cd","pipeline",
                  "terraform","ansible","aws","gcp","azure","cloud","nuage"],
    "ml":        ["machine learning","deep learning","机器学习","深度学习","algorithme","ai engineer",
                  "pytorch","tensorflow","nlp","cv","computer vision","llm","大模型","ia","intelligence artificielle"],
    "data":      ["data engineer","data analyst","数据工程","数据分析","etl","spark","flink",
                  "hadoop","kafka","数仓","数据仓库","bi","tableau","airflow","données","analyse"],
    "security":  ["security","安全","penetration","渗透","ctf","soc","siem","sécurité","cybersécurité"],
    "embedded":  ["embedded","嵌入式","firmware","rtos","stm32","fpga","驱动","内核","embarqué","temps réel"],
}

SPECIFIC_QUESTIONS: dict[str, list] = {
    "frontend": [
        {"id":"s1","question":"Frameworks front-end requis (plusieurs choix possibles)",
         "type":"multiple_choice","options":["React","Vue.js","Angular","Svelte","JS/TS natif"],"weight":5},
        {"id":"s2","question":"Niveau TypeScript exigé",
         "type":"single_choice","options":["Maîtrise obligatoire","Expérience souhaitée","Atout","Non requis"],"weight":4},
        {"id":"s3","question":"Solutions CSS / styles (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Tailwind CSS","CSS Modules","Styled-components","SCSS/LESS","Libre"],"weight":3},
        {"id":"s4","question":"Expérience en optimisation des performances (Core Web Vitals, etc.)",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":4},
        {"id":"s5","question":"Expérience en outillage front-end (build tools, bundlers)",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":3},
        {"id":"s6","question":"Participation à un Design System ou bibliothèque de composants",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":3},
        {"id":"s7","question":"Expérience SSR / SSG (Next.js, Nuxt.js, etc.)",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":3},
    ],
    "backend": [
        {"id":"s1","question":"Langages de programmation principaux (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Python","Java","Go","Node.js","C++","Rust","PHP","Ruby"],"weight":5},
        {"id":"s2","question":"Bases de données requises (plusieurs choix possibles)",
         "type":"multiple_choice","options":["PostgreSQL","MySQL","MongoDB","Redis","Elasticsearch","ClickHouse","Libre"],"weight":4},
        {"id":"s3","question":"Expérience microservices / systèmes distribués",
         "type":"single_choice","options":["Obligatoire (3+ ans)","Expérience souhaitée","Atout","Non requis"],"weight":4},
        {"id":"s4","question":"Style d'API requis (plusieurs choix possibles)",
         "type":"multiple_choice","options":["RESTful","GraphQL","gRPC","WebSocket","Libre"],"weight":3},
        {"id":"s5","question":"Expérience en messagerie (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Kafka","RabbitMQ","RocketMQ","Redis Pub/Sub","Non requis"],"weight":3},
        {"id":"s6","question":"Expérience cloud",
         "type":"single_choice","options":["Cloud-native obligatoire","Usage de base suffisant","Atout","Non requis"],"weight":3},
        {"id":"s7","question":"Conception de systèmes haute disponibilité / haute charge",
         "type":"single_choice","options":["Obligatoire (million RPS)","Échelle moyenne","Atout","Non requis"],"weight":5},
    ],
    "fullstack": [
        {"id":"s1","question":"Préférence stack front-end (plusieurs choix possibles)",
         "type":"multiple_choice","options":["React","Vue.js","Angular","Next.js","Nuxt","Libre"],"weight":4},
        {"id":"s2","question":"Préférence stack back-end (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Node.js","Python","Java","Go","PHP","Libre"],"weight":4},
        {"id":"s3","question":"Répartition front / back du poste",
         "type":"single_choice","options":["Front dominant (70/30)","Équilibré (50/50)","Back dominant (30/70)","Flexible"],"weight":3},
        {"id":"s4","question":"Expérience de développement produit complet en autonomie",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":4},
        {"id":"s5","question":"Bases de données (plusieurs choix possibles)",
         "type":"multiple_choice","options":["PostgreSQL","MySQL","MongoDB","Redis","Libre"],"weight":3},
        {"id":"s6","question":"Expérience DevOps / déploiement (Docker, CI/CD)",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":3},
    ],
    "mobile": [
        {"id":"s1","question":"Plateformes cibles (plusieurs choix possibles)",
         "type":"multiple_choice","options":["iOS (Swift/ObjC)","Android (Kotlin/Java)","React Native","Flutter","HarmonyOS"],"weight":5},
        {"id":"s2","question":"Expérience de publication App Store / Google Play",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":4},
        {"id":"s3","question":"Optimisation des performances (mémoire, rendu, batterie)",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":4},
        {"id":"s4","question":"Développement de modules natifs / hybride",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":3},
        {"id":"s5","question":"CI/CD et automatisation des builds / releases",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":3},
    ],
    "devops": [
        {"id":"s1","question":"Plateformes cloud utilisées (plusieurs choix possibles)",
         "type":"multiple_choice","options":["AWS","GCP","Azure","Alibaba Cloud","Tencent Cloud","OVH"],"weight":5},
        {"id":"s2","question":"Expérience Kubernetes",
         "type":"single_choice","options":["Expert (production)","Expérience en utilisation","Notions suffisantes","Non requis"],"weight":5},
        {"id":"s3","question":"Outils IaC (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Terraform","Ansible","Pulumi","CloudFormation","Non requis"],"weight":4},
        {"id":"s4","question":"Monitoring / alerting (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Prometheus/Grafana","ELK Stack","Datadog","Libre"],"weight":3},
        {"id":"s5","question":"Gestion de clusters à grande échelle (100+ nœuds)",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":4},
        {"id":"s6","question":"Compétences en développement / scripting",
         "type":"single_choice","options":["Dev requis (Python/Go)","Scripts shell suffisants","Non requis"],"weight":3},
    ],
    "ml": [
        {"id":"s1","question":"Frameworks ML requis (plusieurs choix possibles)",
         "type":"multiple_choice","options":["PyTorch","TensorFlow","JAX","scikit-learn","XGBoost","Libre"],"weight":5},
        {"id":"s2","question":"Profil recherche",
         "type":"single_choice","options":["Publications (NeurIPS/ICML/ACL…)","Publications souhaitées","Ingénierie avant tout","Non requis"],"weight":4},
        {"id":"s3","question":"Expérience en déploiement de modèles",
         "type":"single_choice","options":["Obligatoire (TorchServe/Triton/ONNX)","Atout","Non requis"],"weight":4},
        {"id":"s4","question":"Expérience LLM / grands modèles",
         "type":"single_choice","options":["Obligatoire (Fine-tuning/RAG/Agent)","Atout","Non requis"],"weight":4},
        {"id":"s5","question":"Volume de données traité",
         "type":"single_choice","options":["Échelle TB+","Échelle GB suffisant","Non requis"],"weight":3},
        {"id":"s6","question":"Entraînement sur clusters GPU",
         "type":"single_choice","options":["Obligatoire (distribué)","Multi-GPU mono-machine","Atout","Non requis"],"weight":4},
    ],
    "data": [
        {"id":"s1","question":"Stack data requise (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Spark","Flink","Hive","Kafka","Airflow","dbt","Libre"],"weight":5},
        {"id":"s2","question":"Entrepôts de données (plusieurs choix possibles)",
         "type":"multiple_choice","options":["ClickHouse","BigQuery","Redshift","Snowflake","Hudi/Iceberg","Libre"],"weight":4},
        {"id":"s3","question":"Volumétrie des données",
         "type":"single_choice","options":["Échelle PB","Échelle TB","Échelle GB","Libre"],"weight":4},
        {"id":"s4","question":"Modélisation data warehouse (ODS/DW/DM)",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":4},
        {"id":"s5","question":"Outils BI (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Tableau","Power BI","Superset","Metabase","Non requis"],"weight":3},
        {"id":"s6","question":"Langages requis (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Python","SQL (expert)","Scala","Java","Libre"],"weight":4},
    ],
    "security": [
        {"id":"s1","question":"Domaines de sécurité (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Tests d'intrusion","Audit de code","Développement sécurisé (SDL)","SOC/Réponse incident","Sécurité cloud","Libre"],"weight":5},
        {"id":"s2","question":"Découverte de vulnérabilités / CVE publiés",
         "type":"single_choice","options":["Obligatoire (CVE publiés préférés)","Atout","Non requis"],"weight":4},
        {"id":"s3","question":"Outils de sécurité (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Burp Suite","Metasploit","Nmap","Wireshark","Outils maison"],"weight":3},
        {"id":"s4","question":"Conformité réglementaire (ISO 27001, RGPD, etc.)",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":3},
    ],
    "embedded": [
        {"id":"s1","question":"Domaines embarqués (plusieurs choix possibles)",
         "type":"multiple_choice","options":["Développement drivers","RTOS","BSP","FPGA","Firmware"],"weight":5},
        {"id":"s2","question":"Plateformes matérielles (plusieurs choix possibles)",
         "type":"multiple_choice","options":["ARM Cortex-M","ARM Cortex-A","RISC-V","x86","DSP","Libre"],"weight":4},
        {"id":"s3","question":"Protocoles de communication (plusieurs choix possibles)",
         "type":"multiple_choice","options":["SPI/I2C/UART","CAN","Ethernet","BLE/WiFi","Libre"],"weight":3},
        {"id":"s4","question":"Développement noyau Linux",
         "type":"single_choice","options":["Obligatoire","Atout","Non requis"],"weight":4},
    ],
    "general": [
        {"id":"s1","question":"Niveau de spécialisation technique",
         "type":"single_choice","options":["Expert (spécialité pointue)","Généraliste (large spectre)","Manager technique","Libre"],"weight":4},
        {"id":"s2","question":"Taille d'équipe / projet préférée",
         "type":"single_choice","options":["Grande entreprise (100+)","Équipe moyenne (20-100)","Startup / petite équipe (<20)","Libre"],"weight":3},
        {"id":"s3","question":"Contributions open-source",
         "type":"single_choice","options":["Obligatoire (100+ stars)","Atout","Non requis"],"weight":3},
        {"id":"s4","question":"Expérience management d'équipe",
         "type":"single_choice","options":["Obligatoire (5+ personnes)","Petite équipe suffisant","Non requis"],"weight":4},
        {"id":"s5","question":"Documentation technique / conférences",
         "type":"single_choice","options":["Obligatoire (blog/talks)","Atout","Non requis"],"weight":2},
        {"id":"s6","question":"Collaboration cross-équipes",
         "type":"single_choice","options":["Très important","Important","Neutre","Peu important"],"weight":3},
    ],
}

# ── Nouvelle question stabilité (ajoutée aux questions générales) ──────────────
STABILITY_QUESTION = {
    "id": "g_stab",
    "question": "Préférence en matière de stabilité des employés",
    "type": "single_choice",
    "options": [
        "Stabilité forte (durée moyenne ≥ 3 ans par poste)",
        "Stabilité modérée (1–3 ans par poste)",
        "Mobilité acceptée (CDD, freelance, missions courtes)",
        "Sans critère de stabilité",
    ],
    "weight": 3,
}

GENERAL_QUESTIONS = [
    {"id":"g1","question":"Mode de travail souhaité",
     "type":"single_choice","options":["100% télétravail","Hybride (partiel télétravail)","Présentiel","Flexible"],"weight":3},
    {"id":"g2","question":"Niveau d'études minimum",
     "type":"single_choice","options":["Sans critère","Bac+2","Licence (grandes écoles préférées)","Licence","Master","Doctorat"],"weight":3},
    {"id":"g3","question":"Années d'expérience minimum",
     "type":"single_choice","options":["Sans critère","1 an et +","3 ans et +","5 ans et +","8 ans et +","10 ans et +"],"weight":5},
    {"id":"g4","question":"Langues requises (plusieurs choix possibles)",
     "type":"multiple_choice","options":["Français (langue maternelle)","Anglais (lu/écrit)","Anglais (courant oral)","Espagnol","Autre"],"weight":3},
    {"id":"g5","question":"Fourchette de salaire mensuel brut (indicatif)",
     "type":"single_choice",
     "options":["< 2 500 €","2 500–4 000 €","4 000–6 000 €","6 000–8 500 €","8 500 € +","À négocier"],"weight":1},
    STABILITY_QUESTION,   # ← nouvelle question v2
]


# ─── Générateur de questionnaire ──────────────────────────────────────────────

def _detect_category(title: str, description: str) -> str:
    text = (title + " " + description).lower()
    scores: dict[str, int] = {}
    for cat, keywords in CATEGORY_SIGNALS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score:
            scores[cat] = score
    if not scores:
        return "general"
    return max(scores, key=scores.get)


def _extract_mentioned_techs(description: str) -> list[str]:
    ALL_TECHS = [
        "React","Vue","Angular","Next.js","Nuxt","Svelte","TypeScript","JavaScript",
        "Python","Java","Go","Golang","Rust","C++","C#","PHP","Ruby","Swift","Kotlin",
        "Django","Flask","FastAPI","Spring","Rails","Express","NestJS","Laravel",
        "PostgreSQL","MySQL","MongoDB","Redis","Elasticsearch","ClickHouse","SQLite",
        "AWS","GCP","Azure","Kubernetes","Docker","Terraform","Ansible","CI/CD","GitHub Actions",
        "Kafka","RabbitMQ","Spark","Flink","Airflow","dbt","Hadoop",
        "PyTorch","TensorFlow","scikit-learn","LLM","RAG","GPT","BERT",
        "GraphQL","gRPC","REST","WebSocket","Prometheus","Grafana","ELK",
        "Flutter","React Native","iOS","Android","SwiftUI",
    ]
    found = []
    desc_lower = description.lower()
    for tech in ALL_TECHS:
        if tech.lower() in desc_lower and tech not in found:
            found.append(tech)
    return found[:8]


def _generate_questionnaire(job_title: str, job_description: str) -> dict:
    category = _detect_category(job_title, job_description)
    specific_qs = SPECIFIC_QUESTIONS.get(category, SPECIFIC_QUESTIONS["general"])

    mentioned = _extract_mentioned_techs(job_description)
    extra_qs = []
    if mentioned:
        extra_qs.append({
            "id": "s_dyn",
            "question": "Parmi les technologies mentionnées dans la fiche de poste, lesquelles sont indispensables ? (plusieurs choix possibles)",
            "type": "multiple_choice",
            "options": mentioned + ["Toutes sont des atouts"],
            "weight": 5,
        })

    return {
        "general": GENERAL_QUESTIONS,
        "specific": extra_qs + specific_qs,
        "_category": category,
        "_mentioned_techs": mentioned,
    }


# ─── Stabilité des candidats ──────────────────────────────────────────────────

def _average_tenure_years(profile: dict) -> float:
    """Calcule la durée moyenne (en années) par poste dans le profil."""
    total_years = float(profile.get("experiences_duration") or 0)
    n_exp = len(profile.get("experiences", []))
    if total_years <= 0 or n_exp == 0:
        return 0.0
    return round(total_years / n_exp, 1)


# ─── Interprétation des réponses ──────────────────────────────────────────────

def _interpret_answers(questionnaire: dict, answers: dict, user_weights: dict = None) -> dict:
    """user_weights : { qid: int(1-5) } — overrides question's default weight."""
    q_map: dict[str, dict] = {}
    for q in questionnaire.get("general", []) + questionnaire.get("specific", []):
        q_map[q["id"]] = q

    required_skills: list[str] = []
    preferred_skills: list[str] = []
    min_years = 0
    max_years = 0
    education_level = "none"
    work_mode = "any"
    languages: list[str] = []
    stability_pref = "none"   # "high" | "moderate" | "flexible" | "none"

    def effective_weight(qid: str, default: int) -> int:
        if user_weights and qid in user_weights:
            return int(user_weights[qid])
        return default

    for qid, answer in answers.items():
        q = q_map.get(qid, {})
        q_text = q.get("question", "").lower()
        weight = effective_weight(qid, q.get("weight", 3))
        ans_list = answer if isinstance(answer, list) else [answer] if answer else []

        # Stabilité
        if "stabilité" in q_text:
            for a in ans_list:
                a_lower = a.lower()
                if "≥ 3" in a or "forte" in a_lower:
                    stability_pref = "high"
                elif "1–3" in a or "modérée" in a_lower:
                    stability_pref = "moderate"
                elif "mobilité" in a_lower or "acceptée" in a_lower:
                    stability_pref = "flexible"
            continue

        # Mode de travail
        if "mode de travail" in q_text or "télétravail" in q_text:
            mode_map = {"100% télétravail": "remote", "hybride": "hybrid", "présentiel": "onsite"}
            for k, v in mode_map.items():
                if any(k in a.lower() for a in ans_list):
                    work_mode = v
                    break

        # Niveau d'études
        elif "études" in q_text or "niveau" in q_text:
            edu_map = {"doctorat": "phd", "master": "master", "licence": "bachelor", "bac+2": "none"}
            for k, v in edu_map.items():
                if any(k in a.lower() for a in ans_list):
                    education_level = v
                    break

        # Années d'expérience
        elif "expérience" in q_text and ("ans" in str(ans_list).lower() or "an" in str(ans_list).lower()):
            for a in ans_list:
                m = re.search(r"(\d+)", str(a))
                if m:
                    min_years = max(min_years, int(m.group(1)))

        # Langues
        elif "langues" in q_text:
            languages = [a for a in ans_list if "autre" not in a.lower() and "français" not in a.lower()]

        # Technologies fiche de poste
        elif "fiche de poste" in q_text or "mentionnées" in q_text:
            for a in ans_list:
                if "atout" in a.lower():
                    continue
                if a and a not in required_skills:
                    required_skills.append(a)

        # Compétences / outils — seuil weight dynamique
        elif any(kw in q_text for kw in
                 ["framework","stack","langage","outil","plateforme","domaine","base de données",
                  "messagerie","protocole","matérielle","entrepôt"]):
            clean = [a for a in ans_list if a and "libre" not in a.lower() and "non requis" not in a.lower()]
            if weight >= 4:
                required_skills.extend(c for c in clean if c not in required_skills)
            elif weight >= 2:
                preferred_skills.extend(c for c in clean if c not in preferred_skills)

        # Questions binaires
        elif any(kw in q_text for kw in ["obligatoire","expérience","participation","niveau","conception"]):
            for a in ans_list:
                if "obligatoire" in a.lower() or "maîtrise obligatoire" in a.lower():
                    concept = _extract_concept_fr(q_text)
                    if concept and concept not in required_skills:
                        required_skills.append(concept)
                elif "atout" in a.lower():
                    concept = _extract_concept_fr(q_text)
                    if concept and concept not in preferred_skills:
                        preferred_skills.append(concept)

    key_parts = []
    if required_skills:
        key_parts.append(", ".join(required_skills[:4]))
    if min_years > 0:
        key_parts.append(f"{min_years}+ ans d'expérience")
    if education_level != "none":
        key_parts.append({"bachelor":"Licence","master":"Master","phd":"Doctorat"}.get(education_level,"") + " requis")

    return {
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "min_experience_years": min_years,
        "max_experience_years": max_years,
        "education_level": education_level,
        "work_mode": work_mode,
        "languages": languages,
        "stability_pref": stability_pref,
        "key_requirements_summary": ", ".join(key_parts) if key_parts else "Profil polyvalent",
    }


def _extract_concept_fr(q_text: str) -> str:
    CONCEPT_MAP = {
        "typescript": "TypeScript", "performance": "Optimisation des performances",
        "outillage": "Build tools", "ssr": "SSR/SSG", "design system": "Design System",
        "microservice": "Microservices", "distribué": "Systèmes distribués", "haute disponibilité": "Haute disponibilité",
        "déploiement de modèles": "Déploiement ML", "llm": "LLM/Grands modèles", "gpu": "Entraînement GPU",
        "open-source": "Open-source", "management": "Management", "kubernetes": "Kubernetes",
        "noyau linux": "Noyau Linux", "iac": "IaC",
    }
    for kw, label in CONCEPT_MAP.items():
        if kw in q_text:
            return label
    return ""


# ─── Scoring des candidats ────────────────────────────────────────────────────

def _calculate_experience_years(profile: dict) -> float:
    return round(float(profile.get("experiences_duration") or 0), 1)


def _get_skills(profile: dict) -> set:
    return {s.get("name", "").lower() for s in profile.get("skills", []) if s.get("name")}


def _edu_level(profile: dict) -> str:
    for edu in profile.get("educations", []):
        t = (edu.get("title") or "").lower()
        if any(k in t for k in ["phd","doctorate","doctorat"]): return "phd"
        if any(k in t for k in ["master","msc","mba","mastère"]): return "master"
        if any(k in t for k in ["bachelor","bsc","undergraduate","licence","ingénieur"]): return "bachelor"
    return "none"


_EDU_RANK = {"none": 0, "bachelor": 1, "master": 2, "phd": 3}
_EDU_LABEL_FR = {"phd": "Doctorat", "master": "Master", "bachelor": "Licence", "none": "Non renseigné"}


def _score_candidates(profiles: list, reqs: dict, user_weights: dict = None) -> list:
    required = {s.lower() for s in reqs.get("required_skills", [])}
    preferred = {s.lower() for s in reqs.get("preferred_skills", [])}
    min_years = float(reqs.get("min_experience_years") or 0)
    max_years = float(reqs.get("max_experience_years") or 99)
    edu_req = _EDU_RANK.get(reqs.get("education_level", "none"), 0)
    stability_pref = reqs.get("stability_pref", "none")

    # Dimension multipliers from weight sliders (1–5 scale → 0.2–1.0)
    uw = user_weights or {}
    w_exp   = uw.get("g3", 5) / 5.0
    w_edu   = uw.get("g2", 3) / 5.0
    s_keys  = [k for k in uw if k.startswith("s")]
    w_skill = (sum(uw[k] for k in s_keys) / len(s_keys) / 5.0) if s_keys else 1.0
    w_stab  = uw.get("g_stab", 3) / 5.0

    # Max achievable raw score (used for normalization)
    max_possible = 50 * w_skill + 30 * w_exp + 20 * w_edu + 8 * w_stab

    scored = []
    for p in profiles:
        skills = _get_skills(p)
        years = _calculate_experience_years(p)
        edu = _edu_level(p)
        avg_tenure = _average_tenure_years(p)
        info = p.get("info", {})
        name = (info.get("full_name")
                or f"{info.get('first_name','')} {info.get('last_name','')}".strip()
                or p.get("key", "")[:12])

        raw = 0.0

        # Compétences — 50 pts × w_skill
        skill_pts = 0.0
        if required:
            matched_req = required & skills
            skill_pts += (len(matched_req) / len(required)) * 50
        else:
            skill_pts += 30
        if preferred:
            pref_hit = preferred & skills
            skill_pts += (len(pref_hit) / len(preferred)) * 20
        raw += skill_pts * w_skill

        # Expérience — 30 pts × w_exp
        exp_pts = 0.0
        if min_years > 0:
            if years >= min_years:          exp_pts += 30
            elif years >= min_years * 0.75: exp_pts += 15
            elif years >= min_years * 0.5:  exp_pts += 5
        else:
            exp_pts += 30
        if max_years < 99 and years > max_years + 5:
            exp_pts -= 8
        raw += exp_pts * w_exp

        # Formation — 20 pts × w_edu
        edu_pts = 0.0
        cand_edu_rank = _EDU_RANK.get(edu, 0)
        if cand_edu_rank >= edu_req:         edu_pts += 20
        elif cand_edu_rank == edu_req - 1:   edu_pts += 10
        raw += edu_pts * w_edu

        # Stabilité — ±8 pts × w_stab
        stability_note = ""
        stab_pts = 0.0
        if stability_pref == "high":
            if avg_tenure >= 3.0:
                stab_pts = 8
                stability_note = f"Bonne stabilité ({avg_tenure:.1f} ans/poste en moy.)"
            elif avg_tenure > 0:
                stab_pts = -5
                stability_note = f"Mobilité fréquente ({avg_tenure:.1f} ans/poste en moy.)"
        elif stability_pref == "moderate":
            if 1.0 <= avg_tenure < 4.0:
                stab_pts = 4
                stability_note = f"Stabilité modérée ({avg_tenure:.1f} ans/poste en moy.)"
            elif avg_tenure >= 4.0:
                stability_note = f"Profil stable ({avg_tenure:.1f} ans/poste en moy.)"
        elif stability_pref == "flexible":
            if avg_tenure < 1.5:
                stab_pts = 4
                stability_note = f"Profil mobile ({avg_tenure:.1f} ans/poste en moy.)"
        raw += stab_pts * w_stab

        matched_req_list = sorted(required & skills)
        missing_req_list = sorted(required - skills)
        bonus_list = sorted((preferred & skills) - required)

        # Normalize to 0–100 with decimal precision
        if max_possible > 0:
            final_score = round(min(raw / max_possible * 100, 100), 2)
        else:
            final_score = 0.0

        # ── Mention ──────────────────────────────────────────────
        if final_score >= 85:   grade = "A"
        elif final_score >= 70: grade = "B"
        elif final_score >= 50: grade = "C"
        else:                   grade = "D"

        # ── Justification ─────────────────────────────────────────
        parts = []
        if required:
            ratio = len(matched_req_list) / len(required)
            if ratio == 1.0:
                parts.append(f"Toutes les {len(required)} compétences requises ({', '.join(matched_req_list[:4])})")
            elif ratio >= 0.6:
                parts.append(f"{len(matched_req_list)}/{len(required)} compétences requises"
                             + (f" — manque : {', '.join(missing_req_list[:2])}" if missing_req_list else ""))
            else:
                parts.append(f"Seulement {len(matched_req_list)}/{len(required)} requises — manque {', '.join(missing_req_list[:3])}")
        if min_years > 0:
            label = f"{years:.1f} ans exp. (requis : {min_years:.0f}+)" if years >= min_years else f"{years:.1f} ans exp. (< {min_years:.0f} requis)"
            parts.append(label)
        elif years > 0:
            parts.append(f"{years:.1f} ans d'expérience")
        edu_label = _EDU_LABEL_FR.get(edu, "")
        if edu_label and edu_label != "Non renseigné":
            parts.append(edu_label)
        if stability_note:
            parts.append(stability_note)
        if bonus_list:
            parts.append(f"Bonus : {', '.join(bonus_list[:3])}")
        reasoning = " ; ".join(parts) if parts else "Évaluation sur profil global"

        scored.append({
            "key": p.get("key", ""),
            "name": name,
            "email": info.get("email", ""),
            "summary": (info.get("summary") or "")[:300],
            "skills": sorted(skills),
            "experience_years": years,
            "avg_tenure": avg_tenure,
            "education": edu,
            "matched_skills": matched_req_list,
            "missing_skills": missing_req_list,
            "bonus_skills": bonus_list,
            "score": final_score,
            "grade": grade,
            "reasoning": reasoning,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


def _score_with_hrflow(profiles: list, predictions: list, reqs: dict, user_weights: dict = None) -> list:
    """
    Combine HrFlow AI predictions (Leo's algorithm_key) avec les ajustements
    du questionnaire pondérés par les sliders utilisateur.
    Score final = score_IA_HrFlow (0-100) + delta questionnaire (±30 pts max).
    """
    required = {s.lower() for s in reqs.get("required_skills", [])}
    preferred = {s.lower() for s in reqs.get("preferred_skills", [])}
    min_years = float(reqs.get("min_experience_years") or 0)
    max_years = float(reqs.get("max_experience_years") or 99)
    edu_req = _EDU_RANK.get(reqs.get("education_level", "none"), 0)
    stability_pref = reqs.get("stability_pref", "none")

    uw = user_weights or {}
    w_exp   = uw.get("g3", 5) / 5.0
    w_edu   = uw.get("g2", 3) / 5.0
    s_keys  = [k for k in uw if k.startswith("s")]
    w_skill = (sum(uw[k] for k in s_keys) / len(s_keys) / 5.0) if s_keys else 1.0
    w_stab  = uw.get("g_stab", 3) / 5.0

    scored = []
    for i, p in enumerate(profiles):
        # Score de base HrFlow IA (predictions[i][1] = probabilité 0-1)
        ai_score = 0.0
        if i < len(predictions) and len(predictions[i]) > 1:
            ai_score = round(predictions[i][1] * 100, 2)

        skills = _get_skills(p)
        years = _calculate_experience_years(p)
        edu = _edu_level(p)
        avg_tenure = _average_tenure_years(p)
        info = p.get("info", {})
        name = (info.get("full_name")
                or f"{info.get('first_name','')} {info.get('last_name','')}".strip()
                or p.get("key", "")[:12])

        delta = 0.0

        # Compétences : ±15 pts pondérés
        matched_req_list = sorted(required & skills) if required else []
        missing_req_list = sorted(required - skills) if required else []
        bonus_list = sorted((preferred & skills) - required) if preferred else []
        if required:
            skill_ratio = len(matched_req_list) / len(required)
            delta += (skill_ratio - 0.5) * 20 * w_skill

        # Expérience : ±10 pts pondérés
        if min_years > 0:
            if years >= min_years:             delta += 8 * w_exp
            elif years >= min_years * 0.75:    delta += 2 * w_exp
            else:                              delta -= 8 * w_exp
        if max_years < 99 and years > max_years + 5:
            delta -= 5 * w_exp

        # Formation : ±8 pts pondérés
        cand_edu_rank = _EDU_RANK.get(edu, 0)
        if cand_edu_rank >= edu_req:           delta += 5 * w_edu
        elif cand_edu_rank < edu_req - 1:      delta -= 8 * w_edu

        # Stabilité : ±5 pts pondérés
        stability_note = ""
        if stability_pref == "high":
            if avg_tenure >= 3.0:
                delta += 5 * w_stab
                stability_note = f"Bonne stabilité ({avg_tenure:.1f} ans/poste)"
            elif avg_tenure > 0:
                delta -= 4 * w_stab
                stability_note = f"Mobilité fréquente ({avg_tenure:.1f} ans/poste)"
        elif stability_pref == "moderate":
            if 1.0 <= avg_tenure < 4.0:
                delta += 2 * w_stab
                stability_note = f"Stabilité modérée ({avg_tenure:.1f} ans/poste)"
        elif stability_pref == "flexible":
            if avg_tenure < 1.5:
                delta += 2 * w_stab
                stability_note = f"Profil mobile ({avg_tenure:.1f} ans/poste)"

        final_score = round(min(max(ai_score + delta, 0), 100), 2)

        if final_score >= 85:   grade = "A"
        elif final_score >= 70: grade = "B"
        elif final_score >= 50: grade = "C"
        else:                   grade = "D"

        parts = [f"Score HrFlow IA : {ai_score:.1f}/100"]
        if required:
            ratio = len(matched_req_list) / len(required)
            if ratio == 1.0:
                parts.append(f"Toutes les {len(required)} compétences requises ({', '.join(matched_req_list[:3])})")
            elif ratio >= 0.5:
                parts.append(f"{len(matched_req_list)}/{len(required)} compétences" +
                             (f" — manque : {', '.join(missing_req_list[:2])}" if missing_req_list else ""))
            else:
                parts.append(f"Seulement {len(matched_req_list)}/{len(required)} requises — manque {', '.join(missing_req_list[:2])}")
        if min_years > 0:
            parts.append(f"{years:.1f} ans exp. (requis : {min_years:.0f}+)" if years >= min_years
                         else f"{years:.1f} ans exp. (< {min_years:.0f} requis)")
        elif years > 0:
            parts.append(f"{years:.1f} ans d'expérience")
        edu_label = _EDU_LABEL_FR.get(edu, "")
        if edu_label and edu_label != "Non renseigné":
            parts.append(edu_label)
        if stability_note:
            parts.append(stability_note)
        if bonus_list:
            parts.append(f"Bonus : {', '.join(bonus_list[:3])}")
        reasoning = " ; ".join(parts) if parts else "Évaluation HrFlow IA"

        scored.append({
            "key": p.get("key", ""),
            "name": name,
            "email": info.get("email", ""),
            "summary": (info.get("summary") or "")[:300],
            "skills": sorted(skills),
            "experience_years": years,
            "avg_tenure": avg_tenure,
            "education": edu,
            "matched_skills": matched_req_list,
            "missing_skills": missing_req_list,
            "bonus_skills": bonus_list,
            "score": final_score,
            "ai_base_score": ai_score,
            "grade": grade,
            "reasoning": reasoning,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


# ─── Analyse du vivier ────────────────────────────────────────────────────────

def _analyse_candidates(candidates: list) -> dict:
    if len(candidates) < 3:
        return {"common_skills": [], "differentiators": [], "experience_range": "", "score_range": "", "candidate_count": len(candidates)}

    top = candidates[:min(20, len(candidates))]
    n = len(top)
    threshold = 0.65

    all_skills_flat = [s for c in top for s in c["skills"]]
    skill_counts = Counter(all_skills_flat)

    common_skills = [s for s, cnt in skill_counts.most_common(30) if cnt >= n * threshold]
    differentiators = [s for s, cnt in skill_counts.most_common(50) if n * 0.15 <= cnt < n * threshold]

    years_list = [c["experience_years"] for c in top]
    scores = [c["score"] for c in top]

    return {
        "candidate_count": n,
        "common_skills": common_skills[:12],
        "differentiators": differentiators[:12],
        "experience_range": f"{min(years_list):.0f}–{max(years_list):.0f} ans" if years_list else "",
        "score_range": f"{min(scores):.0f}–{max(scores):.0f}" if scores else "",
        "education_distribution": dict(Counter(c["education"] for c in top)),
    }


# ─── Affinement ───────────────────────────────────────────────────────────────

def _apply_refinement(candidates: list, refinement_text: str, original_reqs: dict, user_weights: dict = None) -> list:
    text_lower = refinement_text.lower()
    updated = dict(original_reqs)

    ALL_TECHS = [
        "react","vue","angular","typescript","javascript","python","java","go","rust",
        "kubernetes","docker","aws","gcp","azure","kafka","spark","pytorch","tensorflow",
        "llm","graphql","grpc","redis","mongodb","postgresql","mysql",
        "flutter","swift","kotlin","next.js","nuxt","terraform","ansible",
        "elasticsearch","clickhouse","airflow","dbt","scikit-learn","rag",
    ]
    extra_required = [t for t in ALL_TECHS if t in text_lower]
    if extra_required:
        existing = [s.lower() for s in updated.get("required_skills", [])]
        for t in extra_required:
            if t not in existing:
                updated.setdefault("required_skills", []).append(t)

    m = re.search(r"(\d+)\s*(?:ans?|années?)", refinement_text, re.IGNORECASE)
    if m:
        updated["min_experience_years"] = max(updated.get("min_experience_years", 0), int(m.group(1)))

    if any(k in text_lower for k in ["doctorat","phd"]):
        updated["education_level"] = "phd"
    elif any(k in text_lower for k in ["master","mastère","m2"]):
        if _EDU_RANK.get(updated.get("education_level","none"),0) < 2:
            updated["education_level"] = "master"

    if "stable" in text_lower or "stabilité" in text_lower:
        updated["stability_pref"] = "high"
    elif "mobile" in text_lower or "freelance" in text_lower:
        updated["stability_pref"] = "flexible"

    fake_profiles = []
    for c in candidates:
        fake_profiles.append({
            "key": c["key"],
            "info": {"full_name": c["name"], "email": c["email"], "summary": c["summary"]},
            "skills": [{"name": s} for s in c["skills"]],
            "experiences": [{}] * max(1, round(c["experience_years"] / max(c.get("avg_tenure", 1), 0.1))),
            "experiences_duration": c["experience_years"],
            "educations": _fake_edu(c["education"]),
        })
    return _score_candidates(fake_profiles, updated, user_weights)


def _fake_exp_tenure(total_years: float, avg_tenure: float) -> list:
    if total_years <= 0:
        return []
    from datetime import timedelta
    tenure = avg_tenure if avg_tenure > 0 else total_years
    n_jobs = max(1, round(total_years / tenure))
    exps = []
    end = datetime.now()
    for _ in range(n_jobs):
        start = end - timedelta(days=int(tenure * 365))
        exps.append({"title":"Engineer","company":"Company",
                     "date_start": start.isoformat(),"date_end": end.isoformat()})
        end = start
    return exps


def _fake_edu(level: str) -> list:
    titles = {"bachelor":"Licence","master":"Master","phd":"Doctorat","none":""}
    t = titles.get(level, "")
    return [{"title": t}] if t else []


# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return FileResponse("static/index_openhr.html")


@app.post("/api/start")
def api_start(req: StartRequest):
    if not req.job_title.strip():
        raise HTTPException(400, "L'intitulé du poste est requis")
    questionnaire = _generate_questionnaire(req.job_title, req.job_description)
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "job_title": req.job_title,
        "job_description": req.job_description,
        "questionnaire": questionnaire,
        "candidates": [],
        "requirements": {},
    }
    return {"session_id": session_id, "questionnaire": questionnaire}


@app.post("/api/submit")
def api_submit(req: SubmitAnswersRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(404, "Session introuvable, veuillez actualiser")

    user_weights = req.weights or {}
    reqs = _interpret_answers(session["questionnaire"], req.answers, user_weights)
    session["requirements"] = reqs
    session["user_weights"] = user_weights

    try:
        # Étape 1 : indexer le poste sur le board pour obtenir un job_key
        job_key = hrflow.index_job_sync(config.HRFLOW_BOARD_KEY, session["job_title"])
        session["job_key"] = job_key

        # Étape 2 : attendre que HrFlow calcule les scores (approche Leo)
        time.sleep(5)

        # Étape 3 : récupérer les profils scorés par l'IA HrFlow (algorithm_key)
        scoring_resp = hrflow.score_profiles_with_algo(
            job_key=job_key,
            board_key=config.HRFLOW_BOARD_KEY,
            source_keys=[config.HRFLOW_SOURCE_KEY],
            limit=100,
        )
        raw_profiles = scoring_resp.get("data", {}).get("profiles", [])
        predictions  = scoring_resp.get("data", {}).get("predictions", [])

        # Fallback : si le scoring API échoue, revenir à la recherche
        if not raw_profiles:
            search_resp = hrflow.search_profiles(
                source_keys=[config.HRFLOW_SOURCE_KEY],
                query=session["job_title"],
                page=1, limit=100,
            )
            raw_profiles = search_resp.get("data", {}).get("profiles", [])
            predictions  = []
    except Exception as e:
        raise HTTPException(500, f"Erreur lors de la récupération des candidats : {e}")

    if predictions:
        scored = _score_with_hrflow(raw_profiles, predictions, reqs, user_weights)
    else:
        scored = _score_candidates(raw_profiles, reqs, user_weights)
    session["candidates"] = scored

    qualified = [c for c in scored if c["score"] >= 35]
    if not qualified:
        qualified = scored[:10]

    analysis = _analyse_candidates(qualified)

    if len(qualified) > 10:
        return {
            "status": "refine",
            "analysis": analysis,
            "requirements_summary": reqs.get("key_requirements_summary", ""),
            "sample_candidates": qualified[:6],
            "total_qualified": len(qualified),
        }

    return {
        "status": "done",
        "candidates": qualified[:15],
        "analysis": analysis,
        "requirements_summary": reqs.get("key_requirements_summary", ""),
        "total_qualified": len(qualified),
    }


@app.post("/api/refine")
def api_refine(req: RefineRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(404, "Session introuvable")

    candidates = session.get("candidates", [])
    if not candidates:
        raise HTTPException(400, "Aucun candidat disponible")

    refined = _apply_refinement(candidates, req.refinement, session["requirements"], session.get("user_weights", {}))
    qualified = [c for c in refined if c["score"] >= 35]
    if not qualified:
        qualified = refined[:10]

    analysis = _analyse_candidates(qualified)
    return {
        "status": "done",
        "candidates": qualified[:15],
        "analysis": analysis,
        "requirements_summary": req.refinement[:80],
        "total_qualified": len(qualified),
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "AI Agent avec OpenClaw v2", "port": 8002}
