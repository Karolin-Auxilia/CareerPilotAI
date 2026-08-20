import { TechNewsArticle } from '../../types';

export async function fetchDailyTechNews(category?: string, query?: string): Promise<TechNewsArticle[]> {
  try {
    const url = new URL('/api/news', window.location.origin);
    if (category && category !== 'All') url.searchParams.set('category', category);
    if (query) url.searchParams.set('q', query);

    const response = await fetch(url.toString());
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.articles)) {
        return data.articles.map((article: Partial<TechNewsArticle> & { tags?: string[] }) => ({
          id: article.id || 'news_unknown',
          title: article.title || 'Untitled article',
          summary: article.summary || 'No summary available.',
          category: article.category || 'Tech Trends',
          date: article.date || 'Today',
          source: article.source || 'Tech Bulletin',
          read_time: article.read_time || '3 min read',
          url: article.url || 'https://example.com',
          tags: Array.isArray(article.tags) ? article.tags : [],
        }));
      }
    }
  } catch (e) {
    console.warn('Backend news API fallback:', e);
  }

  return getCuratedTechNews(category, query);
}

export function getCuratedTechNews(category?: string, query?: string): TechNewsArticle[] {
  const articles: TechNewsArticle[] = [
    {
      id: 'news_1',
      title: 'Google Announces Gemini 2.5 Flash & Next-Gen Realtime Multimodal Interactions',
      summary: 'Enhanced reasoning capabilities, sub-100ms audio streaming latency, and native structured schema generation accelerate enterprise AI assistant deployments.',
      category: 'AI/ML',
      date: 'Aug 18, 2026',
      source: 'Google DeepMind Blog',
      read_time: '3 min read',
      url: 'https://blog.google/technology/ai/',
      tags: ['Gemini', 'Multimodal', 'LLMs', 'Realtime'],
    },
    {
      id: 'news_2',
      title: 'Vite 6 & React 19 Ecosystem: The Shift Towards Compiler-First Web Apps',
      summary: 'How React Compiler and Vite 6 are standardizing instant build times, automatic memoization, and fine-grained reactivity across modern frontends.',
      category: 'Frameworks',
      date: 'Aug 17, 2026',
      source: 'Frontend Weekly',
      read_time: '4 min read',
      url: 'https://vitejs.dev/blog/',
      tags: ['React 19', 'Vite', 'Frontend', 'Performance'],
    },
    {
      id: 'news_3',
      title: 'PostgreSQL 17 Vector Extensions Redefine Hybrid Relational and Semantic Search',
      summary: 'Native disk-optimized index formats allow engineering teams to run high-dimension vector queries alongside standard SQL transactions in a single database.',
      category: 'Cloud & DevOps',
      date: 'Aug 16, 2026',
      source: 'Postgres Engineering News',
      read_time: '5 min read',
      url: 'https://www.postgresql.org/about/news/',
      tags: ['PostgreSQL', 'SQL', 'Vector Database', 'RAG'],
    },
    {
      id: 'news_4',
      title: 'Container Security in 2026: Shift-Left Vulnerability Scanning in CI/CD',
      summary: 'Adopting distroless base images and automated software bill of materials (SBOM) checks significantly reduces attack surfaces for cloud microservices.',
      category: 'Cybersecurity',
      date: 'Aug 15, 2026',
      source: 'Cloud Native Computing Foundation',
      read_time: '4 min read',
      url: 'https://www.cncf.io/blog/',
      tags: ['Security', 'Docker', 'Kubernetes', 'CI/CD'],
    },
    {
      id: 'news_5',
      title: 'TypeScript 5.8 Introduces Granular Type Checking for Asynchronous Control Flows',
      summary: 'New compiler flags catch subtle race conditions and unhandled error boundaries in distributed microservices before code reaches staging.',
      category: 'Developer Tools',
      date: 'Aug 14, 2026',
      source: 'Microsoft TypeScript Team',
      read_time: '3 min read',
      url: 'https://devblogs.microsoft.com/typescript/',
      tags: ['TypeScript', 'JavaScript', 'Developer Tools'],
    },
    {
      id: 'news_6',
      title: 'Why Full-Stack Engineers with AI Workflow Fluency are in Record Demand',
      summary: 'Industry survey reveals tech companies prioritize developers who can build real integrations, manage token budgets, and implement resilient fallback heuristics.',
      category: 'Tech Trends',
      date: 'Aug 13, 2026',
      source: 'Tech Talent Index',
      read_time: '4 min read',
      url: 'https://news.ycombinator.com',
      tags: ['Career Growth', 'Hiring Trends', 'Full-Stack'],
    },
  ];

  let filtered = articles;
  if (category && category !== 'All') {
    filtered = filtered.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  }

  if (query && query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return filtered;
}
