import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import { ROLES, ROLE_HOME } from './utils/roles';

import Login from './pages/Login';
import Register from './pages/Register';
import BookDetail from './pages/BookDetail';
import ResourceDetail from './pages/ResourceDetail';

import StudentDashboard from './pages/student/StudentDashboard';
import BrowseBooks from './pages/student/BrowseBooks';
import Bookmarks from './pages/student/Bookmarks';
import ReadingHistory from './pages/student/ReadingHistory';
import MyBorrowing from './pages/student/MyBorrowing';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import UploadResource from './pages/teacher/UploadResource';
import ManageResources from './pages/teacher/ManageResources';

import LibrarianDashboard from './pages/librarian/LibrarianDashboard';
import ManageBooks from './pages/librarian/ManageBooks';
import ManageCategories from './pages/librarian/ManageCategories';
import ApproveResources from './pages/librarian/ApproveResources';
import ManageUsers from './pages/librarian/ManageUsers';
import Circulation from './pages/librarian/Circulation';
import OverdueTracking from './pages/librarian/OverdueTracking';
import Reports from './pages/librarian/Reports';
import Announcements from './pages/librarian/Announcements';

import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import ManageSchools from './pages/superadmin/ManageSchools';
import AssignAdmins from './pages/superadmin/AssignAdmins';
import PlatformReports from './pages/superadmin/PlatformReports';

export default function App() {
  const { firebaseUser, role, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={firebaseUser ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={firebaseUser ? <Navigate to="/" /> : <Register />} />

      <Route path="/" element={
        loading ? <SplashLoading /> : firebaseUser ? <Navigate to={ROLE_HOME[role] || '/login'} /> : <Navigate to="/login" />
      } />

      <Route path="/book/:id" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
      <Route path="/resource/:id" element={<ProtectedRoute><ResourceDetail /></ProtectedRoute>} />

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute requiredRole={ROLES.STUDENT}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/browse" element={<ProtectedRoute requiredRole={ROLES.STUDENT}><BrowseBooks /></ProtectedRoute>} />
      <Route path="/student/bookmarks" element={<ProtectedRoute requiredRole={ROLES.STUDENT}><Bookmarks /></ProtectedRoute>} />
      <Route path="/student/history" element={<ProtectedRoute requiredRole={ROLES.STUDENT}><ReadingHistory /></ProtectedRoute>} />
      <Route path="/student/borrowing" element={<ProtectedRoute requiredRole={ROLES.STUDENT}><MyBorrowing /></ProtectedRoute>} />

      {/* Teacher */}
      <Route path="/teacher" element={<ProtectedRoute requiredRole={ROLES.TEACHER}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/upload" element={<ProtectedRoute requiredRole={ROLES.TEACHER}><UploadResource /></ProtectedRoute>} />
      <Route path="/teacher/manage" element={<ProtectedRoute requiredRole={ROLES.TEACHER}><ManageResources /></ProtectedRoute>} />

      {/* Librarian / Admin */}
      <Route path="/librarian" element={<ProtectedRoute requiredRole={ROLES.LIBRARIAN}><LibrarianDashboard /></ProtectedRoute>} />
      <Route path="/librarian/books" element={<ProtectedRoute requiredRole={ROLES.LIBRARIAN}><ManageBooks /></ProtectedRoute>} />
      <Route path="/librarian/categories" element={<ProtectedRoute requiredRole={ROLES.LIBRARIAN}><ManageCategories /></ProtectedRoute>} />
      <Route path="/librarian/resources" element={<ProtectedRoute requiredRole={ROLES.LIBRARIAN}><ApproveResources /></ProtectedRoute>} />
      <Route path="/librarian/users" element={<ProtectedRoute requiredRole={ROLES.LIBRARIAN}><ManageUsers /></ProtectedRoute>} />
      <Route path="/librarian/circulation" element={<ProtectedRoute requiredRole={ROLES.LIBRARIAN}><Circulation /></ProtectedRoute>} />
      <Route path="/librarian/overdue" element={<ProtectedRoute requiredRole={ROLES.LIBRARIAN}><OverdueTracking /></ProtectedRoute>} />
      <Route path="/librarian/reports" element={<ProtectedRoute requiredRole={ROLES.LIBRARIAN}><Reports /></ProtectedRoute>} />
      <Route path="/librarian/announcements" element={<ProtectedRoute requiredRole={ROLES.LIBRARIAN}><Announcements /></ProtectedRoute>} />

      {/* Super Admin */}
      <Route path="/superadmin" element={<ProtectedRoute requiredRole={ROLES.SUPERADMIN}><SuperAdminDashboard /></ProtectedRoute>} />
      <Route path="/superadmin/schools" element={<ProtectedRoute requiredRole={ROLES.SUPERADMIN}><ManageSchools /></ProtectedRoute>} />
      <Route path="/superadmin/admins" element={<ProtectedRoute requiredRole={ROLES.SUPERADMIN}><AssignAdmins /></ProtectedRoute>} />
      <Route path="/superadmin/reports" element={<ProtectedRoute requiredRole={ROLES.SUPERADMIN}><PlatformReports /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function SplashLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment-50">
      <p className="font-mono text-sm text-ink-500 animate-pulse">Opening the reading room…</p>
    </div>
  );
}
