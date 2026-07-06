import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Bookmark, History, BookOpen, Clock3,
  UploadCloud, FolderKanban, ScanLine, BookMarked, Tags,
  ClipboardCheck, Users, AlertTriangle, BarChart3, Megaphone,
  School, ShieldCheck, LogOut, Menu, X, Library, ScrollText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABEL, ROLES } from '../utils/roles';

const NAV_BY_ROLE = {
  [ROLES.STUDENT]: [
    { to: '/student', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/student/browse', label: 'Browse & Search', icon: Search },
    { to: '/student/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { to: '/student/history', label: 'Reading History', icon: History },
    { to: '/student/borrowing', label: 'My Borrowing', icon: BookOpen },
    { to: '/student/holds', label: 'My Holds', icon: Clock3 }
  ],
  [ROLES.TEACHER]: [
    { to: '/teacher', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/teacher/upload', label: 'Upload Resource', icon: UploadCloud },
    { to: '/teacher/manage', label: 'My Resources', icon: FolderKanban },
    { to: '/student/browse', label: 'Browse Library', icon: Search }
  ],
  [ROLES.LIBRARIAN]: [
    { to: '/librarian', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/librarian/circulation', label: 'Circulation & Scan', icon: ScanLine },
    { to: '/librarian/books', label: 'Manage Books', icon: BookMarked },
    { to: '/librarian/categories', label: 'Categories', icon: Tags },
    { to: '/librarian/resources', label: 'Approve Resources', icon: ClipboardCheck },
    { to: '/librarian/users', label: 'Manage Accounts', icon: Users },
    { to: '/librarian/overdue', label: 'Overdue Tracking', icon: AlertTriangle },
    { to: '/librarian/reports', label: 'Reports', icon: BarChart3 },
    { to: '/librarian/announcements', label: 'Announcements', icon: Megaphone }
  ],
  [ROLES.SUPERADMIN]: [
    { to: '/superadmin', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/superadmin/schools', label: 'Schools', icon: School },
    { to: '/superadmin/admins', label: 'Assign School Admins', icon: ShieldCheck },
    { to: '/superadmin/global-categories', label: 'Category Templates', icon: Tags },
    { to: '/superadmin/announcements', label: 'Platform Announcements', icon: Megaphone },
    { to: '/superadmin/audit-log', label: 'Audit Log', icon: ScrollText },
    { to: '/superadmin/reports', label: 'Platform Reports', icon: BarChart3 }
  ]
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br from-brass-500 to-stacks-600 text-parchment-50 shadow-sm shrink-0">
        <Library size={18} strokeWidth={2.25} />
      </span>
      <div className="leading-none">
        <p className="font-display text-xl leading-none">Digital Library</p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-100/55 mt-1">
          School Library System
        </p>
      </div>
    </div>
  );
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

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
      <div className="px-5 py-6 border-b border-parchment-50/10">
        <Logo />
      </div>
      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, end, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `spine-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} strokeWidth={2} className="shrink-0 opacity-80" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-parchment-50/10">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-parchment-50/10 text-parchment-50 font-display text-sm shrink-0">
            {initials(profile?.name)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile?.name}</p>
            <p className="text-[10px] font-mono uppercase tracking-wide text-parchment-100/55">
              {ROLE_LABEL[role]}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide text-parchment-100/70 hover:text-white transition-colors"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-parchment-50">
      {/* Sidebar styled like a shelf of book spines */}
      <aside className="hidden md:flex w-64 shrink-0 bg-gradient-to-b from-stacks-800 to-stacks-700 text-parchment-100 flex-col shadow-xl">
        {sidebar}
      </aside>

      {/* Mobile top bar + slide-over menu */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between bg-stacks-800 text-parchment-100 px-4 py-3 shadow-md">
        <Logo />
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="p-1.5 -mr-1.5">
          <Menu size={22} />
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-72 bg-gradient-to-b from-stacks-800 to-stacks-700 text-parchment-100 flex flex-col shadow-2xl">
            <div className="flex justify-end px-3 pt-3">
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-1.5 text-parchment-100/70 hover:text-white">
                <X size={20} />
              </button>
            </div>
            {sidebar}
          </div>
          <button
            className="flex-1 bg-ink-900/50 backdrop-blur-[1px]"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      <main className="flex-1 min-w-0 pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto px-6 py-8 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  );
}

