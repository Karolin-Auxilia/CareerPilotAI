export interface SkillLesson {
  topic: string;
  learning_outcome: string;
  prerequisites: string[];
  concept: string;
  real_world_analogy: string;
  key_points: string[];
  code_example: string;
  code_language: string;
  code_explanation: string;
  common_mistakes: string[];
  practice_task: string;
  mini_project: string;
  next_topics: string[];
  difficulty_level: string;
  estimated_time: string;
  youtube_url: string;
  gfg_url: string;
  gfg_search_url: string;
  error?: string;
}

export interface SkillLessonContext {
  profile?: Record<string, any> | null;
  skills?: Array<Record<string, any>>;
  skillGap?: Record<string, any> | null;
  careers?: Array<Record<string, any>>;
  learningOutcomes?: Array<Record<string, any>>;
}

export async function generateSkillLesson(
  skill: string,
  proficiency: string = 'Beginner',
  targetCareer: string = 'Software Engineer',
  context: SkillLessonContext = {}
): Promise<SkillLesson> {
  const response = await fetch('/api/ai/learn-skill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      skill,
      proficiency,
      targetCareer,
      profile: context.profile || {},
      skills: context.skills || [],
      skillGap: context.skillGap || null,
      careers: context.careers || [],
      learningOutcomes: context.learningOutcomes || [],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || data.error || 'Failed to generate lesson');
  return data as SkillLesson;
}
