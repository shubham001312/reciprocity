import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', rollNumber: '', department: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left — Visual */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 texture-paper opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-paper">
          <div className="w-14 h-14 rounded-2xl bg-paper/10 flex items-center justify-center mb-8 backdrop-blur-sm border border-paper/10">
            <span className="font-serif font-bold text-2xl">R</span>
          </div>
          <h2 className="font-serif text-4xl font-bold leading-tight mb-4">
            Join<br />
            <span className="text-brass-bright">RECIPROCITY</span>
          </h2>
          <p className="text-paper/60 text-base leading-relaxed max-w-md mb-10">
            Create your account to start tracking attendance, uploading notes, and analyzing academic performance.
          </p>
          <div className="space-y-4">
            {['Full-stack MERN application', 'NLP-powered similarity analysis', 'Real-time analytics dashboard', 'PDF semester reports'].map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-paper/50">
                <div className="w-1.5 h-1.5 rounded-full bg-brass-bright/60"></div>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">Create Account</h1>
            <p className="text-ink-soft text-sm">Join the RECIPROCITY platform.</p>
          </div>

          {error && (
            <div className="bg-absent-bg text-absent border border-absent-border rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-absent flex-shrink-0"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                className="w-full border border-line rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all"
                placeholder="Dr. A. Sengupta" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Email address</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                className="w-full border border-line rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all"
                placeholder="you@makaut.ac.in" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
                  className="w-full border border-line rounded-xl px-4 py-3 pr-10 text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all"
                  placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors cursor-pointer">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ val: 'student', label: 'Student', desc: 'View your records' }, { val: 'professor', label: 'Professor', desc: 'Manage classes' }].map(r => (
                  <button key={r.val} type="button" onClick={() => setForm({...form, role: r.val})}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      form.role === r.val ? 'border-teal bg-teal-bg' : 'border-line hover:border-line-strong'
                    }`}>
                    <span className="text-sm font-medium block">{r.label}</span>
                    <span className="text-[10px] text-ink-muted">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            {form.role === 'student' && (
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1.5">Roll Number</label>
                <input type="text" value={form.rollNumber} onChange={e => setForm({...form, rollNumber: e.target.value})}
                  className="w-full border border-line rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all"
                  placeholder="2026CSE0142" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Department</label>
              <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})}
                className="w-full border border-line rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all"
                placeholder="Computer Science & Engineering" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-ink text-paper font-medium py-3 rounded-xl hover:bg-ink/90 shadow-card hover:shadow-card-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
              {loading ? (
                <div className="w-5 h-5 border-2 border-paper/30 border-t-paper rounded-full animate-spin"></div>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-soft mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-teal hover:text-teal/80 font-medium transition-colors">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
