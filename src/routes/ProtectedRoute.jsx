import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasAtLeastRole } from '../utils/roles';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { firebaseUser, profile, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-50">
        <p className="font-mono text-sm text-ink-500 animate-pulse">Checking your library card…</p>
      </div>
    );
  }

  if (!firebaseUser) return <Navigate to="/login" replace />;

  if (profile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-50 px-6">
        <div className="max-w-md text-center space-y-2">
          <p className="font-display text-xl text-ink-900">No account record found</p>
          <p className="text-ink-500 text-sm">
            You're signed in, but no library profile exists for this account yet.
            Ask your librarian/admin to add you, or contact support.
          </p>
        </div>
      </div>
    );
  }

  if (profile?.status === 'archived') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-50 px-6">
        <p className="text-overdue-600 font-medium">This account has been deactivated. Contact your librarian.</p>
      </div>
    );
  }

  if (requiredRole && !hasAtLeastRole(role, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-50 px-6">
        <p className="text-ink-700">You don't have permission to view this page.</p>
      </div>
    );
  }

  return children;
}
