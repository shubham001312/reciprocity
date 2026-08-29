import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Home, LayoutDashboard, GraduationCap, Building2, Trophy, BookOpen, Medal, LogOut, Menu, X, UserPlus, Bell, MessageSquare, Calendar, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = loc.pathname === '/';

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);

  const publicLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/colleges', label: 'Colleges', icon: Building2 },
    { to: '/rankings', label: 'Rankings', icon: Trophy },
    { to: '/syllabus', label: 'Syllabus', icon: BookOpen },
  ];

  const authLinks = user ? [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/notices', label: 'Notices', icon: Bell },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/designations', label: user.role === 'admin' ? 'Requests' : 'Join', icon: UserPlus },
    ...(user.role === 'admin' ? [{ to: '/settings', label: 'Settings', icon: Settings }] : []),
  ] : [];

  const isActive = (path) => loc.pathname === path;

  return (
    <nav className={`sticky top-0 z-50 border-b transition-all ${isHome ? 'bg-ink/95 border-ink/20 backdrop-blur-md' : 'bg-surface/95 border-line backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isHome ? 'bg-brass text-ink' : 'bg-teal text-paper'}`}>R</div>
          <span className={`font-serif text-lg font-semibold hidden sm:block ${isHome ? 'text-paper' : 'text-ink'}`}>RECIPROCITY</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {publicLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive(l.to)
                  ? isHome ? 'bg-paper/10 text-paper' : 'bg-teal-bg text-teal'
                  : isHome ? 'text-paper/60 hover:text-paper' : 'text-ink-soft hover:text-ink hover:bg-paper-dim'
              }`}>
              <l.icon size={13} />{l.label}
            </Link>
          ))}
          {authLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive(l.to)
                  ? isHome ? 'bg-paper/10 text-paper' : 'bg-teal-bg text-teal'
                  : isHome ? 'text-paper/60 hover:text-paper' : 'text-ink-soft hover:text-ink hover:bg-paper-dim'
              }`}>
              <l.icon size={13} />{l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          {!user && (
            <>
              <Link to="/login"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isHome ? 'text-paper/70 hover:text-paper border border-paper/20' : 'text-ink-soft hover:text-ink border border-line'
                }`}>Log in</Link>
              <Link to="/signup"
                className="px-3 py-1.5 bg-teal text-paper text-xs font-medium rounded-lg hover:bg-teal/90 transition-all">Sign up</Link>
            </>
          )}
          {user && (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="flex items-center gap-2 group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${isHome ? 'bg-paper/15 text-paper' : 'bg-plum-bg text-plum'}`}>
                  {user.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <span className={`text-xs font-medium ${isHome ? 'text-paper/80' : 'text-ink-soft'} group-hover:text-teal transition-colors`}>{user.name?.split(' ')[0]}</span>
              </Link>
              <button onClick={logout}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${isHome ? 'text-paper/40 hover:text-paper' : 'text-ink-soft hover:text-absent'}`}>
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-1.5 rounded-lg transition-all cursor-pointer ${isHome ? 'text-paper' : 'text-ink'}`}>
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`md:hidden border-t px-5 py-4 space-y-1 max-h-[70vh] overflow-y-auto ${isHome ? 'bg-ink border-ink/20' : 'bg-surface border-line'}`}>
          {[...publicLinks, ...authLinks].map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(l.to)
                  ? isHome ? 'bg-paper/10 text-paper' : 'bg-teal-bg text-teal'
                  : isHome ? 'text-paper/60' : 'text-ink-soft'
              }`}>
              <l.icon size={15} />{l.label}
            </Link>
          ))}
          {!user && (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-3 py-2 border border-line rounded-lg text-xs font-medium text-ink-soft">Log in</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-3 py-2 bg-teal text-paper text-xs font-medium rounded-lg">Sign up</Link>
            </div>
          )}
          {user && (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isHome ? 'text-paper/60' : 'text-ink-soft'}`}>
                <div className="w-5 h-5 rounded bg-plum-bg flex items-center justify-center text-[8px] font-bold text-plum">{user.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                Profile
              </Link>
              <button onClick={() => { logout(); setMobileOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isHome ? 'text-paper/40' : 'text-ink-muted'}`}>
                <LogOut size={15} /> Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
