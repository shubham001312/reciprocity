import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { downloadFile } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, GraduationCap, BookOpen, Plus, Trash2, FileSpreadsheet, Building2, CalendarDays, CheckCircle2, XCircle, Lock, School, Layers, Search, BarChart3, Settings, X, TrendingUp, Clock, AlertTriangle, Target, Award, Activity, ArrowUpRight, Zap, Eye, ChevronRight } from 'lucide-react';

const COLORS = ['#1F6E76', '#A8862F', '#7C2D5F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [college, setCollege] = useState(null);
  const [stats, setStats] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ years: [], sections: [], streams: [] });
  const [classFilters, setClassFilters] = useState({ year: '', semester: '', section: '', stream: '' });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Modals
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', rollNumber: '', dob: '', role: 'student', department: '', year: '', section: '', stream: '', semester: '' });
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClass, setNewClass] = useState({ subjectId: '', professorId: '', date: '', topic: '', duration: 55, year: '', semester: '', section: 'A', stream: 'CSE' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const collegeId = user?.collegeId || 'col-001';
      const [collegeRes, profsRes, studsRes, subsRes, classesRes, attendRes, desigRes, filterRes] = await Promise.all([
        api.get(`/profile/college/${collegeId}`).catch(() => ({ data: null })),
        api.get('/users/professors'),
        api.get('/users/students'),
        api.get('/subjects'),
        api.get('/classes'),
        api.get('/attendance/history?limit=50').catch(() => ({ data: [] })),
        api.get('/designations').catch(() => ({ data: [] })),
        api.get('/users/filter-options').catch(() => ({ data: { years: [], sections: [], streams: [] } })),
      ]);
      setCollege(collegeRes.data);
      setProfessors(profsRes.data);
      setStudents(studsRes.data);
      setSubjects(subsRes.data);
      setClasses(classesRes.data);
      setAttendanceRecords(Array.isArray(attendRes.data) ? attendRes.data : []);
      setDesignations(desigRes.data);
      setFilterOptions(filterRes.data);
    } catch (err) { console.error(err); }
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', { ...newUser, year: newUser.year ? parseInt(newUser.year) : null, semester: newUser.semester ? parseInt(newUser.semester) : null });
      setShowAddUser(false);
      setNewUser({ name: '', rollNumber: '', dob: '', role: 'student', department: '', year: '', section: '', stream: '', semester: '' });
      loadData();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add user'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    loadData();
  };

  const addClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', { ...newClass, year: newClass.year ? parseInt(newClass.year) : null, semester: newClass.semester ? parseInt(newClass.semester) : null });
      setShowAddClass(false);
      setNewClass({ subjectId: '', professorId: '', date: '', topic: '', duration: 55, year: '', semester: '', section: 'A', stream: 'CSE' });
      loadData();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add class'); }
  };

  const deleteClass = async (id) => {
    if (!confirm('Delete this class?')) return;
    await api.delete(`/classes/${id}`);
    loadData();
  };

  // Filters
  const filteredClasses = classes.filter(c => {
    if (classFilters.year && c.year !== parseInt(classFilters.year)) return false;
    if (classFilters.semester && c.semester !== parseInt(classFilters.semester)) return false;
    if (classFilters.section && c.section !== classFilters.section) return false;
    if (classFilters.stream && c.stream !== classFilters.stream) return false;
    return true;
  });

  const filteredStudents = students.filter(s => {
    if (classFilters.year && s.year !== parseInt(classFilters.year)) return false;
    if (classFilters.section && s.section !== classFilters.section) return false;
    if (classFilters.stream && s.stream !== classFilters.stream) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.rollNumber?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getSubjectName = (id) => subjects.find(s => s._id === id)?.name || 'Unknown';
  const getProfName = (id) => professors.find(p => p.id === id)?.name || 'Unknown';

  if (!college) return <div className="max-w-6xl mx-auto px-5 py-10 text-center text-ink-soft animate-pulse">Loading your dashboard...</div>;

  // Derived data
  const totalProfs = professors.length;
  const totalStudents = students.length;
  const totalClasses = classes.length;
  const totalSubjects = subjects.length;
  const pendingRequests = designations.filter(d => d.status === 'pending').length;

  // Attendance stats
  const recentAtt = attendanceRecords.slice(0, 20);
  const avgAttendance = recentAtt.length > 0
    ? Math.round(recentAtt.reduce((s, r) => s + (r.attendanceRate || 0), 0) / recentAtt.length)
    : 0;

  // Charts
  const profChartData = professors.slice(0, 6).map(p => ({
    name: p.name.split(' ').pop(),
    attendance: p.avgAttendance || 0,
    classes: p.classesTaken || 0,
  }));

  const yearDist = [1, 2, 3, 4].map(y => ({
    year: `Year ${y}`,
    count: students.filter(s => s.year === y).length,
  }));

  const streamMap = {};
  students.forEach(s => { const k = s.stream || 'Unknown'; streamMap[k] = (streamMap[k] || 0) + 1; });
  const streamDist = Object.entries(streamMap).map(([name, value]) => ({ name, value }));

  const gradeColors = { A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#EF4444' };

  // Recent classes for activity feed
  const recentClasses = classes.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">

      {/* ═══ PERSONALIZED HEADER ═══ */}
      <div className="bg-gradient-to-br from-ink to-ink/90 rounded-2xl p-6 md:p-8 mb-8 text-paper relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"><div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* College Logo */}
          <div className="w-16 h-16 rounded-2xl bg-brass/20 border border-brass/30 flex items-center justify-center shrink-0">
            <span className="font-serif text-2xl font-bold text-brass">{college.code?.substring(0, 3) || 'C'}</span>
          </div>
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-teal/20 text-teal text-[10px] font-mono rounded-full uppercase">Admin Dashboard</span>
              {college.accreditation && <span className="px-2 py-0.5 bg-brass/20 text-brass text-[10px] font-mono rounded-full">{college.accreditation}</span>}
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold">{college.name}</h1>
            <p className="text-paper/50 text-sm mt-1">{college.code} · {college.affiliation || 'Institution'} · {college.departments?.length || 0} Departments · Est. {college.established || 'N/A'}</p>
          </div>
          {/* Quick Stats */}
          <div className="flex gap-4 md:gap-6">
            <div className="text-center">
              <div className="font-mono text-2xl font-bold text-brass">{totalProfs}</div>
              <div className="text-[10px] text-paper/40 uppercase">Faculty</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl font-bold text-teal">{totalStudents}</div>
              <div className="text-[10px] text-paper/40 uppercase">Students</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl font-bold text-plum">{totalClasses}</div>
              <div className="text-[10px] text-paper/40 uppercase">Classes</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-absent-bg border border-absent/20 rounded-xl flex items-center justify-between">
          <span className="text-sm text-absent font-medium">{error}</span>
          <button onClick={() => setError('')} className="text-absent/60 hover:text-absent cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* ═══ QUICK STATS ROW ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { value: totalStudents, label: 'Total Students', icon: GraduationCap, color: 'text-plum', bg: 'bg-plum-bg' },
          { value: totalProfs, label: 'Faculty Members', icon: Users, color: 'text-teal', bg: 'bg-teal-bg' },
          { value: `${avgAttendance}%`, label: 'Avg Attendance', icon: Target, color: 'text-present', bg: 'bg-present-bg' },
          { value: pendingRequests, label: 'Pending Requests', icon: Clock, color: 'text-brass', bg: 'bg-brass-bg' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-line rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <div className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-ink-muted uppercase font-mono">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setShowAddClass(true)} className="flex items-center gap-1.5 px-4 py-2 bg-teal text-paper text-xs font-medium rounded-xl hover:bg-teal/90 shadow-card transition-all cursor-pointer">
          <Plus size={14} /> New Class
        </button>
        <button onClick={() => setShowAddUser(true)} className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-medium rounded-xl hover:bg-ink/90 shadow-card transition-all cursor-pointer">
          <Plus size={14} /> Add Student
        </button>
        <button onClick={() => downloadFile('/api/attendance-export/excel-all', 'attendance-all-students.xlsx').catch(e => alert('Download failed: ' + e.message))} className="flex items-center gap-1.5 px-4 py-2 border border-line bg-surface text-ink-soft text-xs font-medium rounded-xl hover:bg-paper-dim transition-all cursor-pointer">
          <FileSpreadsheet size={14} /> Export Excel
        </button>
        <button onClick={() => setTab('designations')} className="flex items-center gap-1.5 px-4 py-2 border border-line bg-surface text-ink-soft text-xs font-medium rounded-xl hover:bg-paper-dim transition-all cursor-pointer">
          <Eye size={14} /> {pendingRequests} Pending Request{pendingRequests !== 1 ? 's' : ''}
        </button>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex gap-0 border-b border-line mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'classes', label: 'Classes', icon: CalendarDays },
          { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
          { id: 'faculty', label: 'Faculty', icon: Users },
          { id: 'students', label: 'Students', icon: GraduationCap },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'designations', label: 'Requests', icon: Layers },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              tab === t.id ? 'border-ink text-ink font-semibold bg-paper' : 'border-transparent text-ink-soft hover:text-ink'
            }`}>
            <t.icon size={13} />
            {t.label}
            {t.id === 'designations' && pendingRequests > 0 && (
              <span className="w-5 h-5 rounded-full bg-absent text-paper text-[10px] font-bold flex items-center justify-center">{pendingRequests}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                <Users size={16} className="text-teal" /> Faculty Performance
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={profChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#1F6E76" name="Attendance %" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="classes" fill="#A8862F" name="Classes" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                <GraduationCap size={16} className="text-plum" /> Student Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={yearDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                    {yearDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stream Distribution + Department Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {streamDist.length > 0 && (
              <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
                <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                  <Layers size={16} className="text-brass" /> Stream Distribution
                </h3>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={streamDist} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                        {streamDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {streamDist.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium">{s.name}</span>
                        <span className="font-mono text-ink-muted text-xs ml-auto">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Department Overview */}
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-teal" /> Departments
              </h3>
              <div className="space-y-3">
                {(college.departments || []).slice(0, 6).map(d => (
                  <div key={d.name} className="flex items-center justify-between p-2 bg-paper-dim rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal"></div>
                      <span className="text-sm font-medium">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-ink-muted">
                      <span>{d.professors || 0} profs</span>
                      <span>{d.students || 0} studs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
            <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
              <Activity size={16} className="text-present" /> Recent Classes
            </h3>
            <div className="space-y-2">
              {recentClasses.slice(0, 6).map(c => (
                <div key={c._id} className="flex items-center gap-3 p-3 bg-paper-dim rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-teal-bg flex items-center justify-center shrink-0">
                    <CalendarDays size={16} className="text-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{getSubjectName(c.subjectId)}</div>
                    <div className="text-[10px] text-ink-muted font-mono">{c.date} · {c.topic || 'No topic'} · {getProfName(c.professorId)}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-bg text-teal text-[10px] font-mono rounded-full shrink-0">Yr{c.year} Sem{c.semester}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CLASSES TAB ═══ */}
      {tab === 'classes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowAddClass(true)} className="flex items-center gap-1.5 px-4 py-2 bg-teal text-paper text-xs font-medium rounded-xl hover:bg-teal/90 shadow-card transition-all cursor-pointer">
              <Plus size={14} /> Create Class
            </button>
            {['year', 'semester', 'section', 'stream'].map(f => (
              <select key={f} value={classFilters[f]} onChange={e => setClassFilters({ ...classFilters, [f]: e.target.value })}
                className="border border-line rounded-lg px-3 py-2 text-xs bg-surface focus:outline-none focus:border-teal cursor-pointer capitalize">
                <option value="">{f}</option>
                {f === 'year' && [1, 2, 3, 4].map(v => <option key={v} value={v}>Year {v}</option>)}
                {f === 'semester' && [1, 2, 3, 4, 5, 6, 7, 8].map(v => <option key={v} value={v}>Sem {v}</option>)}
                {f === 'section' && ['A', 'B', 'C'].map(v => <option key={v} value={v}>Section {v}</option>)}
                {f === 'stream' && ['CSE', 'ECE', 'IT', 'EE', 'ME', 'CE'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ))}
          </div>
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim/50">
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Subject</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Professor</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Date</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Year/Sem</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Section</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(c => (
                  <tr key={c._id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                    <td className="px-4 py-3 font-medium">{getSubjectName(c.subjectId)}</td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{getProfName(c.professorId)}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs">{c.date}</td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-teal-bg text-teal rounded-lg text-[10px] font-mono">Yr{c.year}/Sem{c.semester}</span></td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-plum-bg text-plum rounded-lg text-[10px] font-mono">{c.section}</span></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => deleteClass(c._id)} className="text-ink-soft hover:text-absent cursor-pointer"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {filteredClasses.length === 0 && <div className="py-12 text-center text-ink-muted text-sm">No classes match filters.</div>}
          </div>
        </div>
      )}

      {/* ═══ ATTENDANCE TAB ═══ */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-surface border border-line rounded-xl p-4 text-center">
              <div className="font-mono text-2xl font-bold text-teal">{attendanceRecords.length}</div>
              <div className="text-[10px] text-ink-muted uppercase">Total Records</div>
            </div>
            <div className="bg-surface border border-line rounded-xl p-4 text-center">
              <div className="font-mono text-2xl font-bold text-present">{avgAttendance}%</div>
              <div className="text-[10px] text-ink-muted uppercase">Avg Attendance</div>
            </div>
            <div className="bg-surface border border-line rounded-xl p-4 text-center">
              <div className="font-mono text-2xl font-bold text-brass">{attendanceRecords.filter(r => r.status === 'locked').length}</div>
              <div className="text-[10px] text-ink-muted uppercase">Locked</div>
            </div>
            <div className="bg-surface border border-line rounded-xl p-4 text-center">
              <div className="font-mono text-2xl font-bold text-plum">{attendanceRecords.filter(r => r.status === 'teacher_confirmed').length}</div>
              <div className="text-[10px] text-ink-muted uppercase">Teacher Confirmed</div>
            </div>
          </div>
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim/50">
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Student</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Status</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Teacher</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Student Confirmed</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Locked</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.slice(0, 50).map(r => (
                  <tr key={r._id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                    <td className="px-4 py-3 font-medium">{students.find(s => s.id === r.studentId)?.name || r.studentId}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${r.present ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'}`}>
                        {r.present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{r.teacherConfirmed ? <CheckCircle2 size={14} className="text-present inline" /> : <XCircle size={14} className="text-absent inline" />}</td>
                    <td className="px-4 py-3 text-center">{r.studentConfirmed ? <CheckCircle2 size={14} className="text-present inline" /> : <XCircle size={14} className="text-ink-muted inline" />}</td>
                    <td className="px-4 py-3 text-center">{r.status === 'locked' ? <Lock size={14} className="text-brass inline" /> : <span className="text-ink-muted text-[10px]">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {attendanceRecords.length === 0 && <div className="py-12 text-center text-ink-muted text-sm">No attendance records yet.</div>}
          </div>
        </div>
      )}

      {/* ═══ FACULTY TAB ═══ */}
      {tab === 'faculty' && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[450px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim/50">
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Name</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Email</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Department</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Stream</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {professors.map(p => (
                  <tr key={p.id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-bg flex items-center justify-center text-[10px] font-bold text-teal">{p.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p.email}</td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{p.department}</td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-teal-bg text-teal rounded-lg text-[10px] font-mono font-bold">{p.stream}</span></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => deleteUser(p.id)} className="text-ink-soft hover:text-absent cursor-pointer"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
          <button onClick={() => { setShowAddUser(true); setNewUser({ ...newUser, role: 'professor' }); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal text-paper font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-teal/90 shadow-card transition-all cursor-pointer">
            <Plus size={14} /> Add Professor
          </button>
        </div>
      )}

      {/* ═══ STUDENTS TAB ═══ */}
      {tab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or roll number..."
                className="w-full pl-9 pr-3 py-2 border border-line rounded-lg text-xs bg-surface focus:outline-none focus:border-teal" />
            </div>
            {['year', 'section', 'stream'].map(f => (
              <select key={f} value={classFilters[f]} onChange={e => setClassFilters({ ...classFilters, [f]: e.target.value })}
                className="border border-line rounded-lg px-3 py-2 text-xs bg-surface focus:outline-none focus:border-teal cursor-pointer capitalize">
                <option value="">{f}</option>
                {f === 'year' && [1, 2, 3, 4].map(v => <option key={v} value={v}>Year {v}</option>)}
                {f === 'section' && ['A', 'B', 'C'].map(v => <option key={v} value={v}>Section {v}</option>)}
                {f === 'stream' && ['CSE', 'ECE', 'IT'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ))}
            <span className="text-[10px] text-ink-soft font-mono">{filteredStudents.length} students</span>
          </div>
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim/50">
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Name</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Roll No.</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Department</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Year</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Sem</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Section</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Stream</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-plum-bg flex items-center justify-center text-[10px] font-bold text-plum">{s.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{s.rollNumber}</td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{s.department}</td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-teal-bg text-teal rounded-lg text-[10px] font-mono font-bold">{s.year || '—'}</span></td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-brass-bg text-brass rounded-lg text-[10px] font-mono font-bold">{s.semester || '—'}</span></td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-plum-bg text-plum rounded-lg text-[10px] font-mono font-bold">{s.section || '—'}</span></td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-ink/5 text-ink rounded-lg text-[10px] font-mono font-bold">{s.stream || '—'}</span></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => deleteUser(s.id)} className="text-ink-soft hover:text-absent cursor-pointer"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
          <button onClick={() => { setShowAddUser(true); setNewUser({ ...newUser, role: 'student' }); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal text-paper font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-teal/90 shadow-card transition-all cursor-pointer">
            <Plus size={14} /> Add Student
          </button>
        </div>
      )}

      {/* ═══ SUBJECTS TAB ═══ */}
      {tab === 'subjects' && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[550px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim/50">
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Subject</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Code</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Semester</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Year</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Department</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Credits</th>
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Professor</th>
                </tr>
              </thead>
              <tbody>
                {subjects.sort((a, b) => (a.semester || 0) - (b.semester || 0)).map(s => (
                  <tr key={s._id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.code}</td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-brass-bg text-brass rounded-lg text-[10px] font-mono font-bold">Sem {s.semester}</span></td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-teal-bg text-teal rounded-lg text-[10px] font-mono font-bold">Yr {s.year || Math.ceil((s.semester || 1) / 2)}</span></td>
                    <td className="px-4 py-3 text-xs text-ink-soft">{s.department}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs">{s.credits}</td>
                    <td className="px-4 py-3 text-sm">{getProfName(s.professorId)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {/* ═══ DESIGNATIONS TAB ═══ */}
      {tab === 'designations' && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim/50">
                  <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">User</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Role</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Status</th>
                  <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {designations.map(d => (
                  <tr key={d._id} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.userName}</div>
                      <div className="text-[10px] text-ink-muted font-mono">{d.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-teal-bg text-teal rounded-lg text-[10px] font-mono">{d.designation || d.userRole}</span></td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                        d.status === 'approved' ? 'bg-present-bg text-present' :
                        d.status === 'rejected' ? 'bg-absent-bg text-absent' :
                        'bg-brass-bg text-brass'
                      }`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.status === 'pending' && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={async () => { await api.put(`/designations/${d._id}/approve`); loadData(); }}
                            className="px-2 py-1 bg-present text-paper text-[10px] rounded-lg font-medium cursor-pointer">Approve</button>
                          <button onClick={async () => { await api.put(`/designations/${d._id}/reject`); loadData(); }}
                            className="px-2 py-1 bg-absent text-paper text-[10px] rounded-lg font-medium cursor-pointer">Reject</button>
                        </div>
                      )}
                      {d.status !== 'pending' && <span className="text-ink-muted text-[10px]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {designations.length === 0 && <div className="py-12 text-center text-ink-muted text-sm">No designation requests yet.</div>}
          </div>
        </div>
      )}

      {/* ═══ ADD USER MODAL ═══ */}
      {showAddUser && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-elevated w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif font-semibold text-lg">Add {newUser.role === 'professor' ? 'Professor' : 'Student'}</h3>
              <button onClick={() => setShowAddUser(false)} className="text-ink-soft hover:text-ink cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={addUser} className="space-y-3">
              <input type="text" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal cursor-pointer">
                <option value="student">Student</option>
                <option value="professor">Professor</option>
              </select>
              <input type="text" placeholder="Department" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
              {newUser.role === 'student' && (
                <>
                  <input type="text" placeholder="Roll Number (e.g. 2024CSE0142)" value={newUser.rollNumber} onChange={e => setNewUser({...newUser, rollNumber: e.target.value})} required className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
                  <input type="date" placeholder="Date of Birth" value={newUser.dob} onChange={e => setNewUser({...newUser, dob: e.target.value})} required className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
                  <div className="bg-paper-dim rounded-xl px-3 py-2 text-xs text-ink-muted">
                    <span className="font-medium text-ink-soft">Login ID:</span> {newUser.rollNumber ? `${newUser.rollNumber}@${user?.collegeCode?.toLowerCase() || 'makaut'}.ac.in` : '—'}
                    <br/>
                    <span className="font-medium text-ink-soft">Password:</span> DOB as DDMMYYYY (auto-set from date of birth)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" placeholder="Year" value={newUser.year} onChange={e => setNewUser({...newUser, year: e.target.value})} className="border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
                    <input type="number" placeholder="Sem" value={newUser.semester} onChange={e => setNewUser({...newUser, semester: e.target.value})} className="border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
                    <input type="text" placeholder="Section" value={newUser.section} onChange={e => setNewUser({...newUser, section: e.target.value})} className="border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
                  </div>
                </>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 px-4 py-2 border border-line text-ink-soft text-sm rounded-xl hover:bg-paper-dim cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-teal text-paper text-sm font-medium rounded-xl hover:bg-teal/90 cursor-pointer">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ ADD CLASS MODAL ═══ */}
      {showAddClass && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-elevated w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif font-semibold text-lg">Create Class</h3>
              <button onClick={() => setShowAddClass(false)} className="text-ink-soft hover:text-ink cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={addClass} className="space-y-3">
              <select value={newClass.subjectId} onChange={e => setNewClass({...newClass, subjectId: e.target.value})} required className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal cursor-pointer">
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </select>
              <select value={newClass.professorId} onChange={e => setNewClass({...newClass, professorId: e.target.value})} required className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal cursor-pointer">
                <option value="">Select Professor</option>
                {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="date" value={newClass.date} onChange={e => setNewClass({...newClass, date: e.target.value})} required className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
              <input type="text" placeholder="Topic" value={newClass.topic} onChange={e => setNewClass({...newClass, topic: e.target.value})} className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
              <div className="grid grid-cols-4 gap-2">
                <input type="number" placeholder="Year" value={newClass.year} onChange={e => setNewClass({...newClass, year: e.target.value})} className="border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
                <input type="number" placeholder="Sem" value={newClass.semester} onChange={e => setNewClass({...newClass, semester: e.target.value})} className="border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" />
                <select value={newClass.section} onChange={e => setNewClass({...newClass, section: e.target.value})} className="border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal cursor-pointer">
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                </select>
                <select value={newClass.stream} onChange={e => setNewClass({...newClass, stream: e.target.value})} className="border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal cursor-pointer">
                  <option value="CSE">CSE</option><option value="ECE">ECE</option><option value="IT">IT</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddClass(false)} className="flex-1 px-4 py-2 border border-line text-ink-soft text-sm rounded-xl hover:bg-paper-dim cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-teal text-paper text-sm font-medium rounded-xl hover:bg-teal/90 cursor-pointer">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
