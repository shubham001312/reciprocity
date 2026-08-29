import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, FileText, ClipboardCheck, TrendingUp, Mail, Building2, Award, Clock, ArrowLeft } from 'lucide-react';

export default function ProfessorProfile() {
  const { id } = useParams();
  const [prof, setProf] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => { loadProfile(); }, [id]);

  const loadProfile = async () => {
    try {
      const res = await api.get(`/profile/professor/${id}`);
      setProf(res.data);
    } catch (err) { console.error(err); }
  };

  if (!prof) return <div className="max-w-5xl mx-auto px-5 py-10 text-center text-ink-soft">Loading profile...</div>;

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      {/* Back link */}
      <Link to="/rankings" className="inline-flex items-center gap-1.5 text-ink-soft text-xs hover:text-ink mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Rankings
      </Link>

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-teal to-teal/80 rounded-2xl p-8 mb-6 text-paper relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"><div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-paper/20 flex items-center justify-center text-2xl font-bold text-paper backdrop-blur-sm">
            {prof.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-semibold mb-1">{prof.name}</h1>
            <p className="text-paper/70 text-sm mb-3">{prof.department} · {prof.email}</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5"><BookOpen size={13} className="text-paper/60" /><span className="text-xs">{prof.stats.totalClasses} classes</span></div>
              <div className="flex items-center gap-1.5"><ClipboardCheck size={13} className="text-paper/60" /><span className="text-xs">{prof.stats.avgAttendance}% attendance</span></div>
              <div className="flex items-center gap-1.5"><FileText size={13} className="text-paper/60" /><span className="text-xs">{prof.stats.totalNotes} notes</span></div>
              <div className="flex items-center gap-1.5"><Award size={13} className="text-paper/60" /><span className="text-xs">{prof.stats.avgSimilarity}% avg similarity</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Classes Taken', value: prof.stats.totalClasses, icon: <BookOpen size={14} />, color: 'teal' },
          { label: 'Total Students', value: prof.stats.totalStudents, icon: <Users size={14} />, color: 'plum' },
          { label: 'Avg Attendance', value: `${prof.stats.avgAttendance}%`, icon: <ClipboardCheck size={14} />, color: 'teal' },
          { label: 'Notes Recorded', value: prof.stats.totalNotes, icon: <FileText size={14} />, color: 'brass' },
          { label: 'Avg Similarity', value: `${prof.stats.avgSimilarity}%`, icon: <Award size={14} />, color: 'brass' },
        ].map((s, i) => (
          <div key={i} className="bg-surface border border-line rounded-xl p-4 shadow-card text-center">
            <div className={`w-8 h-8 rounded-lg bg-${s.color}-bg flex items-center justify-center mx-auto mb-2`}>
              <span className={`text-${s.color}`}>{s.icon}</span>
            </div>
            <div className={`font-mono text-xl font-bold text-${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-ink-muted font-mono uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-paper-dim rounded-xl p-1 mb-6">
        {['overview', 'subjects', 'classes', 'notes', 'papers'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer capitalize ${tab === t ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {prof.monthlyActivity?.length > 0 && (
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-4">Monthly Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={prof.monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="classes" fill="#1F6E76" name="Classes" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
            <h3 className="font-serif font-semibold text-ink mb-4">Subject Performance</h3>
            <div className="space-y-3">
              {prof.subjects.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-3 bg-paper-dim/50 rounded-xl">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-[10px] text-ink-muted font-mono">{s.code} · Sem {s.semester} · {s.credits} credits</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-teal">{s.avgAttendance}%</div>
                    <div className="text-[10px] text-ink-muted">{s.classesHeld} classes</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-brass">{s.notesRecorded} notes</div>
                    <div className="text-[10px] text-ink-muted">{s.topicsCovered} topics</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subjects */}
      {tab === 'subjects' && (
        <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-line bg-paper-dim/50">
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Subject</th>
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Code</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Sem</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Credits</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Classes</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Attendance</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {prof.subjects.map(s => (
                <tr key={s.id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.code}</td>
                  <td className="px-3 py-3 text-center font-mono text-xs">{s.semester}</td>
                  <td className="px-3 py-3 text-center font-mono text-xs">{s.credits}</td>
                  <td className="px-3 py-3 text-center font-mono text-xs">{s.classesHeld}</td>
                  <td className="px-3 py-3 text-center"><span className="font-mono text-xs text-teal">{s.avgAttendance}%</span></td>
                  <td className="px-3 py-3 text-center font-mono text-xs">{s.notesRecorded}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {/* Recent Classes */}
      {tab === 'classes' && (
        <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-line bg-paper-dim/50">
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Date</th>
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Topic</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Duration</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Present</th>
              </tr>
            </thead>
            <tbody>
              {prof.recentClasses.map(c => (
                <tr key={c._id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                  <td className="px-4 py-3 font-mono text-xs">{c.date}</td>
                  <td className="px-4 py-3 text-sm">{c.topic}</td>
                  <td className="px-3 py-3 text-center font-mono text-xs">{c.duration}min</td>
                  <td className="px-3 py-3 text-center font-mono text-xs">{c.studentsPresent}/{c.totalStudents}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {prof.recentClasses.length === 0 && <div className="py-8 text-center text-ink-muted text-sm">No classes recorded yet.</div>}
        </div>
      )}

      {/* Notes */}
      {tab === 'notes' && (
        <div className="space-y-3">
          {prof.recentNotes.map(n => (
            <div key={n._id} className="bg-surface border border-line rounded-xl p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-ink">{n.title}</h4>
                  <div className="text-[10px] text-ink-muted font-mono mt-1">{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              {n.topicsCovered?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {n.topicsCovered.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 bg-teal-bg text-teal rounded-lg text-[10px] font-mono">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {prof.recentNotes.length === 0 && <div className="py-8 text-center text-ink-muted text-sm">No notes recorded yet.</div>}
        </div>
      )}

      {/* Question Papers */}
      {tab === 'papers' && (
        <div className="space-y-3">
          {prof.recentPapers.map(q => (
            <div key={q._id} className="bg-surface border border-line rounded-xl p-4 shadow-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-brass-bg flex items-center justify-center"><FileText size={16} className="text-brass" /></div>
              <div className="flex-1">
                <h4 className="font-medium text-ink text-sm">{q.title}</h4>
                <div className="text-[10px] text-ink-muted font-mono">{new Date(q.uploadedAt).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-brass">{q.similarityScore}%</div>
                <div className="text-[10px] text-ink-muted">similarity</div>
              </div>
            </div>
          ))}
          {prof.recentPapers.length === 0 && <div className="py-8 text-center text-ink-muted text-sm">No papers uploaded yet.</div>}
        </div>
      )}
    </div>
  );
}
