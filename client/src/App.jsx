import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ProfessorDashboard from './pages/ProfessorDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Syllabus from './pages/Syllabus.jsx';
import Colleges from './pages/Colleges.jsx';
import CollegeProfile from './pages/CollegeProfile.jsx';
import Achievements from './pages/Achievements.jsx';
import Profile from './pages/Profile.jsx';
import Rankings from './pages/Rankings.jsx';
import ProfessorProfile from './pages/ProfessorProfile.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import Designations from './pages/Designations.jsx';
import CollegeRegister from './pages/CollegeRegister.jsx';
import Developer from './pages/Developer.jsx';
import CollegeCompare from './pages/CollegeCompare.jsx';
import MapView from './pages/MapView.jsx';
import NoticeBoard from './pages/NoticeBoard.jsx';
import Messages from './pages/Messages.jsx';
import SystemSettings from './pages/SystemSettings.jsx';
import Timetable from './pages/Timetable.jsx';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/colleges" element={<Colleges />} />
      <Route path="/colleges/:id" element={<CollegeProfile />} />
      <Route path="/rankings" element={<Rankings />} />
      <Route path="/profile/professor/:id" element={<ProfessorProfile />} />
      <Route path="/profile/student/:id" element={<StudentProfile />} />
      <Route path="/syllabus" element={<Syllabus />} />
      <Route path="/college-register" element={<CollegeRegister />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {user?.role === 'admin' ? <AdminDashboard /> :
           user?.role === 'professor' ? <ProfessorDashboard /> :
           <StudentDashboard />}
        </ProtectedRoute>
      } />
      <Route path="/achievements" element={
        <ProtectedRoute><Achievements /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
      <Route path="/designations" element={
        <ProtectedRoute><Designations /></ProtectedRoute>
      } />
      <Route path="/admin/designations" element={
        <ProtectedRoute roles={['admin']}><Designations /></ProtectedRoute>
      } />
      <Route path="/developer" element={<Developer />} />
      <Route path="/compare" element={<CollegeCompare />} />
      <Route path="/map" element={<MapView />} />
      <Route path="/notices" element={<NoticeBoard />} />
      <Route path="/timetable" element={<Timetable />} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={['admin']}><SystemSettings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-paper flex flex-col">
            <Navbar />
            <main className="flex-1 page-enter">
              <AppRoutes />
            </main>
            <footer className="bg-ink border-t border-ink/20">
              <div className="max-w-6xl mx-auto px-5 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-paper/10 flex items-center justify-center">
                        <span className="font-serif font-bold text-paper text-xs">R</span>
                      </div>
                      <span className="font-serif text-sm font-semibold text-paper">RECIPROCITY</span>
                    </div>
                    <p className="text-xs text-paper/40 leading-relaxed">Every Class. Every Student. Every Outcome Matters.</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono text-paper/50 uppercase tracking-wider mb-3">Platform</h4>
                    <div className="space-y-2">
                      <Link to="/" className="block text-xs text-paper/40 hover:text-paper transition-colors">Home</Link>
                      <Link to="/colleges" className="block text-xs text-paper/40 hover:text-paper transition-colors">Colleges</Link>
                      <Link to="/compare" className="block text-xs text-paper/40 hover:text-paper transition-colors">Compare</Link>
                      <Link to="/map" className="block text-xs text-paper/40 hover:text-paper transition-colors">Map</Link>
                      <Link to="/rankings" className="block text-xs text-paper/40 hover:text-paper transition-colors">Rankings</Link>
                      <Link to="/syllabus" className="block text-xs text-paper/40 hover:text-paper transition-colors">Syllabus</Link>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono text-paper/50 uppercase tracking-wider mb-3">Account</h4>
                    <div className="space-y-2">
                      <Link to="/login" className="block text-xs text-paper/40 hover:text-paper transition-colors">Log In</Link>
                      <Link to="/signup" className="block text-xs text-paper/40 hover:text-paper transition-colors">Sign Up</Link>
                      <Link to="/college-register" className="block text-xs text-paper/40 hover:text-paper transition-colors">Register College</Link>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono text-paper/50 uppercase tracking-wider mb-3">More</h4>
                    <div className="space-y-2">
                      <Link to="/notices" className="block text-xs text-paper/40 hover:text-paper transition-colors">Notice Board</Link>
                      <Link to="/timetable" className="block text-xs text-paper/40 hover:text-paper transition-colors">Timetable</Link>
                      <Link to="/developer" className="block text-xs text-paper/40 hover:text-paper transition-colors">Developer</Link>
                      <Link to="/achievements" className="block text-xs text-paper/40 hover:text-paper transition-colors">Badges</Link>
                    </div>
                  </div>
                </div>
                <div className="border-t border-ink/20 pt-4 flex flex-col md:flex-row justify-between items-center gap-2">
                  <span className="font-mono text-[10px] text-paper/20">RECIPROCITY &copy; 2024 — Built with MERN Stack</span>
                  <span className="font-mono text-[10px] text-paper/20">Designed by <Link to="/developer" className="text-teal/60 hover:text-teal transition-colors">Shubham Mallick</Link></span>
                </div>
              </div>
            </footer>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
