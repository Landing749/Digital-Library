export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  LIBRARIAN: 'librarian', // school-level admin
  SUPERADMIN: 'superadmin' // platform owner, manages schools + school admins
};

// Higher number = more privilege. Used for simple gating.
export const ROLE_LEVEL = {
  [ROLES.STUDENT]: 1,
  [ROLES.TEACHER]: 2,
  [ROLES.LIBRARIAN]: 3,
  [ROLES.SUPERADMIN]: 4
};

export function hasAtLeastRole(userRole, requiredRole) {
  return (ROLE_LEVEL[userRole] || 0) >= (ROLE_LEVEL[requiredRole] || 99);
}

export function isOneOf(userRole, roles = []) {
  return roles.includes(userRole);
}

export const PERMISSIONS = {
  // books & categories
  CREATE_BOOK: [ROLES.LIBRARIAN, ROLES.SUPERADMIN],
  EDIT_BOOK: [ROLES.LIBRARIAN, ROLES.SUPERADMIN],
  ARCHIVE_BOOK: [ROLES.LIBRARIAN, ROLES.SUPERADMIN],
  MANAGE_CATEGORIES: [ROLES.LIBRARIAN, ROLES.SUPERADMIN],

  // learning resources
  UPLOAD_RESOURCE: [ROLES.TEACHER, ROLES.LIBRARIAN, ROLES.SUPERADMIN],
  APPROVE_RESOURCE: [ROLES.LIBRARIAN, ROLES.SUPERADMIN],

  // circulation
  MANAGE_CIRCULATION: [ROLES.LIBRARIAN, ROLES.SUPERADMIN],
  SCAN_BARCODE: [ROLES.LIBRARIAN, ROLES.SUPERADMIN],

  // people & reporting
  MANAGE_USERS: [ROLES.LIBRARIAN, ROLES.SUPERADMIN],
  VIEW_REPORTS: [ROLES.LIBRARIAN, ROLES.SUPERADMIN],
  MANAGE_ANNOUNCEMENTS: [ROLES.LIBRARIAN, ROLES.SUPERADMIN],

  // platform level
  MANAGE_SCHOOLS: [ROLES.SUPERADMIN],
  ASSIGN_SCHOOL_ADMINS: [ROLES.SUPERADMIN]
};

export function can(userRole, permissionKey) {
  const allowed = PERMISSIONS[permissionKey];
  if (!allowed) return false;
  return allowed.includes(userRole);
}

export const ROLE_LABEL = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.TEACHER]: 'Teacher',
  [ROLES.LIBRARIAN]: 'Librarian / Admin',
  [ROLES.SUPERADMIN]: 'Super Admin'
};

export const ROLE_HOME = {
  [ROLES.STUDENT]: '/student',
  [ROLES.TEACHER]: '/teacher',
  [ROLES.LIBRARIAN]: '/librarian',
  [ROLES.SUPERADMIN]: '/superadmin'
};
