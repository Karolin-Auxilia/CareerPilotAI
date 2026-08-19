import { SkillItem, QuizAttempt, SkillGapItem, SkillGapSummary, GapLevel } from '../../types';

export interface AnalyzeSkillGapParams {
  skills: SkillItem[];
  attempt?: QuizAttempt | null;
  resumeText?: string;
  targetCareer?: string;
}

export async function analyzeSkillGaps(params: AnalyzeSkillGapParams): Promise<SkillGapSummary> {
  if (!params.skills || params.skills.length === 0) {
    return {
      overall_score: 0,
      gap_level: 'High',
      gaps: [],
      strong_skills: [],
      moderate_skills: [],
      weak_skills: [],
      missing_skills: [],
    };
  }

  try {
    const response = await fetch('/api/ai/skill-gap-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.gaps && Array.isArray(data.gaps) && data.gaps.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend skill gap analysis fallback:', err);
  }

  // Fallback Dynamic Synthesis from user's actual skills
  return fallbackSkillGapAnalyzer(params.skills, params.attempt, params.targetCareer);
}

function fallbackSkillGapAnalyzer(skills: SkillItem[], attempt?: QuizAttempt | null, targetCareer?: string): SkillGapSummary {
  const gaps: SkillGapItem[] = [];
  const strong_skills: string[] = [];
  const moderate_skills: string[] = [];
  const weak_skills: string[] = [];
  const missing_skills: string[] = [];

  const skillPerformance = attempt?.skill_breakdown || {};

  // Evaluate each of the candidate's actual extracted skills
  skills.forEach((skill) => {
    const sName = skill.skill_name;
    const scorePct = skillPerformance[sName] ?? (skill.proficiency === 'Advanced' || skill.proficiency === 'Expert' ? 85 : skill.proficiency === 'Intermediate' ? 70 : 50);

    if (scorePct >= 80) {
      strong_skills.push(sName);
    } else if (scorePct >= 60) {
      moderate_skills.push(sName);
      gaps.push({
        id: 'gap_' + Math.random().toString(36).substr(2, 9),
        skill_name: sName,
        current_level: skill.proficiency || 'Intermediate',
        target_level: 'Advanced',
        gap_level: 'Moderate',
        priority: 'Medium',
        reason: `Assessment performance indicates solid foundational grasp in ${sName} (${scorePct}%), but advanced production patterns, concurrency, or optimization need improvement.`,
        recommendation: `Focus on architectural best practices, practical debugging scenarios, and deep dive projects for ${sName}.`,
      });
    } else {
      weak_skills.push(sName);
      gaps.push({
        id: 'gap_' + Math.random().toString(36).substr(2, 9),
        skill_name: sName,
        current_level: skill.proficiency === 'Advanced' ? 'Intermediate' : (skill.proficiency || 'Beginner'),
        target_level: 'Intermediate',
        gap_level: 'High',
        priority: 'High',
        reason: `Identified proficiency gaps in ${sName} (${scorePct}%). Evidence indicates core mechanisms require structured reinforcement.`,
        recommendation: `Dedicate 2-3 weeks to core concepts, building hands-on modules, and solving practical code challenges in ${sName}.`,
      });
    }
  });

  // Calculate dynamic preparedness score from user's actual skills and test
  const quizPct = attempt?.percentage ?? (strong_skills.length > weak_skills.length ? 75 : 55);
  const highGapsCount = gaps.filter((g) => g.gap_level === 'Critical' || g.gap_level === 'High').length;
  const overall_score = Math.max(25, Math.min(98, Math.round(quizPct * 0.7 + Math.max(0, (10 - highGapsCount * 2)) * 3)));

  let gap_level: GapLevel = 'Moderate';
  if (overall_score >= 85) gap_level = 'Low';
  else if (overall_score >= 70) gap_level = 'Moderate';
  else if (overall_score >= 50) gap_level = 'High';
  else gap_level = 'Critical';

  return {
    overall_score,
    gap_level,
    gaps,
    strong_skills,
    moderate_skills,
    weak_skills,
    missing_skills,
  };
}
