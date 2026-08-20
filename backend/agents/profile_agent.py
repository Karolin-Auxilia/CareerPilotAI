from backend.agents.base_agent import BaseAgent


class ProfileAgent(BaseAgent):
    name = "Profile Intelligence Agent"
    role = "Build an evidence-based candidate profile from supplied user information."
    instructions = """
Extract technical and soft skills, experience level, projects, education, certifications,
interests, strengths, career goal, evidence, and a 0-1 confidence score. Separate explicitly
demonstrated skills from inferred skills and unknown information inside the skill objects.
Do not infer a skill without evidence, and represent absent fields as empty lists or unknown.
Output fields: profile_summary, technical_skills, soft_skills, experience_level, projects,
education, certifications, interests, strengths, career_goal, evidence, confidence.
"""
    required_fields = (
        "profile_summary", "technical_skills", "soft_skills", "experience_level",
        "projects", "education", "certifications", "interests", "strengths",
        "career_goal", "evidence", "confidence",
    )