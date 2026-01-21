import { db, dateToTimestamp, generateId } from './sqlite';

export type Role = 'ADMIN' | 'STAFF' | 'VIEWER' | 'CUSTOMER';

export interface Permission {
  canViewDashboard: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageUsers: boolean;
  canManageInventory: boolean;
  canViewFinance: boolean;
  canExportData: boolean;
  canManageSettings: boolean;
  canRefundOrders: boolean;
  canDeleteProducts: boolean;
  canBanUsers: boolean;
}

// Define permissions for each role
const rolePermissions: Record<Role, Permission> = {
  ADMIN: {
    canViewDashboard: true,
    canManageProducts: true,
    canManageOrders: true,
    canManageUsers: true,
    canManageInventory: true,
    canViewFinance: true,
    canExportData: true,
    canManageSettings: true,
    canRefundOrders: true,
    canDeleteProducts: true,
    canBanUsers: true,
  },
  STAFF: {
    canViewDashboard: true,
    canManageProducts: true,
    canManageOrders: true,
    canManageUsers: false,
    canManageInventory: true,
    canViewFinance: false,
    canExportData: false,
    canManageSettings: false,
    canRefundOrders: false,
    canDeleteProducts: false,
    canBanUsers: false,
  },
  VIEWER: {
    canViewDashboard: true,
    canManageProducts: false,
    canManageOrders: false,
    canManageUsers: false,
    canManageInventory: false,
    canViewFinance: true,
    canExportData: true,
    canManageSettings: false,
    canRefundOrders: false,
    canDeleteProducts: false,
    canBanUsers: false,
  },
  CUSTOMER: {
    canViewDashboard: false,
    canManageProducts: false,
    canManageOrders: false,
    canManageUsers: false,
    canManageInventory: false,
    canViewFinance: false,
    canExportData: false,
    canManageSettings: false,
    canRefundOrders: false,
    canDeleteProducts: false,
    canBanUsers: false,
  },
};

export function getPermissions(role: Role): Permission {
  return rolePermissions[role] || rolePermissions.CUSTOMER;
}

export function hasPermission(role: Role, permission: keyof Permission): boolean {
  const permissions = getPermissions(role);
  return permissions[permission];
}

export function isAdminRole(role?: string): role is 'ADMIN' | 'STAFF' | 'VIEWER' {
  return role === 'ADMIN' || role === 'STAFF' || role === 'VIEWER';
}

export function requirePermission(role: Role, permission: keyof Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

// Activity logging
export async function logActivity(data: {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  const id = generateId();
  const now = dateToTimestamp(new Date());
  
  db.prepare(`
    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.userId,
    data.action,
    data.entityType || null,
    data.entityId || null,
    data.details || null,
    data.ipAddress || null,
    now
  );
}

// Helper to get user by email with role
export function getUserByEmail(email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

// Helper to check if user is disabled
export function isUserDisabled(email: string): boolean {
  const user = getUserByEmail(email);
  return user?.disabled === 1;
}

// Helper to get user role
export function getUserRole(email: string): Role {
  const user = getUserByEmail(email);
  return (user?.role as Role) || 'CUSTOMER';
}
