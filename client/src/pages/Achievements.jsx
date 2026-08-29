import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import api from '../api';
import { Trophy, Star, Award, Target, Zap, Lock, CheckCircle2, TrendingUp, Clock, Medal, Flame, Shield, Crown } from 'lucide-react';

const BADGES = [
  { id: 'first_class', name: 'First Class', desc: 'Attended your first class', icon: Zap, color: 'teal', requirement: (s) => s.totalClasses >= 1 },
  { id: 'perfect_attendance', name: 'Perfect Attendance', desc: '100% attendance', icon: Target, color: 'present', requirement: (s) => s.attendancePct === 100 },
  { id: 'high_achiever', name: 'High Achiever', desc: 'Average marks above 80%', icon: TrendingUp, color: 'brass', requirement: (s) => s.avgMarks >= 80 },
  { id: 'consistent', name: 'Consistent Performer', desc: 'Attendance above 80%', icon: Flame, color: 'plum', requirement: (s) => s.attendancePct >= 80 },
  { id: 'locked_in', name: 'Locked In', desc: 'All attendance records confirmed and locked', icon: Lock, color: 'brass', requirement: (s) => s.lockedCount > 0 && s.pendingCount === 0 },
  { id: 'quick_confirmer', name: 'Quick Confirmer', desc: 'Confirmed 5+ attendance records', icon: CheckCircle2, color: 'teal', requirement: (s) => s.confirmedCount >= 5 },
  { id: 'a_grader', name: 'A Grader', desc: 'Standing is A', icon: Crown, color: 'brass', requirement: (s) => s.standing === 'A' },
  { id: 'b_grader', name: 'B Grader', desc: 'Standing is B or higher', icon: Medal, color: 'teal', requirement: (s) => ['A', 'B'].includes(s.standing) },
  { id: 'all_subjects', name: 'Well Rounded', desc: 'Passing in all subjects', icon: Shield, color: 'present', requirement: (s) => s.allPassing },
  { id: 'notes_master', name: 'Notes Master', desc: 'Recorded 5+ notes', icon: Star, color: 'brass', requirement: (s) => s.notesRecorded >= 5 },
];

export default function Achievements() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      if (user.role === 'student') {
        const [statsRes, attRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/attendance/history'),
        ]);
        setStats(statsRes.data);
        setAttendance(attRes.data);
      } else if (user.role === 'professor') {
        const statsRes = await api.get('/analytics/overview');
        setStats(statsRes.data);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  if (loading) return <div className="max-w-4xl mx-auto px-5 py-10 text-center text-ink-muted">Loading...</div>;

  // Compute student stats for badge unlock
  const studentStats = {
    totalClasses: attendance.length,
    attendancePct: stats?.attendance || 0,
    avgMarks: stats?.avgMarks || 0,
    standing: stats?.standing || 'D',
    lockedCount: attendance.filter(a => a.locked).length,
    pendingCount: attendance.filter(a => !a.locked).length,
    confirmedCount: attendance.filter(a => a.studentConfirmed).length,
    allPassing: stats?.avgMarks >= 40,
    notesRecorded: 0,
  };

  const unlocked = BADGES.filter(b => b.condition ? b.condition(studentStats) : b.requirement(studentStats));
  const locked = BADGES.filter(b => !(b.condition ? b.condition(studentStats) : b.requirement(studentStats)));

  const isProfessor = user.role === 'professor';

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Achievements' }]} />
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brass-bg flex items-center justify-center">
            <Trophy size={20} className="text-brass" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">
              {isProfessor ? 'Teaching Achievements' : 'Achievements & Badges'}
            </h1>
            <p className="text-xs text-ink-muted">
              {isProfessor ? 'Your teaching milestones and accomplishments' : 'Unlock badges by performing well across attendance and academics'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-surface border border-line rounded-2xl shadow-card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-bold text-ink">Progress</h3>
          <span className="text-sm font-mono text-ink-muted">{unlocked.length} / {BADGES.length} unlocked</span>
        </div>
        <div className="h-3 bg-paper-dim rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brass to-brass-bright rounded-full transition-all duration-500"
            style={{ width: `${(unlocked.length / BADGES.length) * 100}%` }}></div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <div className="w-2 h-2 rounded-full bg-brass"></div> Unlocked
          </span>
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <div className="w-2 h-2 rounded-full bg-line"></div> Locked
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      {!isProfessor && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-surface border border-line rounded-xl p-4 shadow-card text-center">
            <div className="font-mono text-2xl font-bold text-present">{studentStats.attendancePct}%</div>
            <div className="text-[9px] font-mono text-ink-muted uppercase">Attendance</div>
          </div>
          <div className="bg-surface border border-line rounded-xl p-4 shadow-card text-center">
            <div className="font-mono text-2xl font-bold text-plum">{studentStats.avgMarks}%</div>
            <div className="text-[9px] font-mono text-ink-muted uppercase">Avg Marks</div>
          </div>
          <div className="bg-surface border border-line rounded-xl p-4 shadow-card text-center">
            <div className="font-mono text-2xl font-bold text-brass">{studentStats.lockedCount}</div>
            <div className="text-[9px] font-mono text-ink-muted uppercase">Locked</div>
          </div>
          <div className="bg-surface border border-line rounded-xl p-4 shadow-card text-center">
            <div className={`font-mono text-2xl font-bold ${
              studentStats.standing === 'A' ? 'text-present' : studentStats.standing === 'B' ? 'text-teal' : studentStats.standing === 'C' ? 'text-brass' : 'text-absent'
            }`}>{studentStats.standing}</div>
            <div className="text-[9px] font-mono text-ink-muted uppercase">Standing</div>
          </div>
        </div>
      )}

      {/* Unlocked Badges */}
      {unlocked.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">Unlocked ({unlocked.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlocked.map(b => {
              const colorMap = { teal: 'bg-teal-bg border-teal-border text-teal', brass: 'bg-brass-bg border-brass/20 text-brass', present: 'bg-present-bg border-present-border text-present', plum: 'bg-plum-bg border-plum-border text-plum' };
              return (
                <div key={b.id} className={`border rounded-2xl p-5 shadow-card ${colorMap[b.color]} transition-all hover:shadow-card-hover`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-surface/80 flex items-center justify-center">
                      <b.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-ink text-sm">{b.name}</h4>
                      <p className="text-[10px] text-ink-muted">{b.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-present font-mono">
                    <CheckCircle2 size={10} /> Unlocked
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {locked.length > 0 && (
        <div>
          <h3 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">Locked ({locked.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locked.map(b => (
              <div key={b.id} className="border border-line rounded-2xl p-5 bg-surface/50 opacity-60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-paper-dim flex items-center justify-center">
                    <b.icon size={20} className="text-ink-muted" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-ink text-sm">{b.name}</h4>
                    <p className="text-[10px] text-ink-muted">{b.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-ink-muted font-mono">
                  <Lock size={10} /> Locked
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
