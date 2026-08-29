import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { MapPin, Building2, Search, X, ChevronRight, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

const COLORS = {
  small: '#0891B2',
  medium: '#A8862F',
  large: '#7C2D5F',
  xlarge: '#DC2626',
};

function getColor(count) {
  if (count >= 1000) return COLORS.xlarge;
  if (count >= 500) return COLORS.large;
  if (count >= 100) return COLORS.medium;
  return COLORS.small;
}

function getRadius(count) {
  if (count >= 1000) return 22;
  if (count >= 500) return 18;
  if (count >= 100) return 14;
  if (count >= 50) return 10;
  return 7;
}

// Lazy-load the actual map component
const LazyMap = lazy(() => import('../components/CollegeMap.jsx'));

export default function MapView() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/college-register/map-data');
      setMarkers(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = markers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => m.state.toLowerCase().includes(q));
    }
    if (filter === 'registered') result = result.filter(m => m.registered > 0);
    if (filter === 'large') result = result.filter(m => m.count >= 500);
    if (filter === 'small') result = result.filter(m => m.count < 100);
    return result;
  }, [markers, search, filter]);

  const totalColleges = markers.reduce((s, m) => s + m.count, 0);
  const totalStates = markers.length;
  const totalRegistered = markers.reduce((s, m) => s + m.registered, 0);

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Link to="/colleges" className="p-2 rounded-lg border border-line text-ink-soft hover:text-ink hover:bg-paper-dim transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-ink">College Map</h1>
            <p className="text-ink-soft text-sm">Explore {totalColleges.toLocaleString()} colleges across {totalStates} states</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-bg rounded-lg">
            <Building2 size={14} className="text-teal" />
            <span className="font-mono text-xs text-teal font-bold">{totalColleges.toLocaleString()}</span>
            <span className="text-[10px] text-teal/60">total</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brass-bg rounded-lg">
            <CheckCircle2 size={14} className="text-brass" />
            <span className="font-mono text-xs text-brass font-bold">{totalRegistered}</span>
            <span className="text-[10px] text-brass/60">registered</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-plum-bg rounded-lg">
            <MapPin size={14} className="text-plum" />
            <span className="font-mono text-xs text-plum font-bold">{totalStates}</span>
            <span className="text-[10px] text-plum/60">states</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-72 shrink-0 space-y-4 hidden lg:block">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search state..."
              className="w-full pl-9 pr-8 py-2.5 border border-line rounded-xl text-sm bg-surface focus:outline-none focus:border-teal" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"><X size={12} /></button>}
          </div>

          {/* Filter */}
          <div className="flex gap-1 bg-paper-dim rounded-xl p-1">
            {[
              { value: '', label: 'All' },
              { value: 'registered', label: 'Active' },
              { value: 'large', label: '500+' },
              { value: 'small', label: '<100' },
            ].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-lg transition-all cursor-pointer ${
                  filter === f.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}>{f.label}</button>
            ))}
          </div>

          {/* Legend */}
          <div className="bg-surface border border-line rounded-xl p-3">
            <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider">College Density</span>
            <div className="flex flex-wrap gap-3 mt-2">
              {[
                { color: COLORS.xlarge, label: '1000+' },
                { color: COLORS.large, label: '500-999' },
                { color: COLORS.medium, label: '100-499' },
                { color: COLORS.small, label: '<100' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }}></div>
                  <span className="text-[10px] text-ink-soft">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* State List */}
          <div className="bg-surface border border-line rounded-xl max-h-[50vh] overflow-y-auto">
            <div className="px-3 py-2 border-b border-line">
              <span className="text-[10px] font-mono text-ink-muted uppercase">States ({filtered.length})</span>
            </div>
            {filtered.sort((a, b) => b.count - a.count).map(m => (
              <button key={m.state} onClick={() => setSelectedState(m)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-paper-dim transition-colors cursor-pointer border-b border-line/50 ${
                  selectedState?.state === m.state ? 'bg-teal-bg' : ''
                }`}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getColor(m.count) }}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{m.state}</div>
                  <div className="text-[10px] text-ink-muted font-mono">{m.count.toLocaleString()} colleges{m.registered > 0 ? ` · ${m.registered} active` : ''}</div>
                </div>
                <ChevronRight size={12} className="text-ink-soft shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-line shadow-card" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
          {loading ? (
            <div className="h-full flex items-center justify-center bg-paper-dim">
              <div className="text-center">
                <Loader2 size={24} className="animate-spin text-teal mx-auto mb-2" />
                <span className="text-sm text-ink-muted">Loading map data...</span>
              </div>
            </div>
          ) : (
            <Suspense fallback={
              <div className="h-full flex items-center justify-center bg-paper-dim">
                <div className="text-center">
                  <Loader2 size={24} className="animate-spin text-teal mx-auto mb-2" />
                  <span className="text-sm text-ink-muted">Loading map...</span>
                </div>
              </div>
            }>
              <LazyMap
                markers={filtered}
                selectedState={selectedState}
                onSelectState={setSelectedState}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
