import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { downloadFile } from '../api';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, FileText, Clock, FileSpreadsheet } from 'lucide-react';
import StudentAttendanceConfirm from '../components/StudentAttendanceConfirm';
import AttendanceCalendar from '../components/AttendanceCalendar';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [marksSummary, setMarksSummary] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const [attendance, setAttendance] = useState([]);

  const loadData = async () => {
    try {
      const [statsRes, marksRes, reportRes, attRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get(`/marks/student/${user.id}/summary`),
        api.get(`/reports/semester/${user.id}`),
        api.get('/attendance/history'),
      ]);
      setStats(statsRes.data);
      setMarksSummary(marksRes.data);
      setReport(reportRes.data);
      setAttendance(attRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  if (!stats || !marksSummary) return <div className="max-w-6xl mx-auto px-5 py-10 text-center text-ink-soft">Loading...</div>;

  const chartData = report?.subjects?.map(s => ({
    name: s.code,
    attendance: s.attendance,
    marks: s.percentage,
  })) || [];

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Student Record</h1>
          <p className="text-ink-soft text-sm mt-1">
            {user.name} — Roll No. {user.rollNumber} — {user.department || 'B.Tech CSE'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-ink-soft">Semester III</p>
          <p className="font-mono text-xs text-ink-soft">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => downloadFile(`/api/reports/pdf/${user.id}`, `report-${user.rollNumber || user.id}.pdf`).catch(e => alert('Download failed: ' + e.message))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-paper text-xs font-medium rounded-xl hover:bg-ink/90 shadow-card transition-all cursor-pointer"
            >
              <FileText size={13} /> PDF Report
            </button>
            <button
              onClick={() => downloadFile(`/api/attendance-export/pdf/${user.id}`, `attendance-${user.rollNumber || user.id}.pdf`).catch(e => alert('Download failed: ' + e.message))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-line text-ink-soft text-xs font-medium rounded-xl hover:bg-paper-dim transition-all cursor-pointer"
            >
              <Download size={13} /> Attendance PDF
            </button>
            <button
              onClick={() => downloadFile(`/api/attendance-export/excel/${user.id}`, `attendance-${user.rollNumber || user.id}.xlsx`).catch(e => alert('Download failed: ' + e.message))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-present/30 text-present text-xs font-medium rounded-xl hover:bg-present-bg transition-all cursor-pointer"
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Calendar */}
      <div className="mb-8">
        <AttendanceCalendar records={attendance} role="student" />
      </div>

      {/* Attendance Confirmation */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-bg flex items-center justify-center">
            <Clock size={18} className="text-teal" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-ink">Attendance Confirmation</h2>
            <p className="text-[10px] text-ink-muted font-mono uppercase tracking-wider">Confirm to lock your attendance record</p>
          </div>
        </div>
        <StudentAttendanceConfirm />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard value={`${stats.attendance}%`} label="Attendance" color="teal" />
        <StatCard value={stats.avgMarks} label="Avg. marks" color="plum" />
        <StatCard value={stats.subjectsTracked} label="Subjects tracked" />
        <StatCard value={stats.standing} label="Standing" color="brass" />
      </div>

      {/* Subject-wise Record */}
      <div className="border border-line rounded mb-8">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-line bg-paper-dim">
          <h3 className="font-serif font-semibold">Subject-wise Record</h3>
          <div className="flex-1 h-px bg-line"></div>
          <span className="font-mono text-[10px] text-ink-soft uppercase tracking-wider">Semester III</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Subject</th>
              <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Code</th>
              <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Classes Held</th>
              <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Attended</th>
              <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Attendance</th>
              <th className="text-left font-mono text-[10px] text-ink-soft uppercase tracking-wider px-5 py-2.5">Marks</th>
            </tr>
          </thead>
          <tbody>
            {report?.subjects?.map(s => (
              <tr key={s.code} className="border-b border-line last:border-0 hover:bg-brass/5">
                <td className="px-5 py-3 font-medium">{s.subject}</td>
                <td className="px-5 py-3 font-mono text-xs">{s.code}</td>
                <td className="px-5 py-3 font-mono text-xs">{s.classesHeld}</td>
                <td className="px-5 py-3 font-mono text-xs">{s.classesAttended}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full ${
                    s.attendance >= 80 ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {s.attendance}%
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center font-mono text-xs px-2.5 py-1 rounded-full ${
                    s.percentage >= 70 ? 'bg-present-bg text-present' : s.percentage >= 50 ? 'bg-teal-bg text-teal' : 'bg-absent-bg text-absent'
                  }`}>
                    {s.marks} / {s.maxMarks}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Attendance vs Marks Chart */}
        <div className="border border-line rounded p-6 bg-paper">
          <h3 className="font-serif font-semibold text-lg mb-4">Attendance vs. Marks</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C3" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="attendance" fill="#1F6E76" name="Attendance %" radius={[2, 2, 0, 0]} />
              <Bar dataKey="marks" fill="#6B3F69" name="Marks %" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Card */}
        <div className="border border-line rounded p-6 bg-paper">
          <h3 className="font-serif font-semibold text-lg mb-4">Overall Summary</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Total Attendance</span>
                <span className="font-mono font-semibold">{report?.overall?.attendance || 0}%</span>
              </div>
              <div className="h-3 bg-paper-dim border border-line rounded overflow-hidden">
                <div className="h-full bg-teal rounded" style={{ width: `${report?.overall?.attendance || 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Marks</span>
                <span className="font-mono font-semibold">{report?.overall?.percentage || 0}%</span>
              </div>
              <div className="h-3 bg-paper-dim border border-line rounded overflow-hidden">
                <div className="h-full bg-plum rounded" style={{ width: `${report?.overall?.percentage || 0}%` }}></div>
              </div>
            </div>
            <div className="pt-4 border-t border-line grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-ink">{report?.overall?.totalMarks || 0}</div>
                <div className="font-mono text-[10px] text-ink-soft uppercase">Total Marks</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-brass">{report?.overall?.maxMarks || 0}</div>
                <div className="font-mono text-[10px] text-ink-soft uppercase">Max Marks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance vs Marks - Discrete Mathematics Detail */}
      {chartData.length > 2 && (
        <div className="border border-line rounded p-6 bg-paper mb-8">
          <h3 className="font-serif font-semibold text-lg mb-4">Detailed Comparison — {chartData[2]?.name || 'All Subjects'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-mono text-xs text-ink-soft uppercase tracking-wider mb-3">Attendance</h4>
              <div className="space-y-3">
                {chartData.map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{d.name}</span>
                      <span className="font-mono text-ink-soft">{d.attendance}%</span>
                    </div>
                    <div className="h-2 bg-paper-dim border border-line rounded overflow-hidden">
                      <div className="h-full bg-teal rounded" style={{ width: `${d.attendance}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-mono text-xs text-ink-soft uppercase tracking-wider mb-3">Marks</h4>
              <div className="space-y-3">
                {chartData.map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{d.name}</span>
                      <span className="font-mono text-ink-soft">{d.marks}%</span>
                    </div>
                    <div className="h-2 bg-paper-dim border border-line rounded overflow-hidden">
                      <div className="h-full bg-plum rounded" style={{ width: `${d.marks}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
