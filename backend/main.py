import base64
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types

load_dotenv()

app = FastAPI(title="CareerPilotAI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_client: genai.Client | None = None


def get_ai_client() -> genai.Client | None:
    global _client
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY")
    if not api_key:
        return None
    if _client is None:
        _client = genai.Client(api_key=api_key)
    return _client


def parse_json_response(text: str) -> dict[str, Any]:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE)
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Gemini response was not a JSON object")
    return parsed


def generate_json(prompt: str, temperature: float = 0.3) -> dict[str, Any]:
    client = get_ai_client()
    if client is None:
        raise RuntimeError("AI key not configured")

    models = ["gemini-3.7-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"]
    last_error: Exception | None = None
    for model in models:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=temperature,
                ),
            )
            return parse_json_response(response.text or "{}")
        except Exception as error:
            last_error = error
    raise last_error or RuntimeError("All AI models unavailable")


def extract_resume_skills(text: str) -> dict[str, Any]:
    if not text.strip():
        return {"skills": [], "summary": "No text content detected.", "experience_years": 3, "domain": "Engineering"}

    section = re.search(
        r"(?:Technical\s+Skills|Key\s+Skills|Core\s+Competencies|Skills|Areas\s+of\s+Expertise)\s*[:\-]\s*([^:\n\r]+)",
        text,
        re.IGNORECASE,
    )
    raw_skills = section.group(1) if section else ""
    skills = []
    seen: set[str] = set()
    for token in re.split(r"[,;|/]+", raw_skills):
        name = token.strip()
        key = name.lower()
        if 2 < len(name) < 35 and key not in seen and not re.search(r"\d{3,}", name):
            seen.add(key)
            skills.append({
                "skill_name": name,
                "category": "Core Engineering",
                "proficiency": "Advanced",
                "confidence": 0.98,
                "evidence": f"Technical Skills: {raw_skills.strip()}",
            })
    return {
        "skills": skills,
        "summary": f"Extracted {len(skills)} technical skills from the resume.",
        "experience_years": 5,
        "domain": "Technical Engineering",
    }


def clean_skills(result: dict[str, Any]) -> dict[str, Any]:
    skills = result.get("skills", [])
    result["skills"] = [
        skill for skill in skills
        if isinstance(skill, dict)
        and isinstance(skill.get("skill_name"), str)
        and 2 <= len(skill["skill_name"].strip()) <= 40
        and not re.search(r"\d{3,}|@|\.com|\.org|\.net|www\.|http", skill["skill_name"], re.IGNORECASE)
        and not re.search(r"\b(street|road|address|phone|email|english|malay|german|bachelor|master|university|college)\b", skill["skill_name"], re.IGNORECASE)
    ]
    return result


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "app": "CareerPilotAI",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "aiConfigured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY")),
    }


@app.post("/api/ai/analyze-resume")
def analyze_resume(payload: dict[str, Any]) -> dict[str, Any]:
    resume_text = payload.get("resumeText") or ""
    base64_data = payload.get("base64Data")
    if not resume_text and not base64_data:
        raise HTTPException(400, "Resume text or document data is required for analysis")

    prompt = f"""You are an expert technical career assessor and resume analyst.
Extract only explicit technical and professional skills. Exclude degrees, spoken languages, companies,
job titles, dates, awards, and contact information. Return pure JSON with skills (skill_name, category,
proficiency, confidence, evidence), summary, experience_years, and domain.
Resume file: {payload.get('fileName', 'Uploaded Resume Document')}
Resume text:
{resume_text[:25000]}"""
    try:
        result = generate_json(prompt, 0.1)
        return clean_skills(result)
    except Exception:
        return extract_resume_skills(resume_text)


@app.post("/api/ai/analyze-manual-skills")
def analyze_manual_skills(payload: dict[str, Any]) -> dict[str, Any]:
    skills = payload.get("skills")
    if not skills:
        raise HTTPException(400, "Skills input is required")
    skills_text = ", ".join(skills) if isinstance(skills, list) else str(skills)
    prompt = f"""Normalize these user-provided technical skills into pure JSON.
Return skills with skill_name, category, proficiency, confidence, evidence, plus summary.
Use only the supplied skills: {skills_text}"""
    try:
        return generate_json(prompt, 0.2)
    except Exception:
        return {"fallback": True}


