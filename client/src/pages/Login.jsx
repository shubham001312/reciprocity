import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Eye, EyeOff, ArrowRight, Shield, BarChart3, Users } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (em) => {
    setEmail(em);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login(em, 'password123');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
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
            Welcome back to<br />
            <span className="text-brass-bright">RECIPROCITY</span>
          </h2>
          <p className="text-paper/60 text-base leading-relaxed max-w-md mb-10">
            Track attendance, analyze performance, and generate insights across your academic institution.
          </p>
          <div className="space-y-4">
            {[
              { icon: Shield, text: 'Secure JWT authentication with role-based access' },
              { icon: BarChart3, text: 'Real-time analytics and performance tracking' },
              { icon: Users, text: 'Manage professors, students, and subjects' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-paper/50">
                <div className="w-8 h-8 rounded-lg bg-paper/5 flex items-center justify-center">
                  <f.icon size={16} className="text-paper/40" />
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">Log in</h1>
            <p className="text-ink-soft text-sm">Access your role's register and dashboard.</p>
          </div>

          {error && (
            <div className="bg-absent-bg text-absent border border-absent-border rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-absent flex-shrink-0"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-line rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all"
                placeholder="you@makaut.ac.in" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full border border-line rounded-xl px-4 py-3 pr-10 text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors cursor-pointer">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-ink-soft cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-line text-teal focus:ring-teal/20" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-xs text-teal hover:text-teal/80 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-ink text-paper font-medium py-3 rounded-xl hover:bg-ink/90 shadow-card hover:shadow-card-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
              {loading ? (
                <div className="w-5 h-5 border-2 border-paper/30 border-t-paper rounded-full animate-spin"></div>
              ) : (
                <>Log in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-line">
            <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-3 text-center">Quick demo login</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', email: 'admin@makaut.ac.in', color: 'border-brass/30 text-brass hover:bg-brass hover:text-paper hover:border-brass' },
                { label: 'Professor', email: 'sengupta@makaut.ac.in', color: 'border-teal/30 text-teal hover:bg-teal hover:text-paper hover:border-teal' },
                { label: 'Student', email: '2024CSE0142@makaut.ac.in', color: 'border-plum/30 text-plum hover:bg-plum hover:text-paper hover:border-plum' },
              ].map(b => (
                <button key={b.label} onClick={() => quickLogin(b.email)}
                  className={`px-3 py-2.5 border rounded-xl text-xs font-medium transition-all cursor-pointer ${b.color}`}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-ink-soft mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-teal hover:text-teal/80 font-medium transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
