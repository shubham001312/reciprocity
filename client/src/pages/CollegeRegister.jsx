import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api';
import { Building2, Search, ArrowRight, CheckCircle2, Shield, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function CollegeRegister() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [directory, setDirectory] = useState([]);
  const [directoryStats, setDirectoryStats] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    collegeName: '', collegeCode: '',
    name: '', email: '', password: '',
    department: '', established: '', address: '', website: '',
    accreditation: '', affiliation: '', streams: '',
  });

  useEffect(() => { loadDirectory(); }, []);

  const loadDirectory = async () => {
    try {
      const res = await api.get('/college-register/unregistered');
      setDirectoryStats(res.data);
    } catch (err) { console.error(err); }
  };

  const searchDirectory = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/college-register/directory?q=${encodeURIComponent(searchQuery)}&limit=30`);
      setDirectory(res.data.colleges || res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const selectFromDirectory = (college) => {
    if (college.hasAdmin) return; // Can't select — already has admin
    setSelectedCollege(college);
    setForm({
      collegeName: college.name,
      collegeCode: college.code,
      name: '', email: '', password: '',
      department: college.departments?.[0] || '',
      established: college.established || '',
      address: college.address || '',
      website: college.website || '',
      accreditation: college.accreditation || '',
      affiliation: college.affiliation || '',
      streams: (college.streams || []).join(', '),
    });
    setStep('register');
  };

  const registerCustom = () => {
    setSelectedCollege(null);
    setForm({
      collegeName: '', collegeCode: '',
      name: '', email: '', password: '',
      department: '', established: '', address: '', website: '',
      accreditation: '', affiliation: '', streams: '',
    });
    setStep('register');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/college-register', form);
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-ink mb-2">
          {step === 'search' ? 'Register Your College' : 'College Registration'}
        </h1>
        <p className="text-ink-soft text-sm">
          {step === 'search'
            ? 'Search for your college in our directory. One admin per college — only the registered admin can manage the institution.'
            : 'Complete the form to become your college\'s admin on RECIPROCITY.'}
        </p>
      </div>

      {/* ─── SEARCH ─── */}
      {step === 'search' && (
        <div className="space-y-6">
          {directoryStats && (
            <div className="bg-gradient-to-br from-ink to-ink/90 rounded-2xl p-6 text-paper">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="font-mono text-3xl font-bold text-brass">{directoryStats.total}</div>
                  <div className="text-[10px] text-paper/50 uppercase font-mono">Total Colleges</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-3xl font-bold text-teal">{directoryStats.registered}</div>
                  <div className="text-[10px] text-paper/50 uppercase font-mono">Registered</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-3xl font-bold text-plum">{directoryStats.unregistered}</div>
                  <div className="text-[10px] text-paper/50 uppercase font-mono">Available</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
            <h3 className="font-serif font-semibold text-ink mb-4">Search College Directory</h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchDirectory()}
                  placeholder="Search by name, code, city, or state..."
                  className="w-full pl-9 pr-4 py-3 border border-line rounded-xl text-sm bg-paper focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all" />
              </div>
              <button onClick={searchDirectory} disabled={loading}
                className="px-6 py-3 bg-teal text-paper text-sm font-medium rounded-xl hover:bg-teal/90 shadow-card transition-all cursor-pointer disabled:opacity-50">
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {directory.length > 0 && (
              <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto">
                {directory.map(c => (
                  <div key={c.code}
                    className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${
                      c.hasAdmin
                        ? 'border-brass/30 bg-brass-bg/30 opacity-70 cursor-not-allowed'
                        : 'border-line hover:bg-teal-bg/30 hover:border-teal/30 cursor-pointer'
                    }`}
                    onClick={() => selectFromDirectory(c)}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                      c.hasAdmin ? 'bg-brass-bg text-brass' : 'bg-teal-bg text-teal'
                    }`}>{c.code}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink text-sm truncate">{c.name}</div>
                      <div className="text-[10px] text-ink-muted font-mono">{c.state} · {c.city} · {c.type}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {c.hasAdmin ? (
                        <div>
                          <div className="flex items-center gap-1 text-brass text-[10px] font-mono font-bold">
                            <Shield size={10} /> Admin Assigned
                          </div>
                          <div className="text-[9px] text-ink-muted mt-0.5">{c.adminName}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-[10px] text-ink-muted">Est. {c.established}</div>
                          <div className="text-[10px] text-teal font-mono font-bold">Register →</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && directory.length === 0 && !loading && (
              <div className="mt-4 text-center py-8 text-ink-muted text-sm">
                <Building2 size={24} className="mx-auto mb-2 opacity-30" />
                No colleges found. Try a different search or register manually below.
              </div>
            )}
          </div>

          <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
            <h3 className="font-serif font-semibold text-ink mb-2">College Not Listed?</h3>
            <p className="text-ink-soft text-sm mb-4">Register your institution manually and become the admin.</p>
            <button onClick={registerCustom}
              className="flex items-center gap-2 px-5 py-2.5 bg-brass text-paper text-sm font-medium rounded-xl hover:bg-brass/90 shadow-card transition-all cursor-pointer">
              <Building2 size={16} /> Register New College
            </button>
          </div>
        </div>
      )}

      {/* ─── REGISTER FORM ─── */}
      {step === 'register' && (
        <div>
          <button onClick={() => setStep('search')} className="inline-flex items-center gap-1.5 text-ink-soft text-xs hover:text-ink mb-6 transition-colors cursor-pointer">
            <ArrowLeft size={14} /> Back to Search
          </button>

          {selectedCollege && (
            <div className="bg-teal-bg border border-teal/20 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Building2 size={18} className="text-teal" />
              <div>
                <span className="text-sm font-medium text-ink">{selectedCollege.name}</span>
                <span className="text-[10px] text-ink-muted ml-2 font-mono">{selectedCollege.code} · {selectedCollege.state}</span>
              </div>
              <CheckCircle2 size={16} className="text-teal ml-auto" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-500 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-amber-700 text-xs flex items-center gap-2">
            <Shield size={14} />
            <span><strong>One admin per college.</strong> Once registered, no other admin can be created for this college. Choose your admin credentials carefully.</span>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-teal" /> College Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">College Name *</label>
                  <input type="text" value={form.collegeName} onChange={e => setForm({ ...form, collegeName: e.target.value })} required
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">College Code *</label>
                  <input type="text" value={form.collegeCode} onChange={e => setForm({ ...form, collegeCode: e.target.value })} required
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" placeholder="e.g. IITB" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Established</label>
                  <input type="number" value={form.established} onChange={e => setForm({ ...form, established: e.target.value })}
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" placeholder="e.g. 1958" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Accreditation</label>
                  <select value={form.accreditation} onChange={e => setForm({ ...form, accreditation: e.target.value })}
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal cursor-pointer">
                    <option value="">Select</option>
                    <option value="NAAC A++">NAAC A++</option>
                    <option value="NAAC A+">NAAC A+</option>
                    <option value="NAAC A">NAAC A</option>
                    <option value="NAAC B++">NAAC B++</option>
                    <option value="NBA">NBA</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Address</label>
                  <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Website</label>
                  <input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Affiliation</label>
                  <input type="text" value={form.affiliation} onChange={e => setForm({ ...form, affiliation: e.target.value })}
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" placeholder="e.g. Autonomous" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Department</label>
                  <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" placeholder="e.g. Computer Science & Engineering" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Streams (comma separated)</label>
                  <input type="text" value={form.streams} onChange={e => setForm({ ...form, streams: e.target.value })}
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" placeholder="CSE, ECE, EE, ME" />
                </div>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                <Shield size={16} className="text-brass" /> Admin Account (One Per College)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Your Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" placeholder="Dr. A. Smith" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Admin Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" placeholder="admin@yourcollege.ac.in" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6}
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm bg-paper focus:outline-none focus:border-teal" placeholder="Min 6 characters" />
                </div>
              </div>
              <p className="text-[10px] text-ink-muted mt-3 font-mono">
                This account will be the sole admin for your college. You can then invite professors and students to join.
              </p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 shadow-card transition-all disabled:opacity-50 cursor-pointer">
              {loading ? (
                <div className="w-5 h-5 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
              ) : (
                <>Register College & Become Admin <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
