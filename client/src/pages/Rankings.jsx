import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Medal, Award, TrendingUp, Users, GraduationCap, Building2, ChevronRight, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const COLORS = ['#1F6E76', '#A8862F', '#7C2D5F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function Rankings() {
  const [tab, setTab] = useState('colleges');
  const [colleges, setColleges] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState({ year: '', stream: '', section: '' });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [cRes, pRes, sRes, stRes] = await Promise.all([
        api.get('/rankings/colleges'),
        api.get('/rankings/professors'),
        api.get('/rankings/students'),
        api.get('/rankings/stats'),
      ]);
      setColleges(cRes.data);
      setProfessors(pRes.data);
      setStudents(sRes.data);
      setStats(stRes.data);
    } catch (err) { console.error(err); }
  };

  const medalFor = (rank) => {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="font-mono text-xs text-ink-muted w-6 text-center">{rank}</span>;
  };

  const scoreColor = (score) => {
    if (score >= 70) return 'text-teal';
    if (score >= 50) return 'text-brass';
    if (score >= 30) return 'text-amber-600';
    return 'text-absent';
  };

  const standingBadge = (s) => {
    const colors = { A: 'bg-teal text-paper', B: 'bg-blue-500 text-white', C: 'bg-brass text-paper', D: 'bg-ink-soft text-paper' };
    return <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${colors[s] || colors.D}`}>{s}</span>;
  };

  const filteredStudents = students.filter(s => {
    if (debouncedSearch && !s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) && !s.rollNumber?.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
    if (filter.year && s.year !== parseInt(filter.year)) return false;
    if (filter.stream && s.stream !== filter.stream) return false;
    if (filter.section && s.section !== filter.section) return false;
    return true;
  });

  const filteredProfs = professors.filter(p => {
    if (debouncedSearch && !p.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
    return true;
  });

  if (!stats) return <div className="max-w-6xl mx-auto px-5 py-10 text-center text-ink-soft">Loading rankings...</div>;

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-ink to-ink/90 rounded-2xl p-5 md:p-8 mb-8 text-paper relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"><div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2"><Trophy size={20} className="text-brass" /><span className="font-mono text-[10px] text-brass uppercase tracking-widest">Live Rankings</span></div>
          <h1 className="font-serif text-3xl font-semibold mb-2">Performance Rankings</h1>
          <p className="text-paper/60 text-sm">Real-time rankings based on attendance, marks, faculty performance, and institutional metrics.</p>
          <div className="flex gap-6 mt-4">
            <div><span className="font-mono text-2xl font-bold text-brass">{stats.colleges}</span><span className="text-[10px] text-paper/50 ml-1 uppercase">Colleges</span></div>
            <div><span className="font-mono text-2xl font-bold text-teal">{stats.professors}</span><span className="text-[10px] text-paper/50 ml-1 uppercase">Professors</span></div>
            <div><span className="font-mono text-2xl font-bold text-plum">{stats.students}</span><span className="text-[10px] text-paper/50 ml-1 uppercase">Students</span></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-paper-dim rounded-xl p-1 mb-6">
        {[
          { id: 'colleges', label: 'College Rankings', icon: Building2 },
          { id: 'professors', label: 'Faculty Rankings', icon: Users },
          { id: 'students', label: 'Student Rankings', icon: GraduationCap },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); setFilter({ year: '', stream: '', section: '' }); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              tab === t.id ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'
            }`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="w-full pl-4 pr-4 py-2.5 border border-line rounded-xl text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all" />
        </div>
        {tab === 'students' && (
          <>
            <select value={filter.year} onChange={e => setFilter({ ...filter, year: e.target.value })}
              className="border border-line rounded-xl px-3 py-2 text-xs bg-surface focus:outline-none focus:border-teal cursor-pointer">
              <option value="">All Years</option>
              {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <select value={filter.stream} onChange={e => setFilter({ ...filter, stream: e.target.value })}
              className="border border-line rounded-xl px-3 py-2 text-xs bg-surface focus:outline-none focus:border-teal cursor-pointer">
              <option value="">All Streams</option>
              {['CSE', 'ECE', 'IT', 'EE', 'ME'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filter.section} onChange={e => setFilter({ ...filter, section: e.target.value })}
              className="border border-line rounded-xl px-3 py-2 text-xs bg-surface focus:outline-none focus:border-teal cursor-pointer">
              <option value="">All Sections</option>
              {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </>
        )}
      </div>

      {/* College Rankings */}
      {tab === 'colleges' && (
        <div className="space-y-4">
          {/* Top 3 podium */}
          {colleges.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 0, 2].map(i => {
                const c = colleges[i];
                if (!c) return <div key={i} />;
                const heights = ['h-40', 'h-32', 'h-28'];
                return (
                  <Link key={c.id} to={`/colleges/${c.id}`}
                    className={`bg-surface border border-line rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all text-center group ${i === 0 ? 'md:order-2' : i === 1 ? 'md:order-1' : 'md:order-3'}`}>
                    <div className="text-3xl mb-2">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                    <h3 className="font-serif font-semibold text-sm text-ink mb-1 group-hover:text-teal transition-colors">{c.name}</h3>
                    <div className="font-mono text-2xl font-bold text-teal mb-2">{c.compositeScore}</div>
                    <div className="text-[10px] text-ink-muted font-mono">SCORE</div>
                    <div className={`w-full ${heights[i]} bg-gradient-to-t from-teal/20 to-transparent rounded-xl mt-3 flex items-end justify-center pb-2`}>
                      <div className="flex gap-3 text-[10px] text-ink-muted">
                        <span>{c.totalProfessors} profs</span>
                        <span>{c.totalStudents} studs</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {/* Full list */}
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[550px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim/50">
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5 w-12">Rank</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">College</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Faculty</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Students</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Attendance</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Marks</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Score</th>
                </tr>
              </thead>
              <tbody>
                {colleges.map(c => (
                  <tr key={c.id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30 transition-colors">
                    <td className="px-3 py-3 text-center">{medalFor(c.rank)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/colleges/${c.id}`} className="font-medium text-ink hover:text-teal transition-colors">{c.name}</Link>
                      <div className="text-[10px] text-ink-muted font-mono">{c.code} · {c.accreditation || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs">{c.totalProfessors}</td>
                    <td className="px-3 py-3 text-center font-mono text-xs">{c.totalStudents}</td>
                    <td className="px-3 py-3 text-center"><span className="font-mono text-xs text-teal">{c.avgAttendance}%</span></td>
                    <td className="px-3 py-3 text-center"><span className="font-mono text-xs text-brass">{c.avgMarks}%</span></td>
                    <td className="px-3 py-3 text-center"><span className={`font-mono text-sm font-bold ${scoreColor(c.compositeScore)}`}>{c.compositeScore}</span></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {/* Professor Rankings */}
      {tab === 'professors' && (
        <div className="space-y-4">
          {/* Top 3 podium */}
          {professors.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 0, 2].map(i => {
                const p = professors[i];
                if (!p) return <div key={i} />;
                return (
                  <Link key={p.id} to={`/profile/professor/${p.id}`}
                    className={`bg-surface border border-line rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all text-center group ${i === 0 ? 'md:order-2' : i === 1 ? 'md:order-1' : 'md:order-3'}`}>
                    <div className="text-3xl mb-2">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                    <div className="w-12 h-12 rounded-xl bg-teal-bg flex items-center justify-center text-sm font-bold text-teal mx-auto mb-2">{p.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                    <h3 className="font-serif font-semibold text-sm text-ink mb-1 group-hover:text-teal transition-colors">{p.name}</h3>
                    <div className="text-[10px] text-ink-muted mb-2">{p.collegeName}</div>
                    <div className="font-mono text-2xl font-bold text-teal mb-1">{p.compositeScore}</div>
                    <div className="text-[10px] text-ink-muted font-mono">SCORE</div>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim/50">
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5 w-12">Rank</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Professor</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">College</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Classes</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Attendance</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Similarity</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfs.map(p => (
                  <tr key={p.id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30 transition-colors">
                    <td className="px-3 py-3 text-center">{medalFor(p.rank)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/profile/professor/${p.id}`} className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-teal-bg flex items-center justify-center text-[10px] font-bold text-teal">{p.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                        <div>
                          <span className="font-medium text-ink group-hover:text-teal transition-colors">{p.name}</span>
                          <div className="text-[10px] text-ink-muted font-mono">{p.department}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-soft">{p.collegeName}</td>
                    <td className="px-3 py-3 text-center font-mono text-xs">{p.classesTaken}</td>
                    <td className="px-3 py-3 text-center"><span className="font-mono text-xs text-teal">{p.avgAttendance}%</span></td>
                    <td className="px-3 py-3 text-center"><span className="font-mono text-xs text-brass">{p.avgSimilarity}%</span></td>
                    <td className="px-3 py-3 text-center"><span className={`font-mono text-sm font-bold ${scoreColor(p.compositeScore)}`}>{p.compositeScore}</span></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {/* Student Rankings */}
      {tab === 'students' && (
        <div className="space-y-4">
          {filteredStudents.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 0, 2].map(i => {
                const s = filteredStudents[i];
                if (!s) return <div key={i} />;
                return (
                  <Link key={s.id} to={`/profile/student/${s.id}`}
                    className={`bg-surface border border-line rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all text-center group ${i === 0 ? 'md:order-2' : i === 1 ? 'md:order-1' : 'md:order-3'}`}>
                    <div className="text-3xl mb-2">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                    <div className="w-12 h-12 rounded-xl bg-plum-bg flex items-center justify-center text-sm font-bold text-plum mx-auto mb-2">{s.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                    <h3 className="font-serif font-semibold text-sm text-ink mb-1 group-hover:text-plum transition-colors">{s.name}</h3>
                    <div className="text-[10px] text-ink-muted font-mono mb-2">{s.rollNumber} · {s.stream} Yr{s.year}</div>
                    <div className="font-mono text-2xl font-bold text-plum mb-1">{s.compositeScore}</div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-[10px] text-ink-muted font-mono">SCORE</div>
                      {standingBadge(s.standing)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim/50">
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5 w-12">Rank</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Student</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Year/Sem</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Section</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Stream</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Attendance</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Marks</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-3 py-2.5">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30 transition-colors">
                    <td className="px-3 py-3 text-center">{medalFor(s.rank)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/profile/student/${s.id}`} className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-plum-bg flex items-center justify-center text-[10px] font-bold text-plum">{s.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                        <div>
                          <span className="font-medium text-ink group-hover:text-plum transition-colors">{s.name}</span>
                          <div className="text-[10px] text-ink-muted font-mono">{s.rollNumber}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center"><span className="font-mono text-xs">Yr {s.year} / Sem {s.semester || '?'}</span></td>
                    <td className="px-3 py-3 text-center"><span className="px-2 py-0.5 bg-plum-bg text-plum rounded-lg text-[10px] font-mono font-bold">{s.section || '—'}</span></td>
                    <td className="px-3 py-3 text-center"><span className="px-2 py-0.5 bg-teal-bg text-teal rounded-lg text-[10px] font-mono font-bold">{s.stream || '—'}</span></td>
                    <td className="px-3 py-3 text-center"><span className="font-mono text-xs text-teal">{s.attendanceRate}%</span></td>
                    <td className="px-3 py-3 text-center"><span className="font-mono text-xs text-brass">{s.marksRate}%</span></td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`font-mono text-sm font-bold ${scoreColor(s.compositeScore)}`}>{s.compositeScore}</span>
                        {standingBadge(s.standing)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {filteredStudents.length === 0 && (
              <div className="py-12 text-center text-ink-muted text-sm">No students match your search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
