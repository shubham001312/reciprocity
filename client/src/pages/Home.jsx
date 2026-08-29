import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Shield, BookOpen, BarChart3, Users, ClipboardList, FileText, ArrowRight, Trophy, Medal, TrendingUp, TrendingDown, Minus, GraduationCap, Star, Zap, Target, Award, Building2, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#1F6E76', '#A8862F', '#7C2D5F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const features = [
  { icon: Shield, title: 'Role-Based Access', desc: 'Admin, Professor, and Student roles with secure JWT authentication', color: 'teal' },
  { icon: ClipboardList, title: 'Dual Confirmation', desc: 'Teacher marks attendance, student confirms — locked once both agree', color: 'brass' },
  { icon: Users, title: 'Attendance Tracking', desc: 'Mark present/absent per student with real-time lock visualization', color: 'present' },
  { icon: BookOpen, title: 'Notes Repository', desc: 'Upload and tag topics covered, track syllabus coverage', color: 'plum' },
  { icon: FileText, title: 'Question Papers', desc: 'Upload papers and run NLP similarity analysis against taught content', color: 'teal' },
  { icon: BarChart3, title: 'Analytics Engine', desc: 'Attendance-vs-performance comparison, similarity scoring, department insights', color: 'brass' },
  { icon: Building2, title: 'College Network', desc: 'Browse institutions, view faculty rankings, and request to join colleges', color: 'teal' },
  { icon: Trophy, title: 'Live Rankings', desc: 'Real-time college, professor, and student rankings based on composite scores', color: 'brass' },
  { icon: Award, title: 'PDF Reports', desc: 'Generate semester-end student reports with charts and grade breakdowns', color: 'plum' },
];

const colorMap = {
  teal: { bg: 'bg-teal-bg', text: 'text-teal', border: 'border-teal-border' },
  brass: { bg: 'bg-brass-bg', text: 'text-brass', border: 'border-brass/20' },
  present: { bg: 'bg-present-bg', text: 'text-present', border: 'border-present-border' },
  plum: { bg: 'bg-plum-bg', text: 'text-plum', border: 'border-plum-border' },
};

