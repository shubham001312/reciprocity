import { useState, useEffect } from 'react';
import api from '../api';
import { CheckCircle2, Clock, Lock, AlertTriangle, ArrowRight, Zap, Calendar } from 'lucide-react';

export default function StudentAttendanceConfirm() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pendingRes, historyRes] = await Promise.all([
        api.get('/attendance/pending'),
        api.get('/attendance/history'),
      ]);
      setPending(pendingRes.data);
      setHistory(historyRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const confirmAttendance = async (classId) => {
    setConfirming(classId);
    try {
      await api.post('/attendance/confirm-student', { classId });
      await loadData();
    } catch (err) { console.error(err); }
    setConfirming(null);
  };

  const confirmAll = async () => {
    const classIds = pending.map(p => p.classId);
    if (classIds.length === 0) return;
    setConfirming('all');
    try {
      await api.post('/attendance/student-bulk-confirm', { classIds });
      await loadData();
    } catch (err) { console.error(err); }
    setConfirming(null);
  };

  if (loading) return <div className="text-center py-8 text-ink-muted text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Pending Alert */}
      {pending.length > 0 && (
        <div className="bg-brass-bg border border-brass/20 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-brass/10 flex items-center justify-center animate-pulse">
              <AlertTriangle size={18} className="text-brass" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-ink">Attendance Pending Confirmation</h3>
              <p className="text-xs text-ink-soft">Your professor has marked attendance for {pending.length} class(es). Confirm to lock it in.</p>
            </div>
          </div>
          <button onClick={confirmAll} disabled={confirming}
            className="flex items-center gap-1.5 px-4 py-2 bg-brass text-paper text-xs font-medium rounded-xl hover:bg-brass/90 shadow-card transition-all cursor-pointer disabled:opacity-50">
            {confirming === 'all' ? (
              <div className="w-3.5 h-3.5 border-2 border-paper/30 border-t-paper rounded-full animate-spin"></div>
            ) : (
              <><CheckCircle2 size={13} /> Confirm All ({pending.length})</>
            )}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-paper-dim rounded-xl p-1">
        {[
          { id: 'pending', label: `Pending (${pending.length})`, icon: Clock },
          { id: 'history', label: 'History', icon: Calendar },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              tab === t.id ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'
            }`}>
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pending' && (
        <>
          {pending.length === 0 ? (
            <div className="bg-surface border border-line rounded-2xl p-12 text-center shadow-card">
              <CheckCircle2 size={40} className="text-present mx-auto mb-3 opacity-40" />
              <p className="text-ink-soft text-sm font-medium">All caught up!</p>
              <p className="text-xs text-ink-muted mt-1">No pending attendance confirmations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(p => (
                <div key={p.classId} className="bg-surface border border-line rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap size={18} className="text-teal" />
                      </div>
                      <div>
                        <h4 className="font-medium text-ink text-sm">{p.classTopic}</h4>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {p.subjectName} · {p.subjectCode} · {p.duration} min
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-present-bg text-present rounded-lg text-[10px] font-mono">
                            <CheckCircle2 size={10} /> Professor confirmed
                          </span>
                          <span className="text-[10px] text-ink-muted">{p.date}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => confirmAttendance(p.classId)} disabled={confirming === p.classId}
                      className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-medium rounded-xl hover:bg-ink/90 shadow-card transition-all cursor-pointer disabled:opacity-50 flex-shrink-0">
                      {confirming === p.classId ? (
                        <div className="w-3.5 h-3.5 border-2 border-paper/30 border-t-paper rounded-full animate-spin"></div>
                      ) : (
                        <>Confirm <ArrowRight size={13} /></>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-dim/50">
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Date</th>
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Class</th>
                <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Subject</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Status</th>
                <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Lock</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                  <td className="px-4 py-3 font-mono text-xs">{h.classDate}</td>
                  <td className="px-4 py-3 text-sm">{h.classTopic}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{h.subjectCode}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${h.status === 'present' ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {h.locked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brass-bg text-brass rounded-lg text-[10px] font-mono font-bold">
                        <Lock size={10} /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-paper-dim text-ink-muted rounded-lg text-[10px] font-mono">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <div className="py-12 text-center text-ink-muted text-sm">No attendance records yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
