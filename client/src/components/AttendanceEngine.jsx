import { useState, useEffect } from 'react';
import api from '../api';
import { CheckCircle2, XCircle, Lock, Unlock, Clock, Zap, Save, Users, ArrowRight, Filter } from 'lucide-react';

export default function AttendanceEngine({ subjects, user, classes = [] }) {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [records, setRecords] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, locked, confirmed
  const [tab, setTab] = useState('mark'); // mark, status, history
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassStatus();
    }
  }, [selectedClass]);

  const loadStudents = async () => {
    try {
      const res = await api.get('/users/students');
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  const loadClassStatus = async () => {
    try {
      const res = await api.get(`/attendance/status/${selectedClass}`);
      setStatus(res.data);
      // Pre-fill records with existing status
      const existing = {};
      res.data.students.forEach(s => {
        existing[s.studentId] = s.status;
      });
      setRecords(existing);
    } catch (err) { console.error(err); }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/attendance/history');
      setHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const toggleRecord = (studentId) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAllPresent = () => {
    const all = {};
    students.forEach(s => { all[s.id] = 'present'; });
    setRecords(all);
  };

  const markAllAbsent = () => {
    const all = {};
    students.forEach(s => { all[s.id] = 'absent'; });
    setRecords(all);
  };

  const saveAttendance = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const recordsArray = students.map(s => ({ studentId: s.id, status: records[s.id] || 'absent' }));
      await api.post('/attendance/confirm-teacher', { classId: selectedClass, records: recordsArray });
      setSaved(true);
      await loadClassStatus();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const getSubjectName = (id) => subjects.find(s => (s.id || s._id) === id)?.name || 'Unknown';
  const getSubjectCode = (id) => subjects.find(s => (s.id || s._id) === id)?.code || '';

  const filteredStudents = students.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.rollNumber?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'locked' && status) {
      const att = status.students.find(a => a.studentId === s.id);
      if (!att?.locked) return false;
    }
    if (filter === 'pending' && status) {
      const att = status.students.find(a => a.studentId === s.id);
      if (att?.locked || att?.teacherConfirmed) return false;
    }
    return true;
  });

  const presentCount = Object.values(records).filter(r => r === 'present').length;
  const absentCount = Object.values(records).filter(r => r === 'absent').length;
  const totalCount = students.length;

  return (
    <div className="space-y-6">
      {/* Class Selector */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-bg flex items-center justify-center">
            <Zap size={18} className="text-teal" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-ink">Fast Attendance Engine</h3>
            <p className="text-[10px] text-ink-muted font-mono uppercase tracking-wider">Mark → Student Confirms → Locked</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            className="flex-1 border border-line rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all">
            <option value="">— Select a class —</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.date} — {getSubjectName(c.subjectId)} — {c.topic}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedClass && status && (
        <>
          {/* Status Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface border border-line rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-ink-muted" />
                <span className="text-[10px] font-mono text-ink-muted uppercase">Total</span>
              </div>
              <div className="font-mono text-2xl font-bold text-ink">{status.summary.total}</div>
            </div>
            <div className="bg-surface border border-present-border rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-present" />
                <span className="text-[10px] font-mono text-ink-muted uppercase">Teacher ✓</span>
              </div>
              <div className="font-mono text-2xl font-bold text-present">{status.summary.teacherConfirmed}</div>
            </div>
            <div className="bg-surface border border-teal-border rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-teal" />
                <span className="text-[10px] font-mono text-ink-muted uppercase">Student ✓</span>
              </div>
              <div className="font-mono text-2xl font-bold text-teal">{status.summary.studentConfirmed}</div>
            </div>
            <div className="bg-surface border border-brass/20 rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} className="text-brass" />
                <span className="text-[10px] font-mono text-ink-muted uppercase">Locked</span>
              </div>
              <div className="font-mono text-2xl font-bold text-brass">{status.summary.locked}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-paper-dim rounded-xl p-1">
            {[
              { id: 'mark', label: 'Mark Attendance', icon: Zap },
              { id: 'status', label: 'Live Status', icon: Clock },
              { id: 'history', label: 'History', icon: Filter },
            ].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'history') loadHistory(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  tab === t.id ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'
                }`}>
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'mark' && (
            <>
              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={markAllPresent}
                  className="flex items-center gap-1.5 px-3 py-2 border border-present/30 text-present text-xs font-medium rounded-xl hover:bg-present-bg transition-all cursor-pointer">
                  <CheckCircle2 size={13} /> All Present
                </button>
                <button onClick={markAllAbsent}
                  className="flex items-center gap-1.5 px-3 py-2 border border-absent/30 text-absent text-xs font-medium rounded-xl hover:bg-absent-bg transition-all cursor-pointer">
                  <XCircle size={13} /> All Absent
                </button>
                <div className="flex-1"></div>
                <div className="relative">
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-line rounded-xl text-xs bg-surface focus:outline-none focus:border-teal w-44 transition-all"
                    placeholder="Search student..." />
                </div>
                <button onClick={saveAttendance} disabled={saving || !selectedClass}
                  className={`flex items-center gap-1.5 px-4 py-2 font-medium text-xs rounded-xl transition-all cursor-pointer ${
                    saved ? 'bg-present text-paper' : 'bg-ink text-paper hover:bg-ink/90 shadow-card'
                  } disabled:opacity-50`}>
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-paper/30 border-t-paper rounded-full animate-spin"></div> :
                   saved ? <><CheckCircle2 size={13} /> Saved!</> : <><Save size={13} /> Confirm & Lock</>}
                </button>
              </div>

              {/* Live Counter */}
              <div className="flex items-center gap-4 px-4 py-2.5 bg-paper-dim rounded-xl">
                <span className="text-xs text-ink-muted">
                  <span className="font-mono font-bold text-present">{presentCount}</span> present
                </span>
                <span className="text-xs text-ink-muted">
                  <span className="font-mono font-bold text-absent">{absentCount}</span> absent
                </span>
                <span className="text-xs text-ink-muted">
                  <span className="font-mono font-bold text-brass">{Math.round((presentCount / totalCount) * 100)}%</span> rate
                </span>
              </div>

              {/* Student List */}
              <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-paper-dim/50">
                      <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5 w-10">#</th>
                      <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Student</th>
                      <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Roll No.</th>
                      <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Status</th>
                      <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Lock</th>
                      <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, idx) => {
                      const existing = status?.students.find(a => a.studentId === s.id);
                      const currentStatus = records[s.id] || 'absent';
                      const isLocked = existing?.locked;
                      return (
                        <tr key={s.id} className={`border-b border-line/50 last:border-0 transition-colors ${
                          isLocked ? 'bg-present-bg/30' : 'hover:bg-paper-dim/30'
                        }`}>
                          <td className="px-4 py-3 font-mono text-xs text-ink-muted">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-ink/5 flex items-center justify-center text-[9px] font-bold text-ink-soft">
                                {s.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <span className="font-medium text-ink text-sm">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-ink-muted">{s.rollNumber}</td>
                          <td className="px-4 py-3 text-center">
                            {isLocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-present-bg text-present rounded-lg text-xs font-medium">
                                <Lock size={10} /> {existing?.status === 'present' ? 'Present' : 'Absent'}
                              </span>
                            ) : (
                              <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${
                                currentStatus === 'present' ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'
                              }`}>
                                {currentStatus === 'present' ? 'Present' : 'Absent'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isLocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brass-bg text-brass rounded-lg text-[10px] font-mono font-bold">
                                <Lock size={10} /> LOCKED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-paper-dim text-ink-muted rounded-lg text-[10px] font-mono">
                                <Unlock size={10} /> Open
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isLocked ? (
                              <span className="text-[10px] text-ink-muted">Locked</span>
                            ) : (
                              <button onClick={() => toggleRecord(s.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                  currentStatus === 'present'
                                    ? 'border-present/30 text-present hover:bg-present hover:text-paper'
                                    : 'border-absent/30 text-absent hover:bg-absent hover:text-paper'
                                }`}>
                                {currentStatus === 'present' ? 'Mark Absent' : 'Mark Present'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'status' && (
            <div className="bg-surface border border-line rounded-2xl shadow-card p-6">
              <h4 className="font-serif font-semibold text-ink mb-4">Live Attendance Status</h4>
              <div className="space-y-3">
                {status.students.map(s => (
                  <div key={s.studentId} className="flex items-center gap-3 p-3 rounded-xl bg-paper-dim/50">
                    <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center text-[9px] font-bold text-ink-soft">
                      {s.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="text-xs text-ink-muted ml-2">{s.rollNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono ${s.teacherConfirmed ? 'bg-present-bg text-present' : 'bg-paper-dim text-ink-muted'}`}>
                        {s.teacherConfirmed ? '✓ Teacher' : '⏳ Teacher'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono ${s.studentConfirmed ? 'bg-teal-bg text-teal' : 'bg-paper-dim text-ink-muted'}`}>
                        {s.studentConfirmed ? '✓ Student' : '⏳ Student'}
                      </span>
                      {s.locked && (
                        <span className="px-2 py-0.5 bg-brass-bg text-brass rounded-lg text-[10px] font-mono font-bold">
                          🔒 LOCKED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper-dim/50">
                    <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Date</th>
                    <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Class</th>
                    <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Student</th>
                    <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Status</th>
                    <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Teacher</th>
                    <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Student</th>
                    <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Lock</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                      <td className="px-4 py-3 font-mono text-xs">{h.classDate}</td>
                      <td className="px-4 py-3 text-sm">{h.classTopic}</td>
                      <td className="px-4 py-3 text-sm">{h.studentName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${h.status === 'present' ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'}`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono ${h.teacherConfirmed ? 'bg-present-bg text-present' : 'bg-paper-dim text-ink-muted'}`}>
                          {h.teacherConfirmed ? '✓' : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono ${h.studentConfirmed ? 'bg-teal-bg text-teal' : 'bg-paper-dim text-ink-muted'}`}>
                          {h.studentConfirmed ? '✓' : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {h.locked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brass-bg text-brass rounded-lg text-[10px] font-mono font-bold">
                            <Lock size={10} /> Locked
                          </span>
                        ) : (
                          <span className="text-[10px] text-ink-muted">Open</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.length === 0 && (
                <div className="py-12 text-center text-ink-muted text-sm">No attendance history yet.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
