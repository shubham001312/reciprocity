import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api';
import { Settings, Building2, BookOpen, Calendar, Users, Database, Shield, Save, CheckCircle2, AlertTriangle, HardDrive, RefreshCw } from 'lucide-react';

export default function SystemSettings() {
  const { user } = useAuth();
  const [college, setCollege] = useState(null);
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const cid = user?.collegeId || 'col-001';
      const [collegeRes, statsRes, subsRes, studsRes, profsRes, classesRes] = await Promise.all([
        api.get(`/profile/college/${cid}`).catch(() => ({ data: null })),
        api.get('/analytics/overview').catch(() => ({ data: null })),
        api.get('/subjects'),
        api.get('/users/students'),
        api.get('/users/professors'),
        api.get('/classes'),
      ]);
      setCollege(collegeRes.data);
      setStats(statsRes.data);
      setSubjects(subsRes.data);
      setStudents(studsRes.data);
      setProfessors(profsRes.data);
      setClasses(classesRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (loading) return <div className="max-w-5xl mx-auto px-5 py-10 text-center text-ink-soft">Loading settings...</div>;

  // Compute stats
  const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort((a, b) => a - b);
  const streams = [...new Set(students.map(s => s.stream).filter(Boolean))].sort();
  const departments = [...new Set([...professors.map(p => p.department), ...students.map(s => s.department)].filter(Boolean))].sort();
  const yearDistribution = [1, 2, 3, 4].map(y => ({ year: y, count: students.filter(s => s.year === y).length }));
  const sectionDistribution = ['A', 'B', 'C'].map(sec => ({ section: sec, count: students.filter(s => s.section === sec).length }));

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={24} className="text-ink" />
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">System Settings</h1>
          <p className="text-ink-soft text-sm">Manage your institution configuration</p>
        </div>
      </div>

      {/* College Info */}
      {college && (
        <section className="bg-surface border border-line rounded-2xl p-6 shadow-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-teal" />
            <h2 className="font-serif font-semibold text-ink">College Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'College Name', value: college.name },
              { label: 'Code', value: college.code },
              { label: 'Accreditation', value: college.accreditation || 'Not set' },
              { label: 'Affiliation', value: college.affiliation || 'Not set' },
              { label: 'Established', value: college.established || 'Not set' },
              { label: 'Address', value: college.address || 'Not set' },
              { label: 'Website', value: college.website || 'Not set' },
              { label: 'Departments', value: `${departments.length} active` },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-paper-dim rounded-xl">
                <span className="text-xs text-ink-muted">{item.label}</span>
                <span className="text-sm font-medium text-ink">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Academic Structure */}
      <section className="bg-surface border border-line rounded-2xl p-6 shadow-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-brass" />
          <h2 className="font-serif font-semibold text-ink">Academic Structure</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-4 bg-teal-bg rounded-xl">
            <div className="font-mono text-2xl font-bold text-teal">{subjects.length}</div>
            <div className="text-[10px] text-ink-muted uppercase">Subjects</div>
          </div>
          <div className="text-center p-4 bg-brass-bg rounded-xl">
            <div className="font-mono text-2xl font-bold text-brass">{semesters.length}</div>
            <div className="text-[10px] text-ink-muted uppercase">Semesters</div>
          </div>
          <div className="text-center p-4 bg-plum-bg rounded-xl">
            <div className="font-mono text-2xl font-bold text-plum">{departments.length}</div>
            <div className="text-[10px] text-ink-muted uppercase">Departments</div>
          </div>
          <div className="text-center p-4 bg-present-bg rounded-xl">
            <div className="font-mono text-2xl font-bold text-present">{streams.length}</div>
            <div className="text-[10px] text-ink-muted uppercase">Streams</div>
          </div>
        </div>

        {/* Semesters */}
        <div className="mb-4">
          <h3 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-2">Active Semesters</h3>
          <div className="flex flex-wrap gap-2">
            {semesters.map(s => {
              const count = subjects.filter(sub => sub.semester === s).length;
              return (
                <div key={s} className="flex items-center gap-2 px-3 py-2 bg-paper-dim rounded-lg">
                  <span className="text-sm font-medium">Semester {s}</span>
                  <span className="text-[10px] font-mono text-ink-muted">{count} subjects</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streams */}
        <div>
          <h3 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-2">Streams</h3>
          <div className="flex flex-wrap gap-2">
            {streams.map(s => (
              <div key={s} className="flex items-center gap-2 px-3 py-2 bg-teal-bg rounded-lg">
                <span className="text-sm font-medium text-teal">{s}</span>
                <span className="text-[10px] font-mono text-teal/60">{students.filter(st => st.stream === s).length} students</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Year & Section Distribution */}
      <section className="bg-surface border border-line rounded-2xl p-6 shadow-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-plum" />
          <h2 className="font-serif font-semibold text-ink">Student Distribution</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Year Distribution */}
          <div>
            <h3 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">By Year</h3>
            <div className="space-y-2">
              {yearDistribution.map(y => {
                const maxCount = Math.max(...yearDistribution.map(d => d.count), 1);
                const pct = (y.count / maxCount) * 100;
                return (
                  <div key={y.year} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-12">Yr {y.year}</span>
                    <div className="flex-1 h-6 bg-paper-dim rounded-lg overflow-hidden">
                      <div className="h-full bg-teal rounded-lg transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-xs font-mono text-ink-muted w-8 text-right">{y.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section Distribution */}
          <div>
            <h3 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">By Section</h3>
            <div className="space-y-2">
              {sectionDistribution.map(s => {
                const maxCount = Math.max(...sectionDistribution.map(d => d.count), 1);
                const pct = (s.count / maxCount) * 100;
                return (
                  <div key={s.section} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-12">Sec {s.section}</span>
                    <div className="flex-1 h-6 bg-paper-dim rounded-lg overflow-hidden">
                      <div className="h-full bg-plum rounded-lg transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-xs font-mono text-ink-muted w-8 text-right">{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Data Summary */}
      <section className="bg-surface border border-line rounded-2xl p-6 shadow-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} className="text-ink" />
          <h2 className="font-serif font-semibold text-ink">Data Summary</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Students', value: students.length, icon: Users, color: 'text-plum' },
            { label: 'Professors', value: professors.length, icon: Users, color: 'text-teal' },
            { label: 'Subjects', value: subjects.length, icon: BookOpen, color: 'text-brass' },
            { label: 'Classes Held', value: classes.length, icon: Calendar, color: 'text-present' },
            { label: 'Departments', value: departments.length, icon: Building2, color: 'text-teal' },
            { label: 'Streams', value: streams.length, icon: Database, color: 'text-plum' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-3 bg-paper-dim rounded-xl">
              <item.icon size={16} className={item.color} />
              <div>
                <div className="font-mono text-lg font-bold">{item.value}</div>
                <div className="text-[10px] text-ink-muted uppercase">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* System Info */}
      <section className="bg-surface border border-line rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive size={18} className="text-ink" />
          <h2 className="font-serif font-semibold text-ink">System Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: 'Platform', value: 'RECIPROCITY v1.0' },
            { label: 'Stack', value: 'MERN (React + Express + MongoDB)' },
            { label: 'Storage', value: 'JSON File (fallback from MongoDB Atlas)' },
            { label: 'Auth', value: 'JWT (7-day expiry)' },
            { label: 'College Directory', value: '13,208 AICTE colleges' },
            { label: 'Server Port', value: '5000' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-paper-dim rounded-xl">
              <span className="text-xs text-ink-muted">{item.label}</span>
              <span className="text-xs font-mono text-ink">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
