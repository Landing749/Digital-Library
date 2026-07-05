import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABEL, ROLES } from '../utils/roles';

const NAV_BY_ROLE = {
  [ROLES.STUDENT]: [
    { to: '/student', label: 'Dashboard', end: true },
    { to: '/student/browse', label: 'Browse & Search' },
    { to: '/student/bookmarks', label: 'Bookmarks' },
    { to: '/student/history', label: 'Reading History' },
    { to: '/student/borrowing', label: 'My Borrowing' }
  ],
  [ROLES.TEACHER]: [
    { to: '/teacher', label: 'Dashboard', end: true },
    { to: '/teacher/upload', label: 'Upload Resource' },
    { to: '/teacher/manage', label: 'My Resources' },
    { to: '/student/browse', label: 'Browse Library' }
  ],
  [ROLES.LIBRARIAN]: [
    { to: '/librarian', label: 'Dashboard', end: true },
    { to: '/librarian/circulation', label: 'Circulation & Scan' },
    { to: '/librarian/books', label: 'Manage Books' },
    { to: '/librarian/categories', label: 'Categories' },
    { to: '/librarian/resources', label: 'Approve Resources' },
    { to: '/librarian/users', label: 'Manage Accounts' },
    { to: '/librarian/overdue', label: 'Overdue Tracking' },
    { to: '/librarian/reports', label: 'Reports' },
    { to: '/librarian/announcements', label: 'Announcements' }
  ],
  [ROLES.SUPERADMIN]: [
    { to: '/superadmin', label: 'Dashboard', end: true },
    { to: '/superadmin/schools', label: 'Schools' },
    { to: '/superadmin/admins', label: 'Assign School Admins' },
    { to: '/superadmin/reports', label: 'Platform Reports' }
  ]
};

export default function AppShell({ children }) {
  const { profile, role, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV_BY_ROLE[role] || [];
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const sidebar = (
    <>
      <div className="px-5 py-6 border-b border-stacks-600/60">
        <p className="font-display text-2xl leading-none">Athenaeum</p>
        <p className="text-[11px] font-mono uppercase tracking-widest text-parchment-100/60 mt-1">
          School Digital Library
        </p>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `spine-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-stacks-600/60">
        <p className="text-sm font-medium truncate">{profile?.name}</p>
        <p className="text-[11px] font-mono uppercase tracking-wide text-parchment-100/60">
          {ROLE_LABEL[role]}
        </p>
        <button onClick={handleLogout} className="mt-3 text-xs font-mono uppercase tracking-wide text-parchment-100/70 hover:text-white">
          Sign out →
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-parchment-50">
      {/* Sidebar styled like a shelf of book spines */}
      <aside className="hidden md:flex w-64 shrink-0 bg-stacks-800 text-parchment-100 flex-col">
        {sidebar}
      </aside>

      {/* Mobile top bar + slide-over menu */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between bg-stacks-800 text-parchment-100 px-4 py-3">
        <p className="font-display text-lg">Athenaeum</p>
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="text-2xl leading-none">☰</button>
      </div>
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-72 bg-stacks-800 text-parchment-100 flex flex-col">{sidebar}</div>
          <button
            className="flex-1 bg-ink-900/50"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto px-6 py-8 md:px-10">{children}</div>
      </main>
    </div>
  );
}
