import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Tag,
  Layers,
  Save,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyzeResume, analyzeManualSkills } from '../services/ai/resumeAnalyzer';
import { getSkills, saveSkills, saveResume } from '../services/supabase/database';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { SkillItem } from '../types';

export const ResumeSkillsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'manual'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedResumeText, setPastedResumeText] = useState<string>('');
  const [extractedSkills, setExtractedSkills] = useState<SkillItem[]>([]);
  const [manualInput, setManualInput] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [newSkillModalOpen, setNewSkillModalOpen] = useState<boolean>(false);
  const [newSkillName, setNewSkillName] = useState<string>('');
  const [newSkillCat, setNewSkillCat] = useState<string>('Programming Languages');
  const [newSkillProf, setNewSkillProf] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');

  // Load previously saved skills
  useEffect(() => {
    async function fetchExisting() {
      if (!profile) return;
      const existing = await getSkills(profile.id);
      if (existing && existing.length > 0) {
        setExtractedSkills(existing);
      }
    }
    fetchExisting();
  }, [profile]);

  const handleFileUpload = async (selectedFile: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const hasValidExt = validExtensions.some((ext) => selectedFile.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(selectedFile.type) && !hasValidExt) {
      setMessage({ type: 'error', text: 'Please upload a PDF, DOCX, TXT, or MD resume file.' });
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be under 15MB.' });
      return;
    }

    setFile(selectedFile);
    setMessage(null);
    setAnalyzing(true);

    try {
      let result;

      if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.md')) {
        const textContent = await selectedFile.text();
        result = await analyzeResume({
          resumeText: textContent,
          fileName: selectedFile.name,
        });

        if (profile) {
          await saveResume(profile.id, {
            file_name: selectedFile.name,
            file_size: selectedFile.size,
            extracted_text: textContent.slice(0, 10000),
          });
        }
      } else {
        // Extract real text from PDF / document client-side
        let extractedPdfText = '';
        if (selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')) {
          try {
            extractedPdfText = await extractTextFromPdf(selectedFile);
          } catch (e) {
            console.warn('PDF text extraction error:', e);
          }
        }

        // Read file as base64 for direct AI document parsing
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(selectedFile);
        });

        result = await analyzeResume({
          resumeText: extractedPdfText,
          base64Data,
          mimeType: selectedFile.type || 'application/pdf',
          fileName: selectedFile.name,
        });

        if (profile) {
          await saveResume(profile.id, {
            file_name: selectedFile.name,
            file_size: selectedFile.size,
            extracted_text: (extractedPdfText || `Document uploaded: ${selectedFile.name}`).slice(0, 10000),
          });
        }
      }

      if (!result || !result.skills || result.skills.length === 0) {
        setMessage({
          type: 'error',
          text: 'No technical skills could be extracted from this document. Please check the file contents or paste your resume text in Option B.',
        });
        setAnalyzing(false);
        return;
      }

      const formattedSkills: SkillItem[] = result.skills.map((s, idx) => ({
        id: 'sk_res_' + Date.now() + '_' + idx,
        skill_name: s.skill_name,
        category: s.category || 'General',
        proficiency: s.proficiency || 'Intermediate',
        confidence: s.confidence || 0.95,
        evidence: s.evidence || `Directly extracted from ${selectedFile.name}`,
        source: 'resume' as const,
      }));

      setExtractedSkills(formattedSkills);
      setMessage({
        type: 'success',
        text: `Successfully extracted ${formattedSkills.length} skills directly from ${selectedFile.name}!`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to extract skills from document.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePasteAnalyze = async () => {
    if (!pastedResumeText.trim()) {
      setMessage({ type: 'error', text: 'Please paste your resume text or project descriptions into the box.' });
      return;
    }

    setAnalyzing(true);
    setMessage(null);

    try {
      const result = await analyzeResume({
        resumeText: pastedResumeText,
        fileName: 'Pasted Resume Text',
      });

      if (!result || !result.skills || result.skills.length === 0) {
        setMessage({
          type: 'error',
          text: 'No technical skills were identified in the pasted text. Please verify the content.',
        });
        setAnalyzing(false);
        return;
      }

      const formattedSkills: SkillItem[] = result.skills.map((s, idx) => ({
        id: 'sk_paste_' + Date.now() + '_' + idx,
        skill_name: s.skill_name,
        category: s.category || 'General',
        proficiency: s.proficiency || 'Intermediate',
        confidence: s.confidence || 0.95,
        evidence: s.evidence || 'Extracted from pasted resume text',
        source: 'resume' as const,
      }));

      setExtractedSkills(formattedSkills);

      if (profile) {
        await saveResume(profile.id, {
          file_name: 'Pasted Resume',
          file_size: pastedResumeText.length,
          extracted_text: pastedResumeText.slice(0, 10000),
        });
      }

      setMessage({
        type: 'success',
        text: `Extracted ${formattedSkills.length} skills directly from your pasted resume content!`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to analyze pasted text.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualAnalyze = async () => {
    if (!manualInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter at least one skill.' });
      return;
    }

    setAnalyzing(true);
    setMessage(null);

    try {
      const skillsArray = manualInput.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
      const result = await analyzeManualSkills(skillsArray);

      if (!result || !result.skills || result.skills.length === 0) {
        setMessage({ type: 'error', text: 'No valid skills were recognized.' });
        setAnalyzing(false);
        return;
      }

      const formattedSkills: SkillItem[] = result.skills.map((s, idx) => ({
        id: 'sk_man_' + Date.now() + '_' + idx,
        skill_name: s.skill_name,
        category: s.category || 'General',
        proficiency: s.proficiency || 'Intermediate',
        confidence: s.confidence || 0.95,
        evidence: s.evidence || 'User self-declared',
        source: 'manual' as const,
      }));

      setExtractedSkills(formattedSkills);
      setMessage({ type: 'success', text: `Added ${formattedSkills.length} skills to your technical profile!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to analyze skills.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAll = async () => {
    if (!profile) return;
    if (extractedSkills.length === 0) {
      setMessage({ type: 'error', text: 'No skills to save. Please extract or enter skills first.' });
      return;
    }

    setSaving(true);
    try {
      await saveSkills(profile.id, extractedSkills, 'resume');
      setMessage({ type: 'success', text: 'All skills saved successfully to your profile!' });
      setTimeout(() => {
        navigate('/assessment');
      }, 1000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save skills.' });
    } finally {
      setSaving(false);
    }
  };

  const removeSkill = (id: string) => {
    setExtractedSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddCustomSkill = () => {
    if (!newSkillName.trim()) return;
    const newSkill: SkillItem = {
      id: 'custom_' + Date.now(),
      user_id: profile?.id || 'user',
      skill_name: newSkillName.trim(),
      category: newSkillCat,
      proficiency: newSkillProf,
      confidence: 1.0,
      evidence: 'Directly specified by candidate',
      source: 'manual',
    };
    setExtractedSkills((prev) => [newSkill, ...prev]);
    setNewSkillName('');
    setNewSkillModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Resume & Skill Extraction
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Extract actual technical skills directly from your resume document, paste your content, or declare your skillset.
          </p>
        </div>

        {extractedSkills.length > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Skills...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Proceed to Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Input Options Tabs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap border-b border-slate-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Option 1: Upload Resume File (.PDF / .DOCX / .TXT)</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Option 2: Paste Resume Text</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Option 3: Enter Skills Manually</span>
          </button>
        </div>

        {/* Tab 1: Upload File */}
        {activeTab === 'upload' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-colors ${
              dragOver
                ? 'border-emerald-600 bg-emerald-50/50'
                : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mx-auto mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Drag & Drop your actual resume document here
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              Our AI reads your document directly to extract only the verifiable skills listed in your resume.
            </p>

            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all">
              <FileText className="w-4 h-4" />
              <span>{file ? `Change file (${file.name})` : 'Choose Resume File'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            {analyzing && (
              <div className="mt-6 flex items-center justify-center gap-2.5 text-xs text-emerald-700 font-semibold animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reading document and extracting actual skills from your resume...</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Paste Resume Text */}
        {activeTab === 'paste' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Paste your resume text, summary, project bullet points, or skills section here:
              </label>
              <textarea
                rows={7}
                value={pastedResumeText}
                onChange={(e) => setPastedResumeText(e.target.value)}
                placeholder="e.g. Senior Software Engineer with 4 years experience in Python, Django, PostgreSQL, Docker, AWS, React. Built automated data pipeline with Kafka and PyTorch..."
                className="w-full p-3.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePasteAnalyze}
                disabled={analyzing || !pastedResumeText.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Skills from Text...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract Real Skills from Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Manual Skills */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enter your exact technical skills, languages, and tools (comma separated):
              </label>
              <textarea
                rows={4}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. Python, Django, PostgreSQL, Docker, AWS, Redis, React, Git"
                className="w-full p-3.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleManualAnalyze}
                disabled={analyzing || !manualInput.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Structure & Save Skills</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Skills Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Extracted Technical Skills from Your Resume</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {extractedSkills.length} Total
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These exact skills are used to formulate your custom 15-question quiz, skill gap diagnosis, and career roadmaps.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewSkillModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Skill</span>
            </button>
          </div>
        </div>

        {extractedSkills.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">
              No skills added yet. Upload your resume or paste your text above to extract your actual skillset.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extractedSkills.map((skill) => (
              <div
                key={skill.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{skill.skill_name}</h4>
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                      {skill.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        skill.proficiency === 'Expert'
                          ? 'bg-purple-100 text-purple-800'
                          : skill.proficiency === 'Advanced'
                          ? 'bg-blue-100 text-blue-800'
                          : skill.proficiency === 'Intermediate'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {skill.proficiency}
                    </span>
                  </div>

                  {skill.evidence && (
                    <p className="text-[11px] text-slate-600 italic line-clamp-2 leading-relaxed bg-white/80 p-1.5 rounded border border-slate-100">
                      "{skill.evidence}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Skill Modal */}
      {newSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Skill</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Skill Name</label>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. Python, PyTorch, Docker"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newSkillCat}
                  onChange={(e) => setNewSkillCat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Programming Languages">Programming Languages</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Databases">Databases</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Tools & Workflows">Tools & Workflows</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proficiency Level</label>
                <select
                  value={newSkillProf}
                  onChange={(e) => setNewSkillProf(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setNewSkillModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
