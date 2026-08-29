import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would call the API
    setSent(true);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-5">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-ink-soft text-xs hover:text-ink mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Login
        </Link>

        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-ink mb-2">Reset Password</h1>
          <p className="text-ink-soft text-sm">Enter your email and we'll send you a reset link.</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all"
                  placeholder="you@makaut.ac.in" />
              </div>
            </div>
            <button type="submit"
              className="w-full bg-ink text-paper font-medium py-3 rounded-xl hover:bg-ink/90 shadow-card hover:shadow-card-hover transition-all flex items-center justify-center gap-2 cursor-pointer">
              Send Reset Link
            </button>
          </form>
        ) : (
          <div className="bg-teal-bg border border-teal/20 rounded-xl p-6 text-center">
            <CheckCircle2 size={32} className="text-teal mx-auto mb-3" />
            <h3 className="font-serif font-semibold text-ink mb-1">Check Your Email</h3>
            <p className="text-ink-soft text-sm">We've sent a password reset link to <strong>{email}</strong>.</p>
          </div>
        )}

        <p className="text-center text-sm text-ink-soft mt-8">
          Remember your password?{' '}
          <Link to="/login" className="text-teal hover:text-teal/80 font-medium transition-colors">Log in</Link>
        </p>
      </div>
    </div>
  );
}
