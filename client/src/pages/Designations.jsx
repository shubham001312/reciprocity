import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { Send, CheckCircle2, XCircle, Clock, Building2, Search, Filter, UserPlus, AlertCircle } from 'lucide-react';

export default function Designations() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ collegeId: '', department: '', designation: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [reqRes, colRes] = await Promise.all([
        api.get('/designations'),
        api.get('/colleges'),
      ]);
      setRequests(reqRes.data);
      setColleges(colRes.data);
    } catch (err) { console.error(err); }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/designations', form);
      setShowForm(false);
      setForm({ collegeId: '', department: '', designation: user.role, message: '' });
      loadData();
    } catch (err) { setError(err.response?.data?.error || 'Failed to submit'); }
    setLoading(false);
  };

  const handleReview = async (id, action, note = '') => {
    try {
      await api.put(`/designations/${id}/${action}`, { reviewNote: note });
      loadData();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const filtered = requests.filter(r => {
    if (search && !r.collegeName?.toLowerCase().includes(search.toLowerCase()) && !r.userName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== 'all' && r.status !== filter) return false;
    return true;
  });

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-amber-50 text-amber-600 border-amber-200',
      approved: 'bg-teal-bg text-teal border-teal/20',
      rejected: 'bg-red-50 text-red-500 border-red-200',
    };
    const icons = { pending: <Clock size={12} />, approved: <CheckCircle2 size={12} />, rejected: <XCircle size={12} /> };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${map[status]}`}>
        {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">
            {user?.role === 'admin' ? 'Designation Requests' : 'Join a College'}
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            {user?.role === 'admin'
              ? 'Review and approve designation requests from professors and students.'
              : 'Request to join a college. Your request will be reviewed by the admin.'}
          </p>
        </div>
        {user?.role !== 'admin' && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal text-paper text-sm font-medium rounded-xl hover:bg-teal/90 shadow-card transition-all cursor-pointer">
            <UserPlus size={16} /> Request to Join
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-absent-bg border border-absent/20 rounded-xl flex items-center justify-between">
          <span className="text-sm text-absent font-medium">{error}</span>
          <button onClick={() => setError('')} className="text-absent/60 hover:text-absent cursor-pointer">&#x2715;</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by college or user..."
            className="w-full pl-4 pr-4 py-2.5 border border-line rounded-xl text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all" />
        </div>
        <div className="flex gap-1 bg-paper-dim rounded-xl p-1">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer capitalize ${
                filter === s ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-line rounded-xl p-4 shadow-card text-center">
          <div className="font-mono text-2xl font-bold text-amber-600">{requests.filter(r => r.status === 'pending').length}</div>
          <div className="text-[10px] text-ink-muted font-mono uppercase">Pending</div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 shadow-card text-center">
          <div className="font-mono text-2xl font-bold text-teal">{requests.filter(r => r.status === 'approved').length}</div>
          <div className="text-[10px] text-ink-muted font-mono uppercase">Approved</div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 shadow-card text-center">
          <div className="font-mono text-2xl font-bold text-absent">{requests.filter(r => r.status === 'rejected').length}</div>
          <div className="text-[10px] text-ink-muted font-mono uppercase">Rejected</div>
        </div>
      </div>

      {/* Requests list */}
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r._id} className="bg-surface border border-line rounded-2xl p-5 shadow-card">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {statusBadge(r.status)}
                  <span className="text-[10px] text-ink-muted font-mono">#{r._id}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-teal-bg flex items-center justify-center text-[10px] font-bold text-teal">
                    {r.userName?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?'}
                  </div>
                  <div>
                    <span className="font-medium text-ink text-sm">{r.userName}</span>
                    <span className="text-[10px] text-ink-muted font-mono ml-2">{r.userEmail}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-ink-soft">
                  <span className="flex items-center gap-1"><Building2 size={12} /> {r.collegeName} ({r.collegeCode})</span>
                  {r.department && <span>📚 {r.department}</span>}
                  {r.designation && <span>🏷️ {r.designation}</span>}
                </div>
                {r.message && <p className="text-xs text-ink-soft mt-2 italic">"{r.message}"</p>}
                {r.reviewNote && <p className="text-xs text-ink-soft mt-1">Admin note: {r.reviewNote}</p>}
                <div className="text-[10px] text-ink-muted font-mono mt-2">
                  Requested {new Date(r.createdAt).toLocaleString()}
                  {r.reviewedAt && ` · Reviewed ${new Date(r.reviewedAt).toLocaleString()}`}
                </div>
              </div>

              {/* Admin actions */}
              {user?.role === 'admin' && r.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleReview(r._id, 'approve')}
                    className="flex items-center gap-1 px-3 py-2 bg-teal text-paper text-xs font-medium rounded-xl hover:bg-teal/90 transition-all cursor-pointer">
                    <CheckCircle2 size={13} /> Approve
                  </button>
                  <button onClick={() => handleReview(r._id, 'reject')}
                    className="flex items-center gap-1 px-3 py-2 bg-absent text-paper text-xs font-medium rounded-xl hover:bg-absent/90 transition-all cursor-pointer">
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              )}

              {/* User cancel */}
              {user?.role !== 'admin' && r.status === 'pending' && r.userId === user?.id && (
                <button onClick={async () => { await api.delete(`/designations/${r._id}`); loadData(); }}
                  className="text-xs text-ink-muted hover:text-absent cursor-pointer">Cancel</button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-ink-muted text-sm">
            <AlertCircle size={24} className="mx-auto mb-2 opacity-30" />
            No requests found.
          </div>
        )}
      </div>

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/55 flex items-center justify-center z-50 px-4" onClick={() => setShowForm(false)}>
          <div className="bg-paper border-2 border-ink rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-xl font-semibold mb-1">Request to Join College</h3>
            <p className="text-ink-soft text-xs mb-5">Submit a designation request to join an institution.</p>
            <form onSubmit={submitRequest}>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block font-mono text-[10px] text-ink-soft uppercase tracking-wider mb-1">College</label>
                  <select value={form.collegeId} onChange={e => setForm({ ...form, collegeId: e.target.value })} required
                    className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal cursor-pointer">
                    <option value="">— Select College —</option>
                    {colleges.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-soft uppercase tracking-wider mb-1">Department</label>
                  <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal"
                    placeholder="e.g. Computer Science & Engineering" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-soft uppercase tracking-wider mb-1">Designation</label>
                  <select value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
                    className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal cursor-pointer">
                    <option value="professor">Professor</option>
                    <option value="student">Student</option>
                    <option value="hod">Head of Department</option>
                    <option value="dean">Dean</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-soft uppercase tracking-wider mb-1">Message (optional)</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal" rows={3}
                    placeholder="Why do you want to join this college?" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal text-paper font-mono text-xs uppercase rounded-xl hover:bg-teal/90 cursor-pointer disabled:opacity-50">
                  <Send size={13} /> {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-line text-ink-soft font-mono text-xs uppercase rounded-xl cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
