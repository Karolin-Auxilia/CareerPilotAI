import { TechNewsArticle } from '../../types';

export interface TechNewsAgentContext {
  category?: string;
  query?: string;
  articles?: TechNewsArticle[];
  profile?: { target_career?: string } | null;
}

export interface TechNewsAgentReply {
  reply: string;
  recommendedArticles: TechNewsArticle[];
}

export async function askTechNewsAgent(
  message: string,
  context: TechNewsAgentContext = {}
): Promise<TechNewsAgentReply> {
  const response = await fetch('/api/agent/tech-news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ...context }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Tech news agent request failed');
  }

  return {
    reply: data.reply || 'I could not generate a tech news briefing right now.',
    recommendedArticles: Array.isArray(data.recommendedArticles) ? data.recommendedArticles : context.articles || [],
  };
}