import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Building2, Users, GraduationCap, BookOpen, Calendar, Award, TrendingUp, ArrowLeft, Globe, MapPin, Star, ChevronRight } from 'lucide-react';

const COLORS = ['#1F6E76', '#A8862F', '#7C2D5F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function CollegeProfile() {
  const { id } = useParams();
  const [college, setCollege] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCollege(); }, [id]);

  const loadCollege = async () => {
    try {
      const res = await api.get(`/profile/college/${id}`);
      setCollege(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (loading) return <div className="max-w-6xl mx-auto px-5 py-10 text-center text-ink-soft">Loading college profile...</div>;
  if (!college) return <div className="max-w-6xl mx-auto px-5 py-10 text-center text-ink-soft">College not found.</div>;

  const scoreColor = (score) => {
    if (score >= 70) return 'text-teal';
    if (score >= 50) return 'text-brass';
    if (score >= 30) return 'text-amber-600';
    return 'text-ink-soft';
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <Link to="/colleges" className="inline-flex items-center gap-1.5 text-ink-soft text-xs hover:text-ink mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Colleges
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-teal to-teal/80 rounded-2xl p-5 md:p-8 mb-6 text-paper relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"><div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={20} className="text-paper/60" />
            <span className="font-mono text-[10px] text-paper/50 uppercase tracking-widest">{college.code}</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold mb-2">{college.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-paper/70">
            {college.accreditation && <span className="flex items-center gap-1"><Award size={13} /> {college.accreditation}</span>}
            {college.affiliation && <span className="flex items-center gap-1"><Star size={13} /> {college.affiliation}</span>}
            {college.established && <span className="flex items-center gap-1"><Calendar size={13} /> Est. {college.established}</span>}
            {college.address && <span className="flex items-center gap-1"><MapPin size={13} /> {college.address}</span>}
          </div>
          <div className="flex gap-6 mt-4">
            <div><span className="font-mono text-2xl font-bold">{college.totalProfessors}</span><span className="text-[10px] text-paper/50 ml-1">Faculty</span></div>
            <div><span className="font-mono text-2xl font-bold">{college.totalStudents}</span><span className="text-[10px] text-paper/50 ml-1">Students</span></div>
            <div><span className="font-mono text-2xl font-bold">{college.totalSubjects}</span><span className="text-[10px] text-paper/50 ml-1">Subjects</span></div>
            <div><span className="font-mono text-2xl font-bold">{college.overallStats?.avgAttendance || 0}%</span><span className="text-[10px] text-paper/50 ml-1">Attendance</span></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-paper-dim rounded-xl p-1 mb-6 overflow-x-auto">
        {['overview', 'departments', 'faculty', 'students', 'streams'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 min-w-[80px] px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer capitalize whitespace-nowrap ${
              tab === t ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'
            }`}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Avg Attendance', value: `${college.overallStats?.avgAttendance || 0}%`, color: 'teal' },
              { label: 'Avg Marks', value: `${college.overallStats?.avgMarks || 0}%`, color: 'brass' },
              { label: 'Total Classes', value: college.totalClasses, color: 'plum' },
              { label: 'Departments', value: college.departments?.length || 0, color: 'ink' },
            ].map((s, i) => (
              <div key={i} className="bg-surface border border-line rounded-xl p-4 shadow-card text-center">
                <div className={`font-mono text-2xl font-bold text-${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-ink-muted font-mono uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Year breakdown */}
          {college.yearBreakdown?.length > 0 && (
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-4">Year Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={college.yearBreakdown.map(y => ({ name: `Year ${y.year}`, count: y.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                    {college.yearBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Stream breakdown */}
          {college.streams?.length > 0 && (
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-4">Stream Distribution</h3>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="40%" height={180}>
                  <PieChart>
                    <Pie data={college.streams.filter(s => s.count > 0)} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {college.streams.filter(s => s.count > 0).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {college.streams.filter(s => s.count > 0).map((s, i) => (
                    <div key={s.name} className="flex items-center gap-3 p-2 bg-paper-dim/50 rounded-lg">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium text-sm flex-1">{s.name}</span>
                      <span className="font-mono text-xs text-ink-muted">{s.count} students</span>
                      <span className="font-mono text-xs text-teal">{s.avgAttendance}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Departments */}
      {tab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(college.departments || []).map((d, i) => (
            <div key={d.name} className="bg-surface border border-line rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] + '20', color: COLORS[i % COLORS.length] }}>
                  {d.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-serif font-semibold text-ink text-sm">{d.name}</h4>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-paper-dim rounded-lg">
                  <div className="font-mono text-lg font-bold text-teal">{d.professors}</div>
                  <div className="text-[10px] text-ink-muted">Faculty</div>
                </div>
                <div className="text-center p-2 bg-paper-dim rounded-lg">
                  <div className="font-mono text-lg font-bold text-plum">{d.students}</div>
                  <div className="text-[10px] text-ink-muted">Students</div>
                </div>
                <div className="text-center p-2 bg-paper-dim rounded-lg">
                  <div className="font-mono text-lg font-bold text-brass">{d.subjects}</div>
                  <div className="text-[10px] text-ink-muted">Subjects</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Faculty */}
      {tab === 'faculty' && (
        <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[450px]">
            <thead>
              <tr className="border-b border-line bg-paper-dim/50">
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5 w-12">#</th>
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Professor</th>
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Department</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Classes</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Attendance</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Similarity</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Score</th>
              </tr>
            </thead>
            <tbody>
              {(college.professors || []).map((p, i) => (
                <tr key={p.id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30 transition-colors">
                  <td className="px-3 py-3 text-center font-mono text-xs text-ink-muted">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link to={`/profile/professor/${p.id}`} className="flex items-center gap-2 group">
                      <div className="w-8 h-8 rounded-lg bg-teal-bg flex items-center justify-center text-[10px] font-bold text-teal">{p.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                      <span className="font-medium group-hover:text-teal transition-colors">{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-soft">{p.department}</td>
                  <td className="px-3 py-3 text-center font-mono text-xs">{p.classesTaken}</td>
                  <td className="px-3 py-3 text-center font-mono text-xs text-teal">{p.avgAttendance}%</td>
                  <td className="px-3 py-3 text-center font-mono text-xs text-brass">{p.avgSimilarity}%</td>
                  <td className="px-3 py-3 text-center"><span className={`font-mono text-sm font-bold ${scoreColor(p.score)}`}>{p.score}</span></td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {(!college.professors || college.professors.length === 0) && (
            <div className="py-12 text-center text-ink-muted text-sm">No faculty members found.</div>
          )}
        </div>
      )}

      {/* Students placeholder */}
      {tab === 'students' && (
        <div className="bg-surface border border-line rounded-2xl p-8 shadow-card text-center">
          <GraduationCap size={32} className="text-ink-soft/30 mx-auto mb-3" />
          <h3 className="font-serif font-semibold text-ink mb-1">{college.totalStudents} Students</h3>
          <p className="text-ink-soft text-sm">Student list is managed through designation requests. Visit the Rankings page to browse students.</p>
          <Link to="/rankings" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-teal text-paper text-xs font-medium rounded-xl hover:bg-teal/90 transition-all">
            View Rankings <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Streams */}
      {tab === 'streams' && (
        <div className="space-y-4">
          {(college.streams || []).filter(s => s.count > 0).map((s, i) => (
            <div key={s.name} className="bg-surface border border-line rounded-xl p-5 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] + '20', color: COLORS[i % COLORS.length] }}>
                {s.name}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-ink">{s.name} Stream</h4>
                <div className="text-xs text-ink-muted mt-1">{s.count} students enrolled</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-bold text-teal">{s.avgAttendance}%</div>
                <div className="text-[10px] text-ink-muted">Avg Attendance</div>
              </div>
              <div className="w-24">
                <div className="w-full h-2 bg-paper-dim rounded-full overflow-hidden">
                  <div className="h-full bg-teal rounded-full" style={{ width: `${s.avgAttendance}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