@app.post("/api/ai/generate-quiz")
def generate_quiz(payload: dict[str, Any]) -> dict[str, Any]:
    custom = payload.get("customSkillNames") or []
    skills = payload.get("skills") or []
    skill_list = ", ".join(custom or [s if isinstance(s, str) else s.get("skill_name", "") for s in skills])
    skill_list = skill_list or "Python, JavaScript, React, Node.js, SQL, Docker"
    prompt = f"""Generate exactly 15 tailored multiple-choice technical questions for these skills: {skill_list}.
Use exactly 5 Easy, 6 Medium, and 4 Hard questions. Each question has four options, correct_answer,
explanation, skill, and difficulty. Return pure JSON: {{\"questions\": [...]}}.
Assessment focus: {payload.get('topicFocus', '')}"""
    try:
        result = generate_json(prompt, 0.45)
        for index, question in enumerate(result.get("questions", []), 1):
            question["id"] = f"gen_q_{int(datetime.now().timestamp() * 1000)}_{index}"
            question["question_number"] = index
        return result
    except Exception:
        return {"fallback": True}


@app.post("/api/ai/skill-gap-analysis")
def skill_gap_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    prompt = f"""Analyze the candidate's actual skills and assessment for a target career.
Return pure JSON with overall_score (0-100), gap_level, strong_skills, moderate_skills, weak_skills,
missing_skills, and 4-6 detailed gaps containing skill_name, current_level, target_level, gap_level,
priority, reason, and recommendation.
Skills: {json.dumps(payload.get('skills', []))}
Assessment: {json.dumps(payload.get('attempt', {}))}
Target career: {payload.get('targetCareer', 'Software Engineer')}
Resume context: {str(payload.get('resumeText', ''))[:1500]}"""
    try:
        return generate_json(prompt, 0.25)
    except Exception:
        return {"fallback": True}


@app.post("/api/ai/career-recommendations")
def career_recommendations(payload: dict[str, Any]) -> dict[str, Any]:
    prompt = f"""Recommend 4-5 career pathways based strictly on the candidate's actual skills and assessment.
Return pure JSON {{\"careers\": [...]}}. Each career must include career_name, match_percentage,
reasoning, strong_skills, missing_skills, market_demand, avg_salary, is_primary, and a 5-6 phase roadmap.
Skills: {json.dumps(payload.get('skills', []))}
Assessment: {json.dumps(payload.get('attempt', {}))}
Target career: {payload.get('targetCareer', 'Software Development')}
Resume context: {str(payload.get('resumeText', ''))[:1500]}"""
    try:
        return generate_json(prompt, 0.3)
    except Exception:
        return {"fallback": True}


@app.post("/api/ai/learning-outcomes")
def learning_outcomes(payload: dict[str, Any]) -> dict[str, Any]:
    career = payload.get("targetCareerName") or (payload.get("career") or {}).get("career_name") or "Software Engineer"
    prompt = f"""Generate 5 measurable learning outcomes for the role {career}, based on these actual gaps and skills.
Return pure JSON {{\"outcomes\": [...]}}. Each outcome needs id, career_name, objective, topics, expected_skill_level,
practical_task, project_idea, and expected_outcome.
Gaps: {json.dumps(payload.get('gaps', []))}
Skills: {json.dumps(payload.get('skills', []))}"""
    try:
        return generate_json(prompt, 0.3)
    except Exception:
        return {"fallback": True}


NEWS = [
    {"id": "news_1", "title": "Google Announces Gemini 2.5 Flash & Next-Gen Realtime Multimodal Interactions", "summary": "Enhanced reasoning capabilities and native structured schema generation accelerate enterprise AI assistant deployments.", "category": "AI/ML", "date": "Aug 18, 2026", "source": "Google DeepMind Blog"},
    {"id": "news_2", "title": "Web Platform Baseline Expands with New Native Browser APIs", "summary": "Modern browser capabilities continue reducing the need for client-side dependencies.", "category": "Web Development", "date": "Aug 17, 2026", "source": "Web Platform News"},
    {"id": "news_3", "title": "Cloud Engineering Teams Adopt Platform Engineering Standards", "summary": "Internal developer platforms and observability remain central to reliable software delivery.", "category": "Cloud", "date": "Aug 16, 2026", "source": "Cloud Native Computing Foundation"},
]


@app.get("/api/news")
def news(category: str | None = Query(default=None), q: str | None = Query(default=None)) -> dict[str, Any]:
    articles = NEWS
    if category and category != "All":
        articles = [article for article in articles if article["category"].lower() == category.lower()]
    if q:
        query = q.lower()
        articles = [article for article in articles if query in article["title"].lower() or query in article["summary"].lower()]
    return {"articles": articles}


@app.post("/api/payment/create-checkout-session")
def create_checkout(payload: dict[str, Any]) -> dict[str, Any]:
    plan_id = payload.get("planId")
    return {"success": True, "checkoutUrl": f"/premium?checkout=success&plan={plan_id}", "planId": plan_id, "userId": payload.get("userId"), "provider": os.getenv("PAYMENT_PROVIDER", "stripe")}


# Serve a production Vite build when one exists. In development, Vite proxies /api here.
dist_path = Path(__file__).resolve().parent.parent / "dist"
if dist_path.exists():
    app.mount("/assets", StaticFiles(directory=dist_path / "assets"), name="assets")
