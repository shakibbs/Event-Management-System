import { User } from '../types';

/**
 * Get all permission names for a user
 * Dynamically reads from user's role permissions from backend
 */
export function getUserPermissions(user: User | null): string[] {
  console.log('getUserPermissions called with user:', user);
  
  if (!user || !user.role) {
    console.log('No user or role found');
    return [];
  }
  
  // Handle both string role and object role with permissions
  if (typeof user.role === 'string') {
    console.log('Role is a string:', user.role);
    return [];
  }
  
  if (user.role && typeof user.role === 'object' && 'permissions' in user.role) {
    const permissions = user.role.permissions;
    console.log('Found permissions in role:', permissions);
    
    if (Array.isArray(permissions)) {
      const permissionNames = permissions.map((p: any) => p.name || p);
      console.log('Mapped permission names:', permissionNames);
      return permissionNames;
    }
  }
  
  console.log('No permissions array found');
  return [];
}

/**
 * Check if user has a specific permission
 * This is dynamic - no hardcoded permission checks
 */
export function hasPermission(user: User | null, permissionName: string): boolean {
  console.log(`Checking permission: ${permissionName}`);
  const permissions = getUserPermissions(user);
  const result = permissions.includes(permissionName);
  console.log(`Permission "${permissionName}" check result:`, result);
  return result;
}

/**
 * Check multiple permissions (user must have at least one)
 */
export function hasAnyPermission(user: User | null, permissionNames: string[]): boolean {
  const permissions = getUserPermissions(user);
  return permissionNames.some(name => permissions.includes(name));
}

/**
 * Check if user has all permissions
 */
export function hasAllPermissions(user: User | null, permissionNames: string[]): boolean {
  const permissions = getUserPermissions(user);
  return permissionNames.every(name => permissions.includes(name));
}

// Helper functions for role names (still useful for logging/display)
export function getRoleName(user: User | null): string {
  if (!user) return '';
  
  if (typeof user.role === 'string') {
    return user.role.toLowerCase();
  }
  
  if (user.role && typeof user.role === 'object' && 'name' in user.role) {
    return user.role.name.toLowerCase();
  }
  
  return '';
}

export function isSuperAdmin(user: User | null): boolean {
  return getRoleName(user) === 'superadmin';
}

export function isAdmin(user: User | null): boolean {
  const role = getRoleName(user);
  return role === 'admin' || role === 'superadmin';
}

export function isAttendee(user: User | null): boolean {
  return getRoleName(user) === 'attendee';
}
