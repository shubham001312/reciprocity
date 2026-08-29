import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api';
import { Bell, Plus, X, AlertTriangle, Calendar, BookOpen, Megaphone, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { sanitize, sanitizePreview } from '../sanitize';

const CATEGORY_CONFIG = {
  general: { label: 'General', icon: Megaphone, color: 'text-teal', bg: 'bg-teal-bg' },
  exam: { label: 'Examination', icon: BookOpen, color: 'text-absent', bg: 'bg-absent-bg' },
  event: { label: 'Event', icon: Calendar, color: 'text-brass', bg: 'bg-brass-bg' },
  urgent: { label: 'Urgent', icon: AlertTriangle, color: 'text-absent', bg: 'bg-absent-bg' },
};

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'bg-absent text-paper' },
  normal: { label: 'Normal', color: 'bg-teal-bg text-teal' },
  low: { label: 'Low', color: 'bg-paper-dim text-ink-muted' },
};

export default function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', priority: 'normal' });
  const [filter, setFilter] = useState('all');
  const canPost = user?.role === 'admin' || user?.role === 'professor';

  useEffect(() => { loadNotices(); }, []);

  const loadNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const createNotice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notices', form);
      setShowForm(false);
      setForm({ title: '', content: '', category: 'general', priority: 'normal' });
      loadNotices();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const markRead = async (id) => {
    await api.put(`/notices/${id}/read`);
    loadNotices();
  };

  const deleteNotice = async (id) => {
    if (!confirm('Delete this notice?')) return;
    await api.delete(`/notices/${id}`);
    loadNotices();
  };

  const filtered = notices.filter(n => {
    if (filter === 'all') return true;
    return n.category === filter;
  });

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink flex items-center gap-3">
            <Bell size={24} className="text-brass" /> Notice Board
          </h1>
          <p className="text-ink-soft text-sm mt-1">Latest announcements and updates from your institution</p>
        </div>
        {canPost && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal text-paper text-sm font-medium rounded-xl hover:bg-teal/90 shadow-card transition-all cursor-pointer">
            <Plus size={16} /> Post Notice
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 bg-paper-dim rounded-xl p-1 mb-6 overflow-x-auto">
        {['all', 'general', 'exam', 'event'].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filter === cat ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}>
            {cat === 'all' ? 'All' : CATEGORY_CONFIG[cat]?.label || cat}
          </button>
        ))}
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-line rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-paper-dim rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-paper-dim rounded w-2/3 mb-3"></div>
              <div className="h-3 bg-paper-dim rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Bell size={48} className="mx-auto text-ink-muted/30 mb-4" />
          <p className="text-ink-muted">No notices {filter !== 'all' ? `in "${filter}" category` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(n => {
            const catConfig = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.general;
            const priConfig = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG.normal;
            const isUnread = !(n.readBy || []).includes(user?.id);
            const CatIcon = catConfig.icon;

            return (
              <div key={n._id} className={`bg-surface border rounded-2xl p-5 shadow-card transition-all hover:shadow-card-hover ${
                isUnread ? 'border-l-4 border-l-teal' : 'border-line'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${catConfig.bg} flex items-center justify-center shrink-0`}>
                    <CatIcon size={18} className={catConfig.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-serif font-semibold text-ink">{sanitize(n.title)}</h3>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-teal shrink-0"></span>}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priConfig.color}`}>{priConfig.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catConfig.bg} ${catConfig.color}`}>{catConfig.label}</span>
                    </div>
                    <p className="text-sm text-ink-soft leading-relaxed mb-3">{sanitizePreview(n.content, 150)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] text-ink-muted font-mono">
                        <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(n.createdAt)}</span>
                        <span>By {n.authorName} ({n.authorRole})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <button onClick={() => markRead(n._id)} className="text-[10px] text-teal hover:text-teal/80 cursor-pointer">
                            Mark read
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button onClick={() => deleteNotice(n._id)} className="text-[10px] text-ink-muted hover:text-absent cursor-pointer">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Notice Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-elevated w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif font-semibold text-lg">Post Notice</h3>
              <button onClick={() => setShowForm(false)} className="text-ink-soft hover:text-ink cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={createNotice} className="space-y-3">
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
                className="w-full border border-line rounded-xl px-3 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" />
              <textarea placeholder="Content" value={form.content} onChange={e => setForm({...form, content: e.target.value})} required rows={4}
                className="w-full border border-line rounded-xl px-3 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-ink-muted uppercase mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal cursor-pointer">
                    <option value="general">General</option>
                    <option value="exam">Examination</option>
                    <option value="event">Event</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-ink-muted uppercase mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className="w-full border border-line rounded-xl px-3 py-2 text-sm bg-paper focus:outline-none focus:border-teal cursor-pointer">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-line text-ink-soft text-sm rounded-xl hover:bg-paper-dim cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-teal text-paper text-sm font-medium rounded-xl hover:bg-teal/90 cursor-pointer">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
