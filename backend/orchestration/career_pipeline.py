import logging
from typing import Any

from backend.agents.career_agent import CareerAgent
from backend.agents.learning_agent import LearningAgent
from backend.agents.profile_agent import ProfileAgent
from backend.agents.skill_gap_agent import SkillGapAgent

logger = logging.getLogger(__name__)


class CareerPipelineError(RuntimeError):
    def __init__(self, agent: str, error: Exception) -> None:
        self.agent = agent
        super().__init__(str(error))


class CareerPipeline:
    def __init__(self) -> None:
        self.profile_agent = ProfileAgent()
        self.skill_gap_agent = SkillGapAgent()
        self.career_agent = CareerAgent()
        self.learning_agent = LearningAgent()

    def run(self, candidate: dict[str, Any]) -> dict[str, Any]:
        state: dict[str, Any] = {
            "candidate": candidate,
            "profile": {},
            "skill_gaps": {},
            "career": {},
            "learning": {},
            "assessment": candidate.get("assessment") or candidate.get("attempt") or {},
            "learning_history": candidate.get("learningHistory") or [],
        }
        stages = (
            ("profile", self.profile_agent, {"candidate": state["candidate"]}),
            ("skill_gaps", self.skill_gap_agent, {
                "profile": state["profile"],
                "assessment": state["assessment"],
                "target_career": candidate.get("careerGoal") or candidate.get("targetCareer"),
            }),
            ("career", self.career_agent, {
                "profile": state["profile"],
                "skill_gaps": state["skill_gaps"],
                "assessment": state["assessment"],
                "target_career": candidate.get("careerGoal") or candidate.get("targetCareer"),
            }),
            ("learning", self.learning_agent, {
                "profile": state["profile"],
                "skill_gaps": state["skill_gaps"],
                "career": state["career"],
                "assessment": state["assessment"],
                "learning_history": state["learning_history"],
            }),
        )
        for index, (key, agent, input_state) in enumerate(stages, 1):
            logger.info("[Agent %s] %s started", index, agent.name)
            try:
                state[key] = agent.run(input_state)
            except Exception as error:
                logger.exception("[Agent %s] %s failed", index, agent.name)
                raise CareerPipelineError(agent.name, error) from error
            logger.info("[Agent %s] %s completed", index, agent.name)
        return {key: state[key] for key in ("profile", "skill_gaps", "career", "learning")}