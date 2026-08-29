import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Building2, Search, Plus, X, Users, GraduationCap, BookOpen, BarChart3, Target, ChevronRight, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const COLORS = ['#1F6E76', '#A8862F', '#7C2D5F'];

export default function CollegeCompare() {
  const [allColleges, setAllColleges] = useState([]);
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => { loadColleges(); }, []);

  const loadColleges = async () => {
    try {
      const res = await api.get('/colleges');
      setAllColleges(res.data);
      // Auto-select first 2 if available
      if (res.data.length >= 2) {
        setSelected([res.data[0]._id, res.data[1]._id]);
      }
    } catch (err) { console.error(err); }
  };

  // Load comparison when selected changes
  useEffect(() => {
    if (selected.length >= 2) loadComparison();
    else setComparison(null);
  }, [selected]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/profile/compare?ids=${selected.join(',')}`);
      setComparison(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const addCollege = (college) => {
    if (selected.length >= 3) return;
    if (!selected.includes(college._id)) {
      setSelected([...selected, college._id]);
    }
    setShowSearch(false);
    setSearch('');
    setSearchResults([]);
  };

  const removeCollege = (id) => {
    setSelected(selected.filter(s => s !== id));
  };

  const searchColleges = (q) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const query = q.toLowerCase();
    const results = allColleges.filter(c =>
      !selected.includes(c._id) &&
      (c.name?.toLowerCase().includes(query) || c.code?.toLowerCase().includes(query))
    ).slice(0, 8);
    setSearchResults(results);
  };

  const colleges = comparison || [];
  const maxVal = (key) => Math.max(...colleges.map(c => c[key] || 0), 1);

  // Radar chart data
  const radarData = colleges.length > 0 ? [
    { metric: 'Faculty', ...Object.fromEntries(colleges.map((c, i) => [`c${i}`, c.totalProfessors || 0])) },
    { metric: 'Students', ...Object.fromEntries(colleges.map((c, i) => [`c${i}`, c.totalStudents || 0])) },
    { metric: 'Classes', ...Object.fromEntries(colleges.map((c, i) => [`c${i}`, c.totalClasses || 0])) },
    { metric: 'Subjects', ...Object.fromEntries(colleges.map((c, i) => [`c${i}`, c.totalSubjects || 0])) },
    { metric: 'Attendance', ...Object.fromEntries(colleges.map((c, i) => [`c${i}`, c.avgAttendance || 0])) },
  ] : [];

  // Bar chart for side-by-side
  const barData = colleges.length > 0 ? [
    { metric: 'Faculty', ...Object.fromEntries(colleges.map((c, i) => [`c${i}`, c.totalProfessors || 0])) },
    { metric: 'Students', ...Object.fromEntries(colleges.map((c, i) => [`c${i}`, c.totalStudents || 0])) },
    { metric: 'Classes', ...Object.fromEntries(colleges.map((c, i) => [`c${i}`, c.totalClasses || 0])) },
    { metric: 'Subjects', ...Object.fromEntries(colleges.map((c, i) => [`c${i}`, c.totalSubjects || 0])) },
    { metric: 'Attendance %', ...Object.fromEntries(colleges.map((c, i) => [`c${i}`, c.avgAttendance || 0])) },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Colleges', path: '/colleges' }, { label: 'Compare' }]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brass-bg flex items-center justify-center">
            <ArrowLeftRight size={20} className="text-brass" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold text-ink">Compare Colleges</h1>
            <p className="text-ink-soft text-sm">Select 2-3 colleges to compare stats side by side</p>
          </div>
        </div>
      </div>

      {/* College Selector */}
      <div className="bg-surface border border-line rounded-2xl p-5 mb-6 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">Selected Colleges ({selected.length}/3)</span>
          {selected.length < 3 && (
            <button onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-1 px-3 py-1.5 bg-teal text-paper text-xs font-medium rounded-lg hover:bg-teal/90 transition-all cursor-pointer">
              <Plus size={12} /> Add College
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {selected.map((id, i) => {
            const c = allColleges.find(c => c._id === id);
            if (!c) return null;
            return (
              <div key={id} className="flex items-center gap-3 bg-paper-dim border border-line rounded-xl px-4 py-3 min-w-[200px]">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS[i] + '20', color: COLORS[i] }}>
                  {c.code?.substring(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  <div className="text-[10px] text-ink-muted font-mono">{c.code} · {c.accreditation || 'N/A'}</div>
                </div>
                <button onClick={() => removeCollege(id)} className="text-ink-soft hover:text-absent cursor-pointer shrink-0"><X size={14} /></button>
              </div>
            );
          })}

          {selected.length === 0 && (
            <div className="py-6 text-center text-ink-muted text-sm w-full">Select at least 2 colleges to compare.</div>
          )}
        </div>

        {/* Search Dropdown */}
        {showSearch && (
          <div className="mt-3 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input type="text" value={search} onChange={e => searchColleges(e.target.value)} autoFocus
              placeholder="Search colleges by name or code..."
              className="w-full pl-9 pr-4 py-2.5 border border-line rounded-xl text-sm bg-paper focus:outline-none focus:border-teal" />
            {searchResults.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-surface border border-line rounded-xl shadow-elevated max-h-60 overflow-y-auto">
                {searchResults.map(c => (
                  <button key={c._id} onClick={() => addCollege(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-paper-dim transition-colors text-left cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-teal-bg flex items-center justify-center text-[10px] font-bold text-teal">{(c.code || '??').substring(0, 3)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <div className="text-[10px] text-ink-muted font-mono">{c.code} · {c.accreditation || 'N/A'}</div>
                    </div>
                    <Plus size={14} className="text-teal" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-ink-muted text-sm">Loading comparison data...</span>
        </div>
      )}

      {/* Comparison Results */}
      {!loading && comparison && colleges.length >= 2 && (
        <div className="space-y-6">
          {/* Side-by-side Stats Cards */}
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${colleges.length}, 1fr)` }}>
            {colleges.map((c, i) => (
              <Link key={c._id} to={`/colleges/${c._id}`}
                className="bg-surface border-2 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all group relative overflow-hidden"
                style={{ borderColor: COLORS[i] + '40' }}>
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: COLORS[i] }}></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold" style={{ backgroundColor: COLORS[i] + '15', color: COLORS[i] }}>
                    {c.code?.substring(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-ink group-hover:text-teal transition-colors truncate">{c.name}</h3>
                    <div className="text-[10px] text-ink-muted font-mono">{c.code} · {c.accreditation || 'N/A'} · Est. {c.established || 'N/A'}</div>
                  </div>
                  <ChevronRight size={14} className="text-ink-soft group-hover:text-teal shrink-0" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Faculty', value: c.totalProfessors, icon: Users, color: 'teal' },
                    { label: 'Students', value: c.totalStudents, icon: GraduationCap, color: 'plum' },
                    { label: 'Classes', value: c.totalClasses, icon: BarChart3, color: 'brass' },
                    { label: 'Attendance', value: `${c.avgAttendance}%`, icon: Target, color: 'present' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 bg-paper-dim rounded-lg">
                      <div className={`font-mono text-lg font-bold text-${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-ink-muted uppercase">{s.label}</div>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>

          {/* Bar Chart Comparison */}
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
            <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-teal" /> Side-by-Side Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                <Legend />
                {colleges.map((c, i) => (
                  <Bar key={c._id} dataKey={`c${i}`} fill={COLORS[i]} name={c.name} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          {colleges.length >= 2 && (
            <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                <Target size={16} className="text-brass" /> Performance Radar
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} />
                  {colleges.map((c, i) => (
                    <Radar key={c._id} name={c.name} dataKey={`c${i}`} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed Table */}
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-line">
              <h3 className="font-serif font-semibold text-ink">Detailed Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-line bg-paper-dim/50">
                    <th className="text-left font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5 w-40">Metric</th>
                    {colleges.map((c, i) => (
                      <th key={c._id} className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">
                        <span style={{ color: COLORS[i] }}>{c.code}</span>
                      </th>
                    ))}
                    <th className="text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-4 py-2.5">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Faculty', key: 'totalProfessors', higher: true },
                    { label: 'Students', key: 'totalStudents', higher: true },
                    { label: 'Classes Held', key: 'totalClasses', higher: true },
                    { label: 'Subjects', key: 'totalSubjects', higher: true },
                    { label: 'Avg Attendance', key: 'avgAttendance', higher: true, suffix: '%' },
                    { label: 'Departments', key: 'departments', count: true },
                    { label: 'Streams', key: 'streams', count: true },
                    { label: 'Established', key: 'established' },
                  ].map(row => {
                    const values = colleges.map(c => row.count ? (c[row.key]?.length || 0) : (c[row.key] || 0));
                    const best = row.higher ? values.indexOf(Math.max(...values)) : -1;
                    return (
                      <tr key={row.label} className="border-b border-line/50 last:border-0 hover:bg-paper-dim/30">
                        <td className="px-4 py-3 font-medium text-ink">{row.label}</td>
                        {colleges.map((c, i) => {
                          const val = row.count ? (c[row.key]?.length || 0) : (c[row.key] || 0);
                          return (
                            <td key={c._id} className="px-4 py-3 text-center">
                              <span className={`font-mono text-sm ${i === best ? 'font-bold text-teal' : 'text-ink'}`}>
                                {val}{row.suffix || ''}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          {best >= 0 && <CheckCircle2 size={14} style={{ color: COLORS[best] }} className="inline" />}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Departments list */}
                  <tr className="border-b border-line/50 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">Departments</td>
                    {colleges.map(c => (
                      <td key={c._id} className="px-4 py-3 text-center">
                        <div className="text-[10px] text-ink-soft leading-relaxed">
                          {(c.departments || []).join(', ') || 'N/A'}
                        </div>
                      </td>
                    ))}
                    <td></td>
                  </tr>
                  {/* Streams list */}
                  <tr className="border-b border-line/50 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">Streams</td>
                    {colleges.map(c => (
                      <td key={c._id} className="px-4 py-3 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {(c.streams || []).map(s => (
                            <span key={s.name} className="px-1.5 py-0.5 bg-teal-bg text-teal rounded text-[9px] font-mono">{s.name} ({s.count})</span>
                          ))}
                        </div>
                      </td>
                    ))}
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && selected.length < 2 && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-paper-dim flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight size={28} className="text-ink-muted" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-ink mb-1">Select colleges to compare</h3>
          <p className="text-sm text-ink-muted mb-4">Choose 2-3 colleges from the selector above.</p>
          <Link to="/colleges" className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal text-paper text-sm font-medium rounded-xl hover:bg-teal/90 transition-all">
            Browse Colleges <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
