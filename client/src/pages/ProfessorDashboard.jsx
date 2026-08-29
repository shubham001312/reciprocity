import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api';
import StatCard from '../components/StatCard';
import { sanitize } from '../sanitize';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, BookOpen, FileText, Upload, BarChart3, ClipboardList, CheckCircle2, XCircle, UserCheck, Save, Search, Zap, Calendar } from 'lucide-react';
import AttendanceEngine from '../components/AttendanceEngine';
import AttendanceCalendar from '../components/AttendanceCalendar';

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newClass, setNewClass] = useState({ subjectId: '', date: '', topic: '', duration: 55, studentsPresent: 40, totalStudents: 46 });
  const [newNote, setNewNote] = useState({ subjectId: '', title: '', topicsCovered: '' });
  const [newQuestion, setNewQuestion] = useState({ subjectId: '', semester: 3, title: '', topics: '' });
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, classesRes, subjectsRes, notesRes, questionsRes, analyticsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/notes'),
        api.get('/questions'),
        api.get('/analytics/attendance-vs-marks'),
      ]);
      setStats(statsRes.data);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
      setNotes(notesRes.data);
      setQuestions(questionsRes.data);
      setAnalyticsData(analyticsRes.data);
      const studsRes = await api.get('/users/students');
      setStudents(studsRes.data);
      const attRes = await api.get('/attendance/history');
      setAttendanceHistory(attRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const addClass = async (e) => {
    e.preventDefault();
    await api.post('/classes', newClass);
    setShowAddClass(false);
    setNewClass({ subjectId: '', date: '', topic: '', duration: 55, studentsPresent: 40, totalStudents: 46 });
    loadData();
  };

  const addNote = async (e) => {
    e.preventDefault();
    await api.post('/notes', { ...newNote, topicsCovered: newNote.topicsCovered.split(',').map(t => t.trim()) });
    setShowAddNote(false);
    setNewNote({ subjectId: '', title: '', topicsCovered: '' });
    loadData();
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    await api.post('/questions', { ...newQuestion, topics: newQuestion.topics.split(',').map(t => t.trim()) });
    setShowAddQuestion(false);
    setNewQuestion({ subjectId: '', semester: 3, title: '', topics: '' });
    loadData();
  };

  const loadClassAttendance = async (classId) => {
    setSelectedClassId(classId);
    setAttendanceSaved(false);
    if (!classId) { setAttendanceRecords({}); return; }
    try {
      const res = await api.get('/attendance', { params: { classId } });
      const existing = {};
      res.data.forEach(a => { existing[a.studentId] = a.status; });
      setAttendanceRecords(existing);
    } catch (err) { console.error(err); }
  };

  const toggleAttendance = (studentId) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAllPresent = () => {
    const all = {};
    students.forEach(s => { all[s.id] = 'present'; });
    setAttendanceRecords(all);
  };

  const markAllAbsent = () => {
    const all = {};
    students.forEach(s => { all[s.id] = 'absent'; });
    setAttendanceRecords(all);
  };

  const saveAttendance = async () => {
    if (!selectedClassId) return;
    const records = students.map(s => ({ studentId: s.id, status: attendanceRecords[s.id] || 'absent' }));
    try {
      await api.post('/attendance', { classId: selectedClassId, records });
      // Update class present count
      const presentCount = records.filter(r => r.status === 'present').length;
      const cls = classes.find(c => (c.id || c._id) === selectedClassId);
      if (cls) {
        await api.put(`/classes/${selectedClassId}`, { studentsPresent: presentCount });
      }
      setAttendanceSaved(true);
      loadData();
      setTimeout(() => setAttendanceSaved(false), 3000);
    } catch (err) { console.error(err); }
  };

  const getSubjectName = (id) => subjects.find(s => (s.id || s._id) === id)?.name || 'Unknown';
  const getSubjectCode = (id) => subjects.find(s => (s.id || s._id) === id)?.code || '';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'classes', label: 'Classes', icon: ClipboardList },
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'questions', label: 'Question Papers', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  if (!stats) return <div className="max-w-6xl mx-auto px-5 py-10 text-center text-ink-soft">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Professor Register</h1>
          <p className="text-ink-soft text-sm mt-1">{user.name} — Semester III · {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard value={stats.classesTaken} label="Classes taken" />
        <StatCard value={`${stats.avgAttendance}%`} label="Avg. attendance" color="teal" />
        <StatCard value={stats.studentsPresent} label="Students present" color="present" />
        <StatCard value={stats.notesRecorded} label="Notes recorded" color="plum" />
        <StatCard value={`${stats.similarityScore}%`} label="Similarity score" color="brass" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-0 border-b border-line mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              tab === t.id ? 'border-ink text-ink font-semibold bg-paper' : 'border-transparent text-ink-soft hover:text-ink'
            }`}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Classes */}
          <div className="border border-line rounded">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-line bg-paper-dim">
              <h3 className="font-serif font-semibold">Recent Classes</h3>
              <div className="flex-1 h-px bg-line"></div>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[450px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Date</th>
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Subject</th>
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Topic</th>
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Duration</th>
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentClasses?.map(c => {
                  const pct = Math.round((c.studentsPresent / c.totalStudents) * 100);
                  return (
                    <tr key={c.id} className="border-b border-line last:border-0 hover:bg-brass/5">
                      <td className="px-5 py-3 font-mono text-xs">{new Date(c.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</td>
                      <td className="px-5 py-3">{getSubjectName(c.subjectId)}</td>
                      <td className="px-5 py-3">{c.topic}</td>
                      <td className="px-5 py-3 font-mono text-xs">{c.duration} min</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full ${
                          pct >= 80 ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {c.studentsPresent}/{c.totalStudents} ({pct}%)
                        </span>
                      </td>
                    </tr>
                  );                })}
              </tbody>
            </table></div>
          </div>




          {/* Quick Actions */}
          <div>
            <h3 className="font-serif font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => setTab('attendance')}
                className="flex items-center justify-between px-4 py-3 border border-line rounded-xl bg-surface shadow-card hover:shadow-card-hover text-sm font-medium hover:border-teal hover:text-teal transition-all cursor-pointer">
                <span className="flex items-center gap-2"><Zap size={16} /> Fast Attendance</span> <span className="text-ink-muted">→</span>
              </button>
              <button onClick={() => { setTab('classes'); setShowAddClass(true); }}
                className="flex items-center justify-between px-4 py-3 border border-ink rounded bg-paper text-sm font-medium hover:bg-ink hover:text-paper transition-colors cursor-pointer">
                Add class record <span className="text-ink-soft">→</span>
              </button>
              <button onClick={() => { setTab('notes'); setShowAddNote(true); }}
                className="flex items-center justify-between px-4 py-3 border border-ink rounded bg-paper text-sm font-medium hover:bg-ink hover:text-paper transition-colors cursor-pointer">
                Upload notes <span className="text-ink-soft">→</span>
              </button>
              <button onClick={() => { setTab('questions'); setShowAddQuestion(true); }}
                className="flex items-center justify-between px-4 py-3 border border-ink rounded bg-paper text-sm font-medium hover:bg-ink hover:text-paper transition-colors cursor-pointer">
                Upload question paper <span className="text-ink-soft">→</span>
              </button>
              <button onClick={() => setTab('analytics')}
                className="flex items-center justify-between px-4 py-3 border border-ink rounded bg-paper text-sm font-medium hover:bg-ink hover:text-paper transition-colors cursor-pointer">
                View analytics <span className="text-ink-soft">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <AttendanceEngine subjects={subjects} user={user} classes={classes} />
      )}

      {tab === 'calendar' && (
        <AttendanceCalendar records={attendanceHistory} role="professor" />
      )}

      {false && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-serif font-semibold text-lg">Record Attendance</h3>
          </div>

          {/* Class Selector */}
          <div className="border border-line rounded p-5 mb-6 bg-paper">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1 w-full">
                <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1.5">Select Class</label>
                <select value={selectedClassId} onChange={e => loadClassAttendance(e.target.value)}
                  className="w-full border border-line rounded px-3 py-2.5 text-sm bg-paper focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass">
                  <option value="">— Choose a class to mark attendance —</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.date} — {getSubjectName(c.subjectId)} — {sanitize(c.topic)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedClassId && (
            <>
              {/* Attendance Summary Bar */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="border border-line rounded p-4 bg-paper text-center">
                  <div className="font-mono text-2xl font-bold text-present">
                    {Object.values(attendanceRecords).filter(s => s === 'present').length}
                  </div>
                  <div className="font-mono text-[10px] text-ink-soft uppercase tracking-wider">Present</div>
                </div>
                <div className="border border-line rounded p-4 bg-paper text-center">
                  <div className="font-mono text-2xl font-bold text-absent">
                    {Object.values(attendanceRecords).filter(s => s === 'absent').length}
                  </div>
                  <div className="font-mono text-[10px] text-ink-soft uppercase tracking-wider">Absent</div>
                </div>
                <div className="border border-line rounded p-4 bg-paper text-center">
                  <div className="font-mono text-2xl font-bold text-teal">
                    {students.length > 0 ? Math.round((Object.values(attendanceRecords).filter(s => s === 'present').length / students.length) * 100) : 0}%
                  </div>
                  <div className="font-mono text-[10px] text-ink-soft uppercase tracking-wider">Rate</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button onClick={markAllPresent}
                  className="flex items-center gap-1.5 px-3 py-2 border border-present text-present font-mono text-xs uppercase tracking-wider rounded hover:bg-present-bg transition-colors cursor-pointer">
                  <CheckCircle2 size={14} /> Mark All Present
                </button>
                <button onClick={markAllAbsent}
                  className="flex items-center gap-1.5 px-3 py-2 border border-absent text-absent font-mono text-xs uppercase tracking-wider rounded hover:bg-absent-bg transition-colors cursor-pointer">
                  <XCircle size={14} /> Mark All Absent
                </button>
                <div className="flex-1"></div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input type="text" value={attendanceSearch} onChange={e => setAttendanceSearch(e.target.value)}
                    className="pl-8 pr-3 py-2 border border-line rounded text-sm bg-paper focus:outline-none focus:border-brass w-48"
                    placeholder="Search students..." />
                </div>
                <button onClick={saveAttendance}
                  className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-wider rounded transition-colors cursor-pointer ${
                    attendanceSaved ? 'bg-present text-paper' : 'bg-ink text-paper hover:bg-brass'
                  }`}>
                  <Save size={14} /> {attendanceSaved ? 'Saved!' : 'Save Attendance'}
                </button>
              </div>

              {/* Student List */}
              <div className="border border-line rounded">
                <div className="overflow-x-auto"><table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="border-b border-line bg-paper-dim">
                      <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5 w-12">#</th>
                      <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Name</th>
                      <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Roll No.</th>
                      <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Status</th>
                      <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter(s => !attendanceSearch || s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) || s.rollNumber?.toLowerCase().includes(attendanceSearch.toLowerCase()))
                      .map((s, idx) => {
                        const status = attendanceRecords[s.id] || 'absent';
                        return (
                          <tr key={s.id} className="border-b border-line last:border-0 hover:bg-brass/5">
                            <td className="px-5 py-3 font-mono text-xs text-ink-soft">{idx + 1}</td>
                            <td className="px-5 py-3 font-medium">{s.name}</td>
                            <td className="px-5 py-3 font-mono text-xs">{s.rollNumber || '—'}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full ${
                                status === 'present' ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {status === 'present' ? 'Present' : 'Absent'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <button onClick={() => toggleAttendance(s.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded border transition-colors cursor-pointer ${
                                  status === 'present'
                                    ? 'border-present text-present hover:bg-present hover:text-paper'
                                    : 'border-absent text-absent hover:bg-absent hover:text-paper'
                                }`}>
                                {status === 'present' ? <><XCircle size={12} /> Absent</> : <><CheckCircle2 size={12} /> Present</>}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table></div>
                {students.filter(s => !attendanceSearch || s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) || s.rollNumber?.toLowerCase().includes(attendanceSearch.toLowerCase())).length === 0 && (
                  <div className="py-8 text-center text-ink-soft text-sm">No students found.</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'classes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-serif font-semibold text-lg">Class Records</h3>
            <button onClick={() => setShowAddClass(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-ink text-paper font-mono text-xs uppercase tracking-wider rounded hover:bg-brass transition-colors cursor-pointer">
              <Plus size={14} /> Add Class
            </button>
          </div>

          {showAddClass && (
            <form onSubmit={addClass} className="border-2 border-ink rounded p-5 mb-6 bg-paper">
              <h4 className="font-serif font-semibold mb-4">New Class Record</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Subject</label>
                  <select value={newClass.subjectId} onChange={e => setNewClass({...newClass, subjectId: e.target.value})} required
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper">
                    <option value="">Select subject</option>
                    {subjects.filter(s => s.professorId === user.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Date</label>
                  <input type="date" value={newClass.date} onChange={e => setNewClass({...newClass, date: e.target.value})} required
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper" />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Topic</label>
                  <input type="text" value={newClass.topic} onChange={e => setNewClass({...newClass, topic: e.target.value})} required
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper" placeholder="e.g. Binary Search Trees" />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Duration (min)</label>
                  <input type="number" value={newClass.duration} onChange={e => setNewClass({...newClass, duration: parseInt(e.target.value)})}
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper" />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Students Present</label>
                  <input type="number" value={newClass.studentsPresent} onChange={e => setNewClass({...newClass, studentsPresent: parseInt(e.target.value)})}
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper" />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Total Students</label>
                  <input type="number" value={newClass.totalStudents} onChange={e => setNewClass({...newClass, totalStudents: parseInt(e.target.value)})}
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-ink text-paper font-mono text-xs uppercase rounded hover:bg-brass cursor-pointer">Save</button>
                <button type="button" onClick={() => setShowAddClass(false)} className="px-4 py-2 border border-line text-ink-soft font-mono text-xs uppercase rounded hover:border-ink cursor-pointer">Cancel</button>
              </div>
            </form>
          )}

          <div className="border border-line rounded">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-line bg-paper-dim">
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Date</th>
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Subject</th>
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Topic</th>
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Duration</th>
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Present</th>
                  <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => {
                  const pct = Math.round((c.studentsPresent / c.totalStudents) * 100);
                  return (
                    <tr key={c.id} className="border-b border-line last:border-0 hover:bg-brass/5">
                      <td className="px-5 py-3 font-mono text-xs">{c.date}</td>
                      <td className="px-5 py-3">{getSubjectName(c.subjectId)}</td>
                      <td className="px-5 py-3">{c.topic}</td>
                      <td className="px-5 py-3 font-mono text-xs">{c.duration} min</td>
                      <td className="px-5 py-3 font-mono text-xs">{c.studentsPresent} / {c.totalStudents}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full ${
                          pct >= 80 ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-serif font-semibold text-lg">Notes Repository</h3>
            <button onClick={() => setShowAddNote(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-ink text-paper font-mono text-xs uppercase tracking-wider rounded hover:bg-brass transition-colors cursor-pointer">
              <Upload size={14} /> Upload Notes
            </button>
          </div>

          {showAddNote && (
            <form onSubmit={addNote} className="border-2 border-ink rounded p-5 mb-6 bg-paper">
              <h4 className="font-serif font-semibold mb-4">Upload Notes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Subject</label>
                  <select value={newNote.subjectId} onChange={e => setNewNote({...newNote, subjectId: e.target.value})} required
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper">
                    <option value="">Select subject</option>
                    {subjects.filter(s => s.professorId === user.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Title</label>
                  <input type="text" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} required
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper" placeholder="e.g. Binary Search Trees" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Topics Covered (comma-separated)</label>
                  <input type="text" value={newNote.topicsCovered} onChange={e => setNewNote({...newNote, topicsCovered: e.target.value})}
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper" placeholder="BST, Insertion, Deletion, Traversal" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-ink text-paper font-mono text-xs uppercase rounded hover:bg-brass cursor-pointer">Save</button>
                <button type="button" onClick={() => setShowAddNote(false)} className="px-4 py-2 border border-line text-ink-soft font-mono text-xs uppercase rounded hover:border-ink cursor-pointer">Cancel</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map(n => (
              <div key={n.id} className="border border-line rounded p-5 bg-paper">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-serif font-semibold">{n.title}</h4>
                  <span className="font-mono text-[10px] text-ink-soft">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-ink-soft mb-3">{getSubjectName(n.subjectId)} · {getSubjectCode(n.subjectId)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {n.topicsCovered.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 bg-teal-bg text-teal text-[10px] font-mono rounded">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'questions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-serif font-semibold text-lg">Question Papers</h3>
            <button onClick={() => setShowAddQuestion(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-ink text-paper font-mono text-xs uppercase tracking-wider rounded hover:bg-brass transition-colors cursor-pointer">
              <Upload size={14} /> Upload Paper
            </button>
          </div>

          {showAddQuestion && (
            <form onSubmit={addQuestion} className="border-2 border-ink rounded p-5 mb-6 bg-paper">
              <h4 className="font-serif font-semibold mb-4">Upload Question Paper</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Subject</label>
                  <select value={newQuestion.subjectId} onChange={e => setNewQuestion({...newQuestion, subjectId: e.target.value})} required
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper">
                    <option value="">Select subject</option>
                    {subjects.filter(s => s.professorId === user.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Title</label>
                  <input type="text" value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} required
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper" placeholder="e.g. Mid-Term Exam" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-mono text-[11px] text-ink-soft uppercase tracking-wider mb-1">Topics (comma-separated)</label>
                  <input type="text" value={newQuestion.topics} onChange={e => setNewQuestion({...newQuestion, topics: e.target.value})}
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-paper" placeholder="Arrays, Linked Lists, Trees, Sorting" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-ink text-paper font-mono text-xs uppercase rounded hover:bg-brass cursor-pointer">Upload & Analyze</button>
                <button type="button" onClick={() => setShowAddQuestion(false)} className="px-4 py-2 border border-line text-ink-soft font-mono text-xs uppercase rounded hover:border-ink cursor-pointer">Cancel</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map(q => (
              <div key={q.id} className="border border-line rounded p-5 bg-paper">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-serif font-semibold">{q.title}</h4>
                  <div className="w-16 h-16 rounded-full border-2 border-double border-brass flex flex-col items-center justify-center -rotate-6">
                    <span className="font-serif font-bold text-lg text-brass leading-none">{q.similarityScore || 0}</span>
                    <span className="font-mono text-[8px] text-brass">PERCENT</span>
                  </div>
                </div>
                <p className="text-xs text-ink-soft mb-3">{getSubjectName(q.subjectId)} · Semester {q.semester}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(q.matchedTopics || q.topics || []).map((t, i) => (
                    <span key={i} className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                      q.matchedTopics?.includes(t) ? 'bg-present-bg text-present' : 'bg-paper-dim text-ink-soft'
                    }`}>{t}</span>
                  ))}
                </div>
                <p className="text-[10px] text-ink-soft font-mono">
                  {q.matchedTopics?.length || 0} topics matched with taught notes
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="border border-line rounded p-6 bg-paper">
            <h3 className="font-serif font-semibold text-lg mb-4">Attendance vs. Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                <Tooltip />
                <Bar dataKey="attendance" fill="#1F6E76" name="Attendance %" radius={[2, 2, 0, 0]} />
                <Bar dataKey="marks" fill="#6B3F69" name="Avg Marks" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-line rounded p-6 bg-paper">
              <h4 className="font-serif font-semibold mb-4">Attendance Distribution</h4>
              <div className="space-y-3">
                {analyticsData.slice(0, 5).map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{d.name}</span>
                      <span className="font-mono text-ink-soft">{d.attendance}%</span>
                    </div>
                    <div className="h-2 bg-paper-dim border border-line rounded overflow-hidden">
                      <div className="h-full bg-teal rounded" style={{ width: `${d.attendance}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-line rounded p-6 bg-paper">
              <h4 className="font-serif font-semibold mb-4">Marks Distribution</h4>
              <div className="space-y-3">
                {analyticsData.slice(0, 5).map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{d.name}</span>
                      <span className="font-mono text-ink-soft">{d.marks}%</span>
                    </div>
                    <div className="h-2 bg-paper-dim border border-line rounded overflow-hidden">
                      <div className="h-full bg-plum rounded" style={{ width: `${d.marks}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
