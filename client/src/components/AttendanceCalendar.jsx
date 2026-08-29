import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Lock, Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceCalendar({ records = [], role = 'student' }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  // Group records by date
  const recordsByDate = useMemo(() => {
    const map = {};
    for (const r of records) {
      const date = r.classDate || r.date;
      if (!date) continue;
      if (!map[date]) map[date] = [];
      map[date].push(r);
    }
    return map;
  }, [records]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, empty: true });
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRecords = recordsByDate[dateStr] || [];

      let status = 'no-class';
      if (dayRecords.length > 0) {
        const allLocked = dayRecords.every(r => r.locked);
        const allConfirmed = dayRecords.every(r => r.teacherConfirmed && r.studentConfirmed);
        const anyPresent = dayRecords.some(r => r.status === 'present');
        const anyAbsent = dayRecords.some(r => r.status === 'absent');
        const allPresent = dayRecords.every(r => r.status === 'present');
        const allAbsent = dayRecords.every(r => r.status === 'absent');
        const hasPending = dayRecords.some(r => !r.locked);

        if (allLocked) {
          status = allPresent ? 'locked-present' : allAbsent ? 'locked-absent' : 'locked-mixed';
        } else if (hasPending) {
          status = anyPresent ? 'pending-present' : anyAbsent ? 'pending-absent' : 'pending';
        } else {
          status = allPresent ? 'present' : allAbsent ? 'absent' : 'mixed';
        }
      }

      days.push({ day: d, date: dateStr, records: dayRecords, status, empty: false });
    }

    return days;
  }, [currentMonth, currentYear, recordsByDate]);

  const goToPrev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };

  const goToNext = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
    setSelectedDay(null);
  };

  const getStatusStyle = (status) => {
    const styles = {
      'locked-present': 'bg-present text-paper font-bold shadow-sm',
      'locked-absent': 'bg-absent text-paper font-bold shadow-sm',
      'locked-mixed': 'bg-brass text-paper font-bold shadow-sm',
      'pending-present': 'bg-teal-bg text-teal border-2 border-teal/30',
      'pending-absent': 'bg-absent-bg text-absent border-2 border-absent/30',
      'pending': 'bg-brass-bg text-brass border-2 border-brass/30',
      'present': 'bg-present-bg text-present border border-present/20',
      'absent': 'bg-absent-bg text-absent border border-absent/20',
      'mixed': 'bg-brass-bg text-brass border border-brass/20',
      'no-class': '',
    };
    return styles[status] || '';
  };

  const getStatusIcon = (status) => {
    if (status.startsWith('locked')) return <Lock size={8} className="absolute top-0.5 right-0.5" />;
    if (status.startsWith('pending')) return <Clock size={8} className="absolute top-0.5 right-0.5 animate-pulse" />;
    return null;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'locked-present': 'Present (Locked)',
      'locked-absent': 'Absent (Locked)',
      'locked-mixed': 'Mixed (Locked)',
      'pending-present': 'Present (Pending)',
      'pending-absent': 'Absent (Pending)',
      'pending': 'Pending Confirmation',
      'present': 'Present',
      'absent': 'Absent',
      'mixed': 'Mixed',
      'no-class': 'No class',
    };
    return labels[status] || status;
  };

  // Stats for the current month
  const monthStats = useMemo(() => {
    const monthRecords = records.filter(r => {
      const d = new Date(r.classDate || r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const total = monthRecords.length;
    const present = monthRecords.filter(r => r.status === 'present').length;
    const locked = monthRecords.filter(r => r.locked).length;
    const pending = monthRecords.filter(r => !r.locked).length;
    return { total, present, locked, pending, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [records, currentMonth, currentYear]);

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-bg flex items-center justify-center">
            <Calendar size={18} className="text-teal" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-ink text-sm">Attendance Calendar</h3>
            <p className="text-[10px] text-ink-muted font-mono">Color-coded by confirmation status</p>
          </div>
        </div>
        <button onClick={goToToday}
          className="px-3 py-1 text-[10px] font-mono text-ink-muted border border-line rounded-lg hover:bg-paper-dim transition-all cursor-pointer">
          Today
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-5 py-3">
        <button onClick={goToPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-paper-dim text-ink-soft transition-all cursor-pointer">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <span className="font-serif font-bold text-ink">{MONTHS[currentMonth]} {currentYear}</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[9px] font-mono text-ink-muted">{monthStats.total} classes</span>
            <span className="text-[9px] font-mono text-present">{monthStats.present} present</span>
            <span className="text-[9px] font-mono text-brass">{monthStats.rate}% rate</span>
          </div>
        </div>
        <button onClick={goToNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-paper-dim text-ink-soft transition-all cursor-pointer">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-line">
        {DAYS.map(d => (
          <div key={d} className="text-center py-2 text-[10px] font-mono text-ink-muted uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((cell, i) => (
          <div key={i}
            onClick={() => !cell.empty && cell.day && cell.records.length > 0 && setSelectedDay(selectedDay === cell.date ? null : cell.date)}
            className={`relative min-h-[48px] border-b border-r border-line/50 p-1 transition-all ${
              cell.empty ? 'bg-paper-dim/30' :
              cell.records.length > 0 ? 'cursor-pointer hover:bg-paper-dim/50' : ''
            } ${selectedDay === cell.date ? 'bg-teal-bg/50 ring-2 ring-teal/30' : ''}`}>
            {cell.day && (
              <>
                <span className={`text-xs font-mono ${
                  cell.status === 'no-class' ? 'text-ink-muted' : 'text-ink'
                }`}>
                  {cell.day}
                </span>
                {cell.status !== 'no-class' && (
                  <div className={`mt-0.5 rounded px-1 py-0.5 text-center relative ${getStatusStyle(cell.status)}`}>
                    {getStatusIcon(cell.status)}
                    <span className="text-[8px] font-mono">
                      {cell.records.length > 1 ? `${cell.records.length} cls` : '1 cls'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-line bg-paper-dim/30">
        <div className="flex flex-wrap gap-2">
          {[
            { status: 'locked-present', label: 'Present (Locked)', color: 'bg-present' },
            { status: 'locked-absent', label: 'Absent (Locked)', color: 'bg-absent' },
            { status: 'pending-present', label: 'Present (Pending)', color: 'bg-teal' },
            { status: 'pending-absent', label: 'Absent (Pending)', color: 'bg-absent/60' },
            { status: 'present', label: 'Present', color: 'bg-present/30 border border-present/20' },
            { status: 'absent', label: 'Absent', color: 'bg-absent/30 border border-absent/20' },
          ].map(l => (
            <div key={l.status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${l.color}`}></div>
              <span className="text-[9px] text-ink-muted font-mono">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDay && recordsByDate[selectedDay] && (
        <div className="border-t border-line px-5 py-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-serif font-bold text-ink text-sm">
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h4>
            <button onClick={() => setSelectedDay(null)} className="text-ink-muted hover:text-ink text-xs cursor-pointer">×</button>
          </div>
          <div className="space-y-2">
            {recordsByDate[selectedDay].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-paper-dim/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${r.status === 'present' ? 'bg-present' : 'bg-absent'}`}></div>
                  <div>
                    <span className="text-sm font-medium text-ink">{r.subject || r.subjectName}</span>
                    <span className="text-[10px] text-ink-muted ml-2 font-mono">{r.subjectCode}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium ${
                    r.status === 'present' ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'
                  }`}>
                    {r.status}
                  </span>
                  {r.locked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brass-bg text-brass rounded-lg text-[10px] font-mono font-bold">
                      <Lock size={9} /> Locked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-paper-dim text-ink-muted rounded-lg text-[10px] font-mono">
                      <Clock size={9} /> Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
