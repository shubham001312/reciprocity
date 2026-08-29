import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api';
import { Calendar, Clock, BookOpen, User } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const SUBJECT_COLORS = ['#1F6E76', '#A8862F', '#7C2D5F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Timetable() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 0 : Math.min(new Date().getDay() - 1, 5));

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [clsRes, subRes, profRes] = await Promise.all([
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/users/professors').catch(() => ({ data: [] })),
      ]);
      setClasses(clsRes.data);
      setSubjects(subRes.data);
      setProfessors(profRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getSubject = (id) => subjects.find(s => s._id === id);
  const getProf = (id) => professors.find(p => p.id === id);

  // Build timetable from classes (assign time slots based on date)
  const timetable = {};
  classes.forEach(c => {
    if (!c.date) return;
    const date = new Date(c.date);
    const dayIdx = date.getDay();
    if (dayIdx === 0) return; // Sunday
    const dayName = DAYS[dayIdx - 1];
    const hourIdx = date.getHours() - 9;
    if (hourIdx < 0 || hourIdx >= HOURS.length) return;

    const key = `${dayName}-${hourIdx}`;
    if (!timetable[key]) timetable[key] = [];
    timetable[key].push(c);
  });

  const today = DAYS[selectedDay];
  const todayClasses = classes.filter(c => {
    if (!c.date) return false;
    const d = new Date(c.date);
    return d.getDay() === selectedDay + 1;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Calendar size={24} className="text-teal" />
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Class Timetable</h1>
          <p className="text-ink-soft text-sm">Weekly schedule of all classes</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-ink-soft">Loading timetable...</div>
      ) : (
        <>
          {/* Day Tabs */}
          <div className="flex gap-1 bg-paper-dim rounded-xl p-1 mb-6 overflow-x-auto">
            {DAYS.map((day, i) => {
              const count = classes.filter(c => {
                if (!c.date) return false;
                return new Date(c.date).getDay() === i + 1;
              }).length;
              return (
                <button key={day} onClick={() => setSelectedDay(i)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedDay === i ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                  }`}>
                  {day.substring(0, 3)}
                  {count > 0 && <span className="w-5 h-5 rounded-full bg-teal-bg text-teal text-[10px] font-bold flex items-center justify-center">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Weekly Grid */}
          <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-line bg-paper-dim/50">
                    <th className="w-20 text-center font-mono text-[10px] text-ink-muted uppercase tracking-wider px-2 py-3">Time</th>
                    {DAYS.map(day => (
                      <th key={day} className={`text-center font-mono text-[10px] uppercase tracking-wider px-2 py-3 ${
                        day === today ? 'text-teal font-bold' : 'text-ink-muted'
                      }`}>
                        {day.substring(0, 3)}
                        {day === today && <div className="w-1.5 h-1.5 rounded-full bg-teal mx-auto mt-1"></div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((hour, hi) => (
                    <tr key={hour} className="border-b border-line/50 last:border-0">
                      <td className="text-center px-2 py-3 font-mono text-[11px] text-ink-muted">{hour}</td>
                      {DAYS.map((day, di) => {
                        const key = `${day}-${hi}`;
                        const cellClasses = timetable[key] || [];
                        return (
                          <td key={`${day}-${hour}`} className="px-1 py-1 align-top">
                            {cellClasses.map((c, ci) => {
                              const sub = getSubject(c.subjectId);
                              const prof = getProf(c.professorId);
                              const color = SUBJECT_COLORS[subjects.indexOf(sub) % SUBJECT_COLORS.length];
                              return (
                                <div key={c._id || ci} className="rounded-lg p-2 mb-1 border-l-3 text-xs" style={{ backgroundColor: color + '12', borderLeftColor: color }}>
                                  <div className="font-medium truncate" style={{ color }}>{sub?.name || 'Class'}</div>
                                  <div className="text-[10px] text-ink-muted truncate">{prof?.name || ''}</div>
                                  <div className="text-[9px] text-ink-muted font-mono">Yr{c.year} Sem{c.semester}</div>
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's Classes List */}
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
            <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
              <Clock size={16} className="text-brass" /> {today}'s Schedule ({todayClasses.length} classes)
            </h3>
            {todayClasses.length === 0 ? (
              <p className="text-ink-muted text-sm text-center py-4">No classes scheduled for {today}.</p>
            ) : (
              <div className="space-y-2">
                {todayClasses.map(c => {
                  const sub = getSubject(c.subjectId);
                  const prof = getProf(c.professorId);
                  return (
                    <div key={c._id} className="flex items-center gap-3 p-3 bg-paper-dim rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-teal-bg flex items-center justify-center shrink-0">
                        <BookOpen size={16} className="text-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{sub?.name || 'Unknown Subject'}</div>
                        <div className="text-[10px] text-ink-muted font-mono">
                          {new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {prof?.name || 'TBA'} · {c.topic || 'No topic'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-teal-bg text-teal text-[10px] font-mono rounded-full shrink-0">
                        Yr{c.year}/Sem{c.semester} {c.section}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
