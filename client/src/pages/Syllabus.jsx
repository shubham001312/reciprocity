import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api';
import { CheckCircle2, Circle, BookOpen } from 'lucide-react';

export default function Syllabus() {
  const { user } = useAuth();
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSyllabus();
  }, []);

  const loadSyllabus = async () => {
    try {
      const res = await api.get('/syllabus');
      setSyllabus(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto px-5 py-10 text-center text-ink-soft">Loading syllabus...</div>;

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">Syllabus & Topic Coverage</h1>
        <p className="text-ink-soft text-sm mt-1">Track which topics have been covered across all subjects this semester.</p>
      </div>

      <div className="space-y-6">
        {syllabus.map(s => (
          <div key={s.id} className="border border-line rounded bg-paper">
            {/* Subject Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-paper-dim">
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="text-teal" />
                <div>
                  <h3 className="font-serif font-semibold text-lg">{s.subjectName}</h3>
                  <p className="font-mono text-[10px] text-ink-soft uppercase tracking-wider">{s.subjectCode} · Semester {s.semester || 3}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold text-brass">{s.coveragePercentage}%</div>
                <div className="font-mono text-[10px] text-ink-soft uppercase">Coverage</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <div className="h-3 bg-paper-dim border border-line rounded overflow-hidden">
                <div className="h-full bg-teal rounded transition-all" style={{ width: `${s.coveragePercentage}%` }}></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-[10px] text-ink-soft">{s.coveredTopics} of {s.totalTopics} topics covered</span>
                <span className="font-mono text-[10px] text-ink-soft">{s.classesHeld} classes held</span>
              </div>
            </div>

            {/* Topics */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {s.topics.map((t, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                    t.covered ? 'bg-present-bg' : 'bg-paper-dim'
                  }`}>
                    {t.covered ? (
                      <CheckCircle2 size={16} className="text-present flex-shrink-0" />
                    ) : (
                      <Circle size={16} className="text-ink-soft/40 flex-shrink-0" />
                    )}
                    <span className={t.covered ? 'text-ink font-medium' : 'text-ink-soft'}>{t.topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {syllabus.length === 0 && (
        <div className="text-center py-16 border border-line rounded">
          <BookOpen size={48} className="mx-auto text-ink-soft/30 mb-4" />
          <p className="text-ink-soft">No syllabus data available.</p>
        </div>
      )}
    </div>
  );
}
