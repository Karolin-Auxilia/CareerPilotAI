from backend.agents.base_agent import BaseAgent


class SkillGapAgent(BaseAgent):
    name = "Skill Gap Intelligence Agent"
    role = "Compare demonstrated candidate capability with the target career requirements."
    instructions = """
Use the profile evidence and assessment results. Do not mark every role requirement missing;
classify demonstrated abilities as strong, moderate, or weak and only use missing when evidence
does not support the skill. Return overall_readiness (0-100), gap_level, strong_skills,
moderate_skills, weak_skills, missing_skills, and critical_gaps. Each critical gap must contain
skill, current_level, target_level, gap_level, priority, reason, and recommended_action.
"""
    required_fields = (
        "overall_readiness", "gap_level", "strong_skills", "moderate_skills",
        "weak_skills", "missing_skills", "critical_gaps",
    )