export default function Home() {
  const [stats, setStats] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, profsRes, studsRes, colsRes] = await Promise.all([
        api.get('/rankings/stats'),
        api.get('/rankings/professors'),
        api.get('/rankings/students'),
        api.get('/rankings/colleges'),
      ]);
      setStats(statsRes.data);
      setProfessors(profsRes.data);
      setStudents(studsRes.data);
      setColleges(colsRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const medalFor = (rank) => {
    if (rank === 1) return <span className="text-sm">🥇</span>;
    if (rank === 2) return <span className="text-sm">🥈</span>;
    if (rank === 3) return <span className="text-sm">🥉</span>;
    return <span className="font-mono text-xs text-ink-muted w-6 text-center">{rank}</span>;
  };

  const scoreColor = (s) => s >= 70 ? 'text-teal' : s >= 50 ? 'text-brass' : 'text-absent';
  const attColor = (a) => a >= 80 ? 'bg-present-bg text-present' : a >= 60 ? 'bg-brass-bg text-brass' : 'bg-absent-bg text-absent';
  const standingBadge = (s) => {
    const c = { A: 'bg-teal text-paper', B: 'bg-blue-500 text-white', C: 'bg-brass text-paper', D: 'bg-ink-soft text-paper' };
    return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono text-xs font-bold ${c[s] || c.D}`}>{s}</span>;
  };

  const profChartData = professors.slice(0, 6).map(p => ({ name: p.name.split(' ').pop(), attendance: p.avgAttendance, similarity: p.avgSimilarity }));
  const studChartData = students.slice(0, 8).map(s => ({ name: s.name.split(' ')[0], attendance: s.attendanceRate, marks: s.marksRate }));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="gradient-hero min-h-[400px] md:min-h-[520px] flex items-center">
          <div className="absolute inset-0 texture-paper opacity-[0.03]"></div>
          <div className="relative z-10 max-w-6xl mx-auto px-5 py-12 md:py-20 w-full">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper/10 border border-paper/10 mb-6">
                <Zap size={12} className="text-brass-bright" />
                <span className="font-mono text-[10px] text-paper/60 uppercase tracking-wider">Academic Accountability Platform</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-paper mb-6 leading-[1.1]">
                Every Class.<br />
                Every Student.<br />
                Every Outcome <span className="text-brass-bright">Matters.</span>
              </h1>
              <p className="text-paper/50 text-lg max-w-lg mb-8 leading-relaxed">
                Track classes, attendance, taught topics, question papers, and marks — then generate analytics to reveal the connection between attendance, teaching quality, and student performance.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/rankings" className="inline-flex items-center gap-2 px-6 py-3 bg-paper text-ink font-medium rounded-xl hover:bg-paper/90 shadow-elevated transition-all no-underline">
                  View Rankings <Trophy size={16} />
                </Link>
                <Link to="/colleges" className="inline-flex items-center gap-2 px-6 py-3 border border-paper/20 text-paper/70 font-medium rounded-xl hover:bg-paper/10 hover:text-paper transition-all no-underline">
                  Browse Colleges <Building2 size={16} />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 border border-paper/20 text-paper/70 font-medium rounded-xl hover:bg-paper/10 hover:text-paper transition-all no-underline">
                  Login <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      {stats && (
        <section className="bg-surface border-b border-line">
          <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { value: stats.colleges, label: 'Colleges', icon: Building2, color: 'text-brass' },
              { value: stats.professors, label: 'Professors', icon: GraduationCap, color: 'text-teal' },
              { value: stats.students, label: 'Students', icon: Users, color: 'text-plum' },
              { value: `${stats.avgAttendance}%`, label: 'Avg. Attendance', icon: Target, color: 'text-present' },
              { value: `${stats.avgMarks}%`, label: 'Avg. Marks', icon: Award, color: 'text-brass' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-paper-dim flex items-center justify-center">
                  <s.icon size={20} className={s.color} />
                </div>
                <div>
                  <div className={`font-mono text-2xl font-bold ${s.color} leading-none`}>{s.value}</div>
                  <div className="font-mono text-[9px] text-ink-muted uppercase tracking-[0.1em] mt-1">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && (
        <>
          {/* College Rankings Preview */}
          {colleges.length > 0 && (
            <section className="max-w-6xl mx-auto px-5 py-16">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brass-bg flex items-center justify-center">
                    <Building2 size={20} className="text-brass" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-ink">Top Colleges</h2>
                    <p className="text-xs text-ink-muted">Real-time institutional rankings</p>
                  </div>
                </div>
                <Link to="/rankings" className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 font-medium transition-colors">
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {colleges.slice(0, 3).map((c, i) => (
                  <Link key={c.id} to={`/colleges/${c.id}`}
                    className="bg-surface border border-line rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-semibold text-ink group-hover:text-teal transition-colors truncate">{c.name}</h3>
                        <span className="text-[10px] text-ink-muted font-mono">{c.code}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-paper-dim rounded-lg">
                        <div className="font-mono text-sm font-bold text-teal">{c.totalProfessors}</div>
                        <div className="text-[10px] text-ink-muted">Faculty</div>
                      </div>
                      <div className="text-center p-2 bg-paper-dim rounded-lg">
                        <div className="font-mono text-sm font-bold text-plum">{c.totalStudents}</div>
                        <div className="text-[10px] text-ink-muted">Students</div>
                      </div>
                      <div className="text-center p-2 bg-paper-dim rounded-lg">
                        <div className="font-mono text-sm font-bold text-brass">{c.compositeScore}</div>
                        <div className="text-[10px] text-ink-muted">Score</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Faculty Performance Ranking */}
          <section className="bg-paper-dim/40 py-16">
            <div className="max-w-6xl mx-auto px-5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-bg flex items-center justify-center">
                    <GraduationCap size={20} className="text-teal" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-ink">Faculty Performance Ranking</h2>
                    <p className="text-xs text-ink-muted">Based on attendance, similarity, and notes recorded</p>
                  </div>
                </div>
                <Link to="/rankings" className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 font-medium transition-colors">
                  View Full Rankings <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
                  <div className="overflow-x-auto"><table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-line bg-paper-dim/50">
                        <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3 w-14">Rank</th>
                        <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3">Professor</th>
                        <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3">College</th>
                        <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3">Att.</th>
                        <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professors.slice(0, 6).map(p => (
                        <tr key={p.id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30 transition-colors">
                          <td className="px-4 py-3.5">{medalFor(p.rank)}</td>
                          <td className="px-4 py-3.5">
                            <Link to={`/profile/professor/${p.id}`} className="flex items-center gap-2 group">
                              <div className="w-8 h-8 rounded-lg bg-teal-bg flex items-center justify-center text-[10px] font-bold text-teal">{p.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                              <span className="font-medium text-ink group-hover:text-teal transition-colors">{p.name}</span>
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-ink-soft">{p.collegeName}</td>
                          <td className="px-4 py-3.5 text-center"><span className={`inline-flex px-2 py-0.5 rounded-lg font-mono text-xs font-medium ${attColor(p.avgAttendance)}`}>{p.avgAttendance}%</span></td>
                          <td className="px-4 py-3.5 text-center"><span className={`font-mono text-sm font-bold ${scoreColor(p.compositeScore)}`}>{p.compositeScore}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                </div>
                <div className="lg:col-span-2 bg-surface border border-line rounded-2xl shadow-card p-5">
                  <h4 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-4">Performance Comparison</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={profChartData} layout="vertical" barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} width={65} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                      <Bar dataKey="attendance" fill="#1F6E76" name="Attendance %" radius={[0, 6, 6, 0]} barSize={10} />
                      <Bar dataKey="similarity" fill="#A8862F" name="Similarity %" radius={[0, 6, 6, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* Student Performance Ranking */}
          <section className="max-w-6xl mx-auto px-5 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-plum-bg flex items-center justify-center">
                  <Star size={20} className="text-plum" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-ink">Student Performance Ranking</h2>
                  <p className="text-xs text-ink-muted">Based on attendance and academic marks</p>
                </div>
              </div>
              <Link to="/rankings" className="flex items-center gap-1 text-xs text-plum hover:text-plum/80 font-medium transition-colors">
                View All <ChevronRight size={14} />
              </Link>
            </div>              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full text-sm min-w-[550px]">
                  <thead>
                    <tr className="border-b border-line bg-paper-dim/50">
                      <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3 w-14">Rank</th>
                      <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3">Student</th>
                      <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3">Year/Sem</th>
                      <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3">Att.</th>
                      <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3">Marks</th>
                      <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3">Grade</th>
                      <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-3">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 8).map(s => (
                      <tr key={s.id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30 transition-colors">
                        <td className="px-4 py-3.5">{medalFor(s.rank)}</td>
                        <td className="px-4 py-3.5">
                          <Link to={`/profile/student/${s.id}`} className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-plum-bg flex items-center justify-center text-[10px] font-bold text-plum">{s.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                            <div>
                              <span className="font-medium text-ink group-hover:text-plum transition-colors block leading-tight">{s.name}</span>
                              <span className="text-[10px] text-ink-muted font-mono">{s.rollNumber}</span>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-center"><span className="font-mono text-xs">Yr{s.year}/Sem{s.semester || '?'}</span></td>
                        <td className="px-4 py-3.5 text-center"><span className={`inline-flex px-2 py-0.5 rounded-lg font-mono text-xs font-medium ${attColor(s.attendanceRate)}`}>{s.attendanceRate}%</span></td>
                        <td className="px-4 py-3.5 text-center"><span className={`font-mono text-xs ${scoreColor(s.marksRate)}`}>{s.marksRate}%</span></td>
                        <td className="px-4 py-3.5 text-center">{standingBadge(s.standing)}</td>
                        <td className="px-4 py-3.5 text-center"><span className={`font-mono text-sm font-bold ${scoreColor(s.compositeScore)}`}>{s.compositeScore}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-surface border border-line rounded-2xl shadow-card p-5">
                  <h4 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">Attendance vs. Marks</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={studChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
                      <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                      <Bar dataKey="attendance" fill="#1F6E76" name="Attendance %" radius={[6, 6, 0, 0]} barSize={14} />
                      <Bar dataKey="marks" fill="#7C2D5F" name="Marks %" radius={[6, 6, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-surface border border-line rounded-2xl shadow-card p-5">
                  <h4 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">Stream Distribution</h4>
                  {(() => {
                    const streamMap = {};
                    students.forEach(s => { const k = s.stream || 'Unknown'; streamMap[k] = (streamMap[k] || 0) + 1; });
                    const dist = Object.entries(streamMap).map(([name, value]) => ({ name, value }));
                    return dist.length > 0 ? (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="45%" height={130}>
                          <PieChart>
                            <Pie data={dist} cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={4} dataKey="value">
                              {dist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2.5">
                          {dist.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-xs text-ink-soft">{d.name}</span>
                              <span className="text-xs font-mono font-bold ml-auto">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : <p className="text-xs text-ink-muted text-center py-4">No data</p>;
                  })()}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Features */}
      <section className="bg-paper-dim/40 py-16">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl font-bold text-ink mb-2">Core Modules</h2>
            <p className="text-ink-soft text-sm">Everything you need for academic accountability in one platform</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f) => {
              const c = colorMap[f.color];
              return (
                <div key={f.title} className="bg-surface border border-line rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:border-line-strong transition-all duration-300 group">
                  <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon size={22} className={c.text} />
                  </div>
                  <h3 className="font-serif font-semibold text-base text-ink mb-1.5">{f.title}</h3>
                  <p className="text-ink-soft text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="bg-gradient-to-br from-ink to-ink/90 rounded-2xl p-10 text-center text-paper relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"><div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} /></div>
          <div className="relative z-10">
            <h2 className="font-serif text-2xl font-bold mb-3">Ready to Get Started?</h2>
            <p className="text-paper/60 text-sm mb-6 max-w-md mx-auto">Join RECIPROCITY and start tracking attendance, uploading notes, and analyzing academic performance today.</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-paper text-ink font-medium rounded-xl hover:bg-paper/90 transition-all">
                Create Account <ArrowRight size={16} />
              </Link>
              <Link to="/rankings" className="inline-flex items-center gap-2 px-6 py-3 border border-paper/20 text-paper/70 rounded-xl hover:bg-paper/10 hover:text-paper transition-all">
                Explore Rankings <Trophy size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
