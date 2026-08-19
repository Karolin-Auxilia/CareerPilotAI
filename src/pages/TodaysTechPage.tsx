import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Search,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Clock,
  Tag,
  Filter,
} from 'lucide-react';
import { fetchDailyTechNews } from '../services/news/technologyNews';
import { TechNewsArticle } from '../types';
import { getTechBookmarks, setTechBookmark } from '../services/supabase/database';
import { useAuth } from '../context/AuthContext';

export const TodaysTechPage: React.FC = () => {
  const { profile } = useAuth();
  const [articles, setArticles] = useState<TechNewsArticle[]>([]);
  const [category, setCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const categories = [
    'All',
    'AI/ML',
    'Frameworks',
    'Cloud & DevOps',
    'Cybersecurity',
    'Developer Tools',
    'Tech Trends',
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchDailyTechNews(category, searchQuery);
      setArticles(data);
      setLoading(false);
    }
    load();
  }, [category, searchQuery]);

  useEffect(() => {
    if (profile) getTechBookmarks(profile.id).then(setBookmarks).catch(console.error);
  }, [profile]);

  const toggleBookmark = async (id: string) => {
    if (!profile) return;
    const updated = bookmarks.includes(id)
      ? bookmarks.filter((b) => b !== id)
      : [...bookmarks, id];
    setBookmarks(updated);
    try {
      await setTechBookmark(profile.id, id, updated.includes(id));
    } catch (error) {
      setBookmarks(bookmarks);
      console.error('Bookmark persistence failed:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Today's Tech — Daily Engineering Updates
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Stay sharp with daily intelligence on AI breakthroughs, modern framework releases, and cloud ecosystems.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AI, React, Vite, PostgreSQL, Cloud security..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                category === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-500">Fetching today's curated updates...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-600 font-medium">No tech news matches your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const isBookmarked = bookmarks.includes(article.id);

            return (
              <div
                key={article.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200/60">
                      {article.category}
                    </span>
                    <button
                      onClick={() => toggleBookmark(article.id)}
                      className="text-slate-400 hover:text-indigo-600 p-1 transition-colors cursor-pointer"
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Article'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 hover:text-indigo-600 transition-colors leading-snug">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {article.summary}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {article.tags.map((tag, ti) => (
                      <span key={ti} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{article.read_time}</span>
                    </div>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                    >
                      <span>Read</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
