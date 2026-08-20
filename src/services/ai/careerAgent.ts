import { CareerRecommendation, LearningOutcome, SkillGapSummary, SkillItem, UserProfile } from '../../types';

export interface CareerAgentContext {
  profile: UserProfile;
  skills: SkillItem[];
  skillGap: SkillGapSummary | null;
  careers: CareerRecommendation[];
  learningOutcomes: LearningOutcome[];
}

export interface CareerAgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askCareerAgent(
  message: string,
  context: CareerAgentContext,
  history: CareerAgentMessage[] = []
): Promise<string> {
  const response = await fetch('/api/agent/career-coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ...context, history }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || data.error || 'Career agent request failed');
  return data.reply;
}

export async function askLearningPlanAgent(
  message: string,
  context: CareerAgentContext,
  history: CareerAgentMessage[] = []
): Promise<string> {
  const response = await fetch('/api/agents/learning-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ...context, history }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || data.error || 'Learning agent request failed');
  return data.response;
}