import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { GraduationCap, ClipboardCheck, TrendingUp, Award, Mail, BookOpen, ArrowLeft, Calendar, BarChart3, Target } from 'lucide-react';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => { loadProfile(); }, [id]);

  const loadProfile = async () => {
    try {
      const res = await api.get(`/profile/student/${id}`);
      setStudent(res.data);
    } catch (err) { console.error(err); }
  };

  if (!student) return <div className="max-w-5xl mx-auto px-5 py-10 text-center text-ink-soft">Loading profile...</div>;

  const standingColor = { A: 'text-teal', B: 'text-blue-500', C: 'text-brass', D: 'text-ink-soft' };
  const standingBg = { A: 'bg-teal-bg', B: 'bg-blue-50', C: 'bg-brass-bg', D: 'bg-paper-dim' };

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <Link to="/rankings" className="inline-flex items-center gap-1.5 text-ink-soft text-xs hover:text-ink mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Rankings
      </Link>

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-plum to-plum/80 rounded-2xl p-8 mb-6 text-paper relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"><div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-paper/20 flex items-center justify-center text-2xl font-bold text-paper backdrop-blur-sm">
            {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-serif text-2xl font-semibold">{student.name}</h1>
              <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${standingBg[student.stats.standing]} ${standingColor[student.stats.standing]}`}>
                Standing {student.stats.standing}
              </span>
            </div>
            <p className="text-paper/70 text-sm mb-1">{student.department} · {student.email}</p>
            <div className="flex flex-wrap gap-3 text-xs text-paper/60">
              <span>📋 {student.rollNumber}</span>
              <span>🏫 Year {student.year} · Sem {student.semester} · Section {student.section}</span>
              <span>⚡ {student.stream}</span>
              <span>🏅 Rank #{student.stats.rank} of {student.stats.totalPeers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Attendance', value: `${student.stats.attendanceRate}%`, icon: <ClipboardCheck size={14} />, color: 'teal' },
          { label: 'Marks %', value: `${student.stats.marksPercent}%`, icon: <BarChart3 size={14} />, color: 'brass' },
          { label: 'Rank', value: `#${student.stats.rank}`, icon: <Award size={14} />, color: 'plum' },
          { label: 'Standing', value: student.stats.standing, icon: <Target size={14} />, color: student.stats.standing === 'A' ? 'teal' : student.stats.standing === 'B' ? 'blue-500' : student.stats.standing === 'C' ? 'brass' : 'ink-soft' },
          { label: 'Locked Records', value: student.stats.lockedRecords, icon: <Calendar size={14} />, color: 'ink' },
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
        {['overview', 'subjects', 'attendance', 'marks'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer capitalize ${tab === t ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Subject breakdown */}
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
            <h3 className="font-serif font-semibold text-ink mb-4">Subject Performance</h3>
            <div className="space-y-3">
              {student.subjects.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-3 bg-paper-dim/50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{s.name}</div>
                    <div className="text-[10px] text-ink-muted font-mono">{s.code} · {s.credits} credits</div>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <div className="font-mono text-sm font-bold text-teal">{s.attendanceRate}%</div>
                    <div className="text-[10px] text-ink-muted">attend</div>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <div className="font-mono text-sm font-bold text-brass">{s.marksPercent}%</div>
                    <div className="text-[10px] text-ink-muted">marks</div>
                  </div>
                  <div className="w-24">
                    <div className="w-full h-2 bg-paper-dim rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal to-brass rounded-full" style={{ width: `${s.marksPercent}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subjects Detail */}
      {tab === 'subjects' && (
        <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-dim/50">
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Subject</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Sem</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Attended</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Attendance</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Marks</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Grade</th>
              </tr>
            </thead>
            <tbody>
              {student.subjects.map(s => {
                let grade = 'F';
                if (s.marksPercent >= 80) grade = 'A';
                else if (s.marksPercent >= 65) grade = 'B';
                else if (s.marksPercent >= 50) grade = 'C';
                else if (s.marksPercent >= 35) grade = 'D';
                const gc = { A: 'bg-teal text-paper', B: 'bg-blue-500 text-white', C: 'bg-brass text-paper', D: 'bg-amber-500 text-white', F: 'bg-ink-soft text-paper' };
                return (
                  <tr key={s.id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[10px] text-ink-muted font-mono">{s.code}</div>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs">{s.semester}</td>
                    <td className="px-3 py-3 text-center font-mono text-xs">{s.classesAttended}/{s.classesHeld}</td>
                    <td className="px-3 py-3 text-center"><span className="font-mono text-xs text-teal">{s.attendanceRate}%</span></td>
                    <td className="px-3 py-3 text-center font-mono text-xs">{s.marksObtained}/{s.maxMarks}</td>
                    <td className="px-3 py-3 text-center"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${gc[grade]}`}>{grade}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
            <h3 className="font-serif font-semibold text-ink mb-4">Attendance History</h3>
            <div className="space-y-1.5">
              {student.attendanceHistory.slice(0, 30).map(a => (
                <div key={a._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-paper-dim/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${a.status === 'present' ? 'bg-teal' : 'bg-absent'}`} />
                  <span className="font-mono text-xs text-ink-muted w-24">{a.date}</span>
                  <span className={`text-xs font-medium ${a.status === 'present' ? 'text-teal' : 'text-absent'}`}>
                    {a.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                  {a.locked && <span className="px-1.5 py-0.5 bg-brass-bg text-brass rounded text-[9px] font-mono font-bold">🔒</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Marks */}
      {tab === 'marks' && (
        <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-dim/50">
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Subject</th>
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Exam Type</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Marks</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {student.marksHistory.map(m => {
                const pct = Math.round((m.marksObtained / m.maxMarks) * 100);
                return (
                  <tr key={m._id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                    <td className="px-4 py-3 font-medium">{m.subjectId}</td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{m.examType}</td>
                    <td className="px-3 py-3 text-center font-mono text-xs">{m.marksObtained}/{m.maxMarks}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-1.5 bg-paper-dim rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 60 ? 'bg-teal' : pct >= 40 ? 'bg-brass' : 'bg-absent'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-xs font-bold">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
