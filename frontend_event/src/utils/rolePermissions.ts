import { User } from '../types';
import { logger } from '../lib/logger';

// Cache for user permissions to avoid repeated computations
let permissionCache: Map<string, string[]> = new Map();

/**
 * Get all permission names for a user
 * Dynamically reads from user's role permissions from backend
 * Results are cached to improve performance
 */
export function getUserPermissions(user: User | null): string[] {
  // Create a cache key based on user ID and role ID
  const cacheKey = user?.id && user?.role ? `${user.id}_${typeof user.role === 'object' ? user.role.id : user.role}` : 'none';
  
  // Return cached result if available
  if (permissionCache.has(cacheKey)) {
    logger.debug('Using cached permissions for user:', cacheKey);
    return permissionCache.get(cacheKey) || [];
  }
  
  logger.debug('Computing permissions for user:', cacheKey);
  
  if (!user || !user.role) {
    logger.debug('No user or role found');
    permissionCache.set(cacheKey, []);
    return [];
  }
  
  // Handle both string role and object role with permissions
  if (typeof user.role === 'string') {
    logger.debug('Role is a string:', user.role);
    permissionCache.set(cacheKey, []);
    return [];
  }
  
  if (user.role && typeof user.role === 'object' && 'permissions' in user.role) {
    const permissions = user.role.permissions;
    logger.debug('Found permissions in role:', permissions);
    
    if (Array.isArray(permissions)) {
      const permissionNames = permissions.map((p: any) => p.name || p);
      logger.debug('Mapped permission names:', permissionNames);
      permissionCache.set(cacheKey, permissionNames);
      return permissionNames;
    }
  }
  
  logger.debug('No permissions array found');
  permissionCache.set(cacheKey, []);
  return [];
}

/**
 * Check if user has a specific permission
 * This is dynamic - no hardcoded permission checks
 */
export function hasPermission(user: User | null, permissionName: string): boolean {
  logger.debug(`Checking permission: ${permissionName}`);
  const permissions = getUserPermissions(user);
  const result = permissions.includes(permissionName);
  logger.debug(`Permission "${permissionName}" check result:`, result);
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

/**
 * Clear the permission cache when user logs out
 */
export function clearPermissionCache(): void {
  permissionCache.clear();
  logger.debug('Permission cache cleared');
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
