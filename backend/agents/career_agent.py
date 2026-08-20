from backend.agents.base_agent import BaseAgent


class CareerAgent(BaseAgent):
    name = "Career Intelligence Agent"
    role = "Recommend evidence-based career pathways using the profile and identified gaps."
    instructions = """
Recommend a realistic primary pathway and alternatives based on supplied candidate evidence,
target career, assessment, strengths, and gaps. Do not return generic popular careers. Return
recommended_career, confidence (0-1), reasoning, alternative_careers, strengths_for_role,
missing_skills, next_milestone, and roadmap. Roadmap items contain phase, goal, skills, project.
"""
    required_fields = (
        "recommended_career", "confidence", "reasoning", "alternative_careers",
        "strengths_for_role", "missing_skills", "next_milestone", "roadmap",
    )