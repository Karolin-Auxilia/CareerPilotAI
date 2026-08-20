import { SkillGapItem, LearningOutcome, CareerRecommendation, SkillItem } from '../../types';

export interface GenerateLearningOutcomesParams {
  gaps: SkillGapItem[];
  career?: CareerRecommendation | null;
  targetCareerName?: string;
  skills?: SkillItem[];
}

export async function generateLearningOutcomes(params: GenerateLearningOutcomesParams): Promise<LearningOutcome[]> {
  try {
    const response = await fetch('/api/ai/learning-outcomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.outcomes && Array.isArray(data.outcomes) && data.outcomes.length > 0) {
        return data.outcomes;
      }
    }
  } catch (err) {
    console.warn('Backend learning outcome generation fallback:', err);
  }

  // Fallback Measurable Outcome Generator using resume skills as source
  return fallbackLearningOutcomeGenerator(
    params.gaps,
    params.targetCareerName || params.career?.career_name || 'Software Engineering Pathway',
    params.skills
  );
}

function fallbackLearningOutcomeGenerator(gaps: SkillGapItem[], careerName: string, skills?: SkillItem[]): LearningOutcome[] {
  // Use resume skills as the source for learning outcomes
  const resumeSkills = skills || [];
  
  if (resumeSkills.length > 0) {
    // Generate learning outcomes from resume skills
    return resumeSkills.slice(0, 5).map((skill, idx) => {
      const relatedGap = gaps.find(g => g.skill_name.toLowerCase() === skill.skill_name.toLowerCase());
      const currentLevel = relatedGap?.current_level || skill.proficiency || 'Intermediate';
      const targetLevel = relatedGap?.target_level || 'Advanced';
      
      return {
        id: `lo_skill_${idx + 1}_${Date.now()}`,
        career_name: careerName,
        objective: `By the end of this module, you will be able to apply advanced ${skill.skill_name} techniques to build production-grade applications, elevating your proficiency from ${currentLevel} to ${targetLevel}.`,
        topics: [
          `Advanced ${skill.skill_name} Patterns & Best Practices`,
          `Real-World ${skill.skill_name} Implementation Scenarios`,
          `Performance Optimization in ${skill.skill_name}`,
          `Testing & Quality Assurance for ${skill.skill_name}`,
          `Integration with Modern Development Workflows`,
        ],
        expected_skill_level: targetLevel,
        practical_task: `Build a complete feature using ${skill.skill_name} that demonstrates mastery of core concepts and best practices.`,
        project_idea: `Production-Ready ${skill.skill_name} Application with Comprehensive Testing`,
        expected_outcome: `Demonstrated ability to architect and implement robust solutions using ${skill.skill_name} with measurable performance improvements.`,
        is_completed: false,
      };
    });
  }
  
  // Fallback to gaps if no skills available
  if (!gaps || gaps.length === 0) {
    return [
      {
        id: 'lo_default_1',
        career_name: careerName,
        objective: 'By the end of this module, you will be able to design, implement, and benchmark optimized data structures and modular APIs with comprehensive unit test suites.',
        topics: ['Modular Architecture', 'Unit Testing & Mocking', 'Error Boundaries', 'Clean Code Principles'],
        expected_skill_level: 'Intermediate',
        practical_task: 'Refactor a legacy monolithic code module into loosely-coupled, testable services.',
        project_idea: 'Scalable Micro-Service with Automated CI Validation Pipeline',
        expected_outcome: 'Code coverage >85% with zero circular dependencies.',
        is_completed: false,
      },
    ];
  }

  return gaps.slice(0, 5).map((gap, idx) => ({
    id: `lo_gap_${idx + 1}_${Date.now()}`,
    career_name: careerName,
    objective: `By the end of this module, you will be able to master and apply advanced ${gap.skill_name} patterns, solving real-world production scenarios and elevating proficiency from ${gap.current_level} to ${gap.target_level}.`,
    topics: [
      `Core Mechanics & Internal Execution in ${gap.skill_name}`,
      `Common Bottlenecks, Async Lifecycles & Error Handling in ${gap.skill_name}`,
      `Security Best Practices & Input Validation`,
      `Integration with Distributed Services & Databases`,
      `Performance Benchmarking & Profiling`,
    ],
    expected_skill_level: gap.target_level,
    practical_task: `Complete hands-on implementation and debug realistic edge-case challenges in ${gap.skill_name}: ${gap.recommendation}`,
    project_idea: `Production-Grade ${gap.skill_name} Implementation with Automated Testing & CI/CD`,
    expected_outcome: `Demonstrated mastery of ${gap.skill_name} with verifiable test coverage and low-latency benchmark performance.`,
    is_completed: false,
  }));
}
