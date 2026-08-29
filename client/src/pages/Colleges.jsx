import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Building2, Search, ChevronRight, MapPin, X, CheckCircle2, Circle, SlidersHorizontal, ArrowLeftRight, Loader2 } from 'lucide-react';

const PAGE_SIZE = 24;

export default function Colleges() {
  const [colleges, setColleges] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [state, setState] = useState('');
  const [type, setType] = useState('');
  const [university, setUniversity] = useState('');
  const [registeredFilter, setRegisteredFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeout = useRef(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
      resetAndLoad();
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  // Load states once
  useEffect(() => {
    api.get('/college-register/states').then(res => setAllStates(res.data)).catch(() => {});
  }, []);

  // Load colleges on filter changes (reset)
  useEffect(() => { resetAndLoad(); }, [debouncedSearch, state, type, university, registeredFilter]);

  const resetAndLoad = () => {
    setPage(1);
    setColleges([]);
    setHasMore(true);
    setLoading(true);
    isLoadingRef.current = false;
    // Directly call loadPage when page is already 1
    // (setPage(1) won't trigger useEffect if page is already 1)
    setTimeout(() => loadPage(1, true), 0);
  };

  // Load page when page changes
  useEffect(() => {
    if (page === 1) {
      loadPage(1, true);
    } else {
      loadPage(page, false);
    }
  }, [page]);

  const loadPage = async (pageNum, isReset) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    if (isReset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (state) params.set('state', state);
      if (type) params.set('type', type);
      if (university) params.set('university', university);
      if (registeredFilter) params.set('registered', registeredFilter);
      params.set('page', pageNum);
      params.set('limit', PAGE_SIZE);

      const res = await api.get(`/college-register/directory?${params}`);
      const newColleges = res.data.colleges || [];
      const totalFromServer = res.data.total || 0;

      setColleges(prev => isReset ? newColleges : [...prev, ...newColleges]);
      setTotal(totalFromServer);
      setHasMore(newColleges.length === PAGE_SIZE);

      // Extract types from first page
      if (allTypes.length === 0 && newColleges.length > 0) {
        const types = new Set();
        newColleges.forEach(c => { if (c.type) types.add(c.type); });
        setAllTypes([...types].sort());
      }
    } catch (err) { console.error(err); }

    setLoading(false);
    setLoadingMore(false);
    isLoadingRef.current = false;
  };

  // Intersection Observer for infinite scroll
  const sentinelCallback = useCallback((node) => {
    if (loading || loadingMore || !hasMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
        setPage(p => p + 1);
      }
    }, { rootMargin: '200px' });

    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, []);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setState('');
    setType('');
    setUniversity('');
    setRegisteredFilter('');
    setPage(1);
    setColleges([]);
    setHasMore(true);
  };

  const hasFilters = debouncedSearch || state || type || university || registeredFilter;
  const activeFilterCount = [debouncedSearch, state, type, university, registeredFilter].filter(Boolean).length;

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-ink to-ink/90 rounded-2xl p-5 md:p-8 mb-8 text-paper relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"><div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2"><Building2 size={20} className="text-brass" /><span className="font-mono text-[10px] text-brass uppercase tracking-widest">Institution Network</span></div>
          <h1 className="font-serif text-3xl font-semibold mb-2">Colleges & Universities</h1>
          <p className="text-paper/60 text-sm mb-4">Search from 13,000+ Indian colleges. Browse by state, type, or university affiliation.</p>
          <div className="flex gap-6 flex-wrap">
            <div><span className="font-mono text-2xl font-bold text-brass">13,208</span><span className="text-[10px] text-paper/50 ml-1 uppercase">Colleges</span></div>
            <div><span className="font-mono text-2xl font-bold text-teal">{total}</span><span className="text-[10px] text-paper/50 ml-1 uppercase">Showing</span></div>
            <div><span className="font-mono text-2xl font-bold text-plum">{allStates.length}</span><span className="text-[10px] text-paper/50 ml-1 uppercase">States</span></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Link to="/compare" className="inline-flex items-center gap-2 px-4 py-2 bg-brass text-paper text-xs font-medium rounded-xl hover:bg-brass/90 transition-all">
              <ArrowLeftRight size={14} /> Compare Colleges
            </Link>
            <Link to="/map" className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-paper text-xs font-medium rounded-xl hover:bg-teal/90 transition-all">
              <MapPin size={14} /> Map View
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, code, city, state, or university..."
              className="w-full pl-9 pr-10 py-2.5 border border-line rounded-xl text-sm bg-surface focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all" />
            {search && (
              <button onClick={() => { setSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-medium transition-all cursor-pointer ${showFilters ? 'bg-teal-bg border-teal/30 text-teal' : 'border-line bg-surface text-ink-soft hover:text-ink hover:border-line-strong'}`}>
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-teal text-paper text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-surface border border-line rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">State / UT</label>
              <select value={state} onChange={e => setState(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-xs bg-paper focus:outline-none focus:border-teal cursor-pointer">
                <option value="">All States ({allStates.length})</option>
                {allStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-xs bg-paper focus:outline-none focus:border-teal cursor-pointer">
                <option value="">All Types</option>
                {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">University</label>
              <input type="text" value={university} onChange={e => setUniversity(e.target.value)}
                placeholder="Filter by university..."
                className="w-full border border-line rounded-lg px-3 py-2 text-xs bg-paper focus:outline-none focus:border-teal" />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-1">Status</label>
              <select value={registeredFilter} onChange={e => setRegisteredFilter(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-xs bg-paper focus:outline-none focus:border-teal cursor-pointer">
                <option value="">All Colleges</option>
                <option value="true">Registered (On Platform)</option>
                <option value="false">Not Yet Registered</option>
              </select>
            </div>
            {hasFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-ink-muted hover:text-absent transition-colors cursor-pointer">
                  <X size={12} /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results count + filter chips */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-ink-muted font-mono">
          {loading ? 'Searching...' : `${colleges.length.toLocaleString()} of ${total.toLocaleString()} colleges loaded`}
        </p>
        {hasFilters && (
          <div className="flex gap-1.5 flex-wrap">
            {debouncedSearch && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-bg text-teal text-[10px] rounded-full font-medium">"{debouncedSearch}" <X size={10} className="cursor-pointer" onClick={() => setSearch('')} /></span>}
            {state && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-plum-bg text-plum text-[10px] rounded-full font-medium">{state} <X size={10} className="cursor-pointer" onClick={() => setState('')} /></span>}
            {type && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brass-bg text-brass text-[10px] rounded-full font-medium">{type} <X size={10} className="cursor-pointer" onClick={() => setType('')} /></span>}
            {university && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-bg text-teal text-[10px] rounded-full font-medium">{university} <X size={10} className="cursor-pointer" onClick={() => setUniversity('')} /></span>}
            {registeredFilter && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-paper-dim text-ink-muted text-[10px] rounded-full font-medium">{registeredFilter === 'true' ? 'Registered' : 'Unregistered'} <X size={10} className="cursor-pointer" onClick={() => setRegisteredFilter('')} /></span>}
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && colleges.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-line rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-paper-dim rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-paper-dim rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-paper-dim rounded w-1/2 mb-2"></div>
              <div className="flex gap-2"><div className="h-5 bg-paper-dim rounded w-16"></div><div className="h-5 bg-paper-dim rounded w-20"></div></div>
            </div>
          ))}
        </div>
      )}

      {/* College Cards */}
      {!loading || colleges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colleges.map(c => (
            <Link key={c._id || c.code} to={c.isRegistered ? `/colleges/${c._id}` : `/college-register`}
              className="bg-surface border border-line rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all group block relative">
              {c.hasAdmin && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-teal-bg rounded-full">
                  <CheckCircle2 size={10} className="text-teal" />
                  <span className="text-[9px] text-teal font-medium">Active</span>
                </div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-bg flex items-center justify-center text-[10px] font-bold text-teal shrink-0">
                  {(c.code || '??').substring(0, 4)}
                </div>
                <div className="flex-1 min-w-0 pr-12">
                  <h3 className="font-serif font-semibold text-ink text-sm group-hover:text-teal transition-colors leading-tight line-clamp-2">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[10px] text-teal uppercase tracking-wider">{c.code || 'N/A'}</span>
                    {c.type && <span className="text-[10px] text-ink-muted">· {c.type}</span>}
                  </div>
                </div>
              </div>
              {(c.state || c.city || c.district) && (
                <div className="flex items-center gap-1.5 mb-3 text-[11px] text-ink-muted">
                  <MapPin size={10} />
                  {[c.city, c.district, c.state].filter(Boolean).join(', ')}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {c.accreditation && <span className="px-2 py-0.5 bg-brass-bg text-brass rounded-lg text-[10px] font-mono">{c.accreditation}</span>}
                {c.university && <span className="px-2 py-0.5 bg-teal-bg/50 text-teal rounded-lg text-[10px] font-mono truncate max-w-[180px]" title={c.university}>{c.university}</span>}
                {c.streams?.length > 0 && <span className="px-2 py-0.5 bg-paper-dim text-ink-muted rounded-lg text-[10px] font-mono">{c.streams.length} streams</span>}
                {c.women && <span className="px-2 py-0.5 bg-plum-bg text-plum rounded-lg text-[10px] font-mono">Women</span>}
                {c.minority && <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-lg text-[10px] font-mono">Minority</span>}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/50">
                {c.hasAdmin ? (
                  <span className="text-[10px] text-teal font-medium flex items-center gap-1"><CheckCircle2 size={10} /> On Platform</span>
                ) : (
                  <span className="text-[10px] text-ink-muted font-medium flex items-center gap-1"><Circle size={10} /> Not registered</span>
                )}
                <ChevronRight size={14} className="text-ink-soft group-hover:text-teal transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {/* Empty state */}
      {!loading && colleges.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-paper-dim flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-ink-muted" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-ink mb-1">No colleges found</h3>
          <p className="text-sm text-ink-muted mb-4">Try adjusting your search or filters.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="px-4 py-2 bg-teal-bg text-teal text-sm font-medium rounded-xl hover:bg-teal/10 transition-colors cursor-pointer">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Infinite scroll sentinel + loading indicator */}
      {colleges.length > 0 && (
        <div ref={sentinelRef} className="py-8 flex flex-col items-center gap-2">
          {loadingMore && (
            <div className="flex items-center gap-2 text-ink-muted text-sm">
              <Loader2 size={16} className="animate-spin" />
              <span>Loading more colleges...</span>
            </div>
          )}
          {!hasMore && colleges.length > 0 && (
            <div className="text-center">
              <div className="w-8 h-px bg-line mx-auto mb-3"></div>
              <p className="text-xs text-ink-muted font-mono">
                {colleges.length.toLocaleString()} of {total.toLocaleString()} colleges loaded
                {hasFilters ? ' (filtered)' : ''}
              </p>
              {total > 100 && (
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="mt-2 text-xs text-teal hover:text-teal/80 transition-colors cursor-pointer">
                  ↑ Back to top
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
