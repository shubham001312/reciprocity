import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import api, { downloadFile } from '../api';
import { User, Mail, Shield, BookOpen, Clock, Award, LogOut, Calendar, CheckCircle2, Lock, Building2, FileText, FileSpreadsheet, ChevronRight } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, attRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/attendance/history'),
      ]);
      setStats(statsRes.data);
      setAttendance(Array.isArray(attRes.data) ? attRes.data : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-5 py-10 text-center text-ink-muted">Loading...</div>;

  const lockedCount = attendance.filter(a => a.locked).length;
  const pendingCount = attendance.filter(a => !a.locked).length;

  const roleColors = { admin: 'bg-brass text-paper', professor: 'bg-teal text-paper', student: 'bg-plum text-paper' };
  const roleDescriptions = {
    admin: 'Department administrator with full system access',
    professor: 'Faculty member managing classes, attendance, and assessments',
    student: 'Student viewing personal academic records',
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Profile' }]} />
      {/* Profile Header */}
      <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden mb-6">
        <div className="gradient-hero h-32 relative">
          <div className="absolute inset-0 texture-paper opacity-10"></div>
        </div>
        <div className="px-6 pb-6 -mt-12 relative z-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-ink flex items-center justify-center text-paper text-2xl font-bold shadow-elevated border-4 border-surface">
              {user.name?.charAt(0)}
            </div>
            <div className="mb-1">
              <h1 className="font-serif text-2xl font-bold text-ink">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase ${roleColors[user.role]}`}>
                  {user.role}
                </span>
                {user.rollNumber && (
                  <span className="text-xs text-ink-muted font-mono">Roll: {user.rollNumber}</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-ink-soft">{roleDescriptions[user.role]}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-card">
          <h3 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-4">Account Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={15} className="text-ink-muted" />
              <div>
                <span className="text-[10px] text-ink-muted block">Email</span>
                <span className="text-sm font-medium text-ink">{user.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={15} className="text-ink-muted" />
              <div>
                <span className="text-[10px] text-ink-muted block">Role</span>
                <span className="text-sm font-medium text-ink capitalize">{user.role}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 size={15} className="text-ink-muted" />
              <div>
                <span className="text-[10px] text-ink-muted block">Department</span>
                <span className="text-sm font-medium text-ink">{user.department || 'Not specified'}</span>
              </div>
            </div>
            {user.rollNumber && (
              <div className="flex items-center gap-3">
                <User size={15} className="text-ink-muted" />
                <div>
                  <span className="text-[10px] text-ink-muted block">Roll Number</span>
                  <span className="text-sm font-medium text-ink font-mono">{user.rollNumber}</span>
                </div>
              </div>
            )}
            {user.year && (
              <div className="flex items-center gap-3">
                <Calendar size={15} className="text-ink-muted" />
                <div>
                  <span className="text-[10px] text-ink-muted block">Year / Semester / Section</span>
                  <span className="text-sm font-medium text-ink">Year {user.year} · Sem {user.semester || '?'} · Section {user.section || '?'}</span>
                </div>
              </div>
            )}
            {user.stream && (
              <div className="flex items-center gap-3">
                <BookOpen size={15} className="text-ink-muted" />
                <div>
                  <span className="text-[10px] text-ink-muted block">Stream</span>
                  <span className="text-sm font-medium text-ink">{user.stream}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5 shadow-card">
          <h3 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-4">Performance Summary</h3>
          {user.role === 'student' && stats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">Attendance</span>
                <span className="font-mono text-sm font-bold text-present">{stats.attendance}%</span>
              </div>
              <div className="h-2 bg-paper-dim rounded-full overflow-hidden">
                <div className="h-full bg-teal rounded-full" style={{ width: `${stats.attendance}%` }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">Average Marks</span>
                <span className="font-mono text-sm font-bold text-plum">{stats.avgMarks}%</span>
              </div>
              <div className="h-2 bg-paper-dim rounded-full overflow-hidden">
                <div className="h-full bg-plum rounded-full" style={{ width: `${stats.avgMarks}%` }}></div>
              </div>
              {stats.standing && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-soft">Standing</span>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold ${
                    stats.standing === 'A' ? 'bg-present text-paper' : stats.standing === 'B' ? 'bg-teal text-paper' : stats.standing === 'C' ? 'bg-brass text-paper' : 'bg-absent text-paper'
                  }`}>{stats.standing}</span>
                </div>
              )}
              <div className="pt-2 border-t border-line">
                <Link to={`/profile/student/${user.id}`} className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 font-medium">
                  View Full Profile <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ) : user.role === 'professor' && stats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">Classes Taken</span>
                <span className="font-mono text-sm font-bold text-ink">{stats.classesTaken}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">Avg Attendance</span>
                <span className="font-mono text-sm font-bold text-present">{stats.avgAttendance}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">Notes Recorded</span>
                <span className="font-mono text-sm font-bold text-teal">{stats.notesRecorded}</span>
              </div>
              <div className="pt-2 border-t border-line">
                <Link to={`/profile/professor/${user.id}`} className="flex items-center gap-1 text-xs text-teal hover:text-teal/80 font-medium">
                  View Full Profile <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">Professors</span>
                <span className="font-mono text-sm font-bold text-ink">{stats?.professors || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">Students</span>
                <span className="font-mono text-sm font-bold text-ink">{stats?.students || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">Dept Attendance</span>
                <span className="font-mono text-sm font-bold text-present">{stats?.avgAttendance || 0}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History */}
      {attendance.length > 0 && (
        <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-line bg-paper-dim/50 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif font-bold text-ink text-sm">Recent Attendance</h3>
            <div className="flex items-center gap-2">
              {user.role === 'student' && (
                <>
                  <button onClick={() => downloadFile(`/api/attendance-export/pdf/${user.id}`, `attendance-${user.rollNumber || user.id}.pdf`).catch(e => alert('Download failed: ' + e.message))}
                    className="flex items-center gap-1 px-2.5 py-1 border border-line text-ink-soft text-[10px] font-mono rounded-lg hover:bg-paper-dim transition-all cursor-pointer">
                    <FileText size={11} /> PDF
                  </button>
                  <button onClick={() => downloadFile(`/api/attendance-export/excel/${user.id}`, `attendance-${user.rollNumber || user.id}.xlsx`).catch(e => alert('Download failed: ' + e.message))}
                    className="flex items-center gap-1 px-2.5 py-1 border border-present/30 text-present text-[10px] font-mono rounded-lg hover:bg-present-bg transition-all cursor-pointer">
                    <FileSpreadsheet size={11} /> Excel
                  </button>
                </>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-present-bg text-present rounded-lg text-[10px] font-mono">
                <CheckCircle2 size={10} /> {lockedCount} locked
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brass-bg text-brass rounded-lg text-[10px] font-mono">
                <Clock size={10} /> {pendingCount} pending
              </span>
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-5 py-2">Date</th>
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-5 py-2">Class</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-5 py-2">Status</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-5 py-2">Lock</th>
              </tr>
            </thead>
            <tbody>
              {attendance.slice(0, 15).map((a, i) => (
                <tr key={i} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                  <td className="px-5 py-2.5 font-mono text-xs">{a.classDate}</td>
                  <td className="px-5 py-2.5 text-sm">{a.classTopic}</td>
                  <td className="px-5 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${a.status === 'present' ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    {a.locked ? (
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
          </table></div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <button onClick={logout}
          className="flex items-center gap-1.5 px-4 py-2 border border-absent/30 text-absent text-xs font-medium rounded-xl hover:bg-absent-bg transition-all cursor-pointer">
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
}
