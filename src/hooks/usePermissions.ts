import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Mapping from role_permissions feature_keys to custom RBAC permission keys.
 * When a role-level feature is disabled, the corresponding permission keys are revoked.
 */
const FEATURE_TO_PERMISSION_MAP: Record<string, string[]> = {
  // University features
  view_students: ['student.view', 'internship.view_all'],
  manage_colleges: ['college.manage'],
  view_coordinators: ['coordinator.view'],
  // Student features
  view_internships: ['internship.view_own', 'internship.view_all'],
  apply_internships: ['application.view'],
  view_companies: [],
  diary_entries: ['activity.add', 'activity.edit_own'],
  // Company features
  post_internships: ['internship.create', 'internship.edit', 'internship.publish'],
  view_applications: ['application.view', 'application.shortlist', 'application.reject', 'application.select'],
  // Coordinator features
  approve_diary: ['activity.review', 'activity.mark_reviewed'],
};

interface UsePermissionsReturn {
  permissions: Set<string>;
  loading: boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  refetch: () => void;
}

/**
 * Unified permission hook that checks:
 * 1. Custom RBAC permissions (custom_roles → permissions)
 * 2. Role-level feature toggles (role_permissions table)
 * 3. User-level feature overrides (user_permissions table)
 *
 * Super Admin (app_role = 'admin') always has full access.
 */
export const usePermissions = (): UsePermissionsReturn => {
  const { user, role } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }

    // Super admin always has full access
    if (role === 'admin') {
      const { data: allPerms } = await supabase
        .from('permissions')
        .select('key');
      
      if (allPerms) {
        setPermissions(new Set((allPerms as { key: string }[]).map(p => p.key)));
      }
      setLoading(false);
      return;
    }

    // Fetch all data in parallel
    const [customRolesResult, rolePermsResult, userPermsResult, allPermsResult] = await Promise.all([
      // 1. Custom RBAC: user's assigned role IDs
      supabase
        .from('user_custom_roles')
        .select('role_id')
        .eq('user_id', user.id),
      // 2. Role-level feature toggles
      role
        ? supabase
            .from('role_permissions')
            .select('feature_key, is_enabled')
            .eq('role', role)
        : Promise.resolve({ data: null }),
      // 3. User-level feature overrides
      supabase
        .from('user_permissions')
        .select('feature_key, is_enabled')
        .eq('user_id', user.id),
      // 4. All permission keys (for building the set)
      supabase
        .from('permissions')
        .select('id, key'),
    ]);

    // --- Build the base permission set from custom RBAC roles ---
    let grantedKeys = new Set<string>();
    const allPermsMap = new Map<string, string>();
    if (allPermsResult.data) {
      for (const p of allPermsResult.data as { id: string; key: string }[]) {
        allPermsMap.set(p.id, p.key);
      }
    }

    const userRoles = customRolesResult.data as { role_id: string }[] | null;
    if (userRoles && userRoles.length > 0) {
      const roleIds = userRoles.map(r => r.role_id);

      const { data: rolePerms } = await supabase
        .from('custom_role_permissions')
        .select('permission_id')
        .in('role_id', roleIds);

      if (rolePerms) {
        for (const rp of rolePerms as { permission_id: string }[]) {
          const key = allPermsMap.get(rp.permission_id);
          if (key) grantedKeys.add(key);
        }
      }
    }

    // --- Apply role-level feature toggles ---
    // Build a set of permission keys that are DENIED by disabled role features
    const deniedByRoleFeatures = new Set<string>();
    const roleFeatureToggles = rolePermsResult.data as { feature_key: string; is_enabled: boolean }[] | null;
    if (roleFeatureToggles) {
      for (const toggle of roleFeatureToggles) {
        if (!toggle.is_enabled) {
          const mappedKeys = FEATURE_TO_PERMISSION_MAP[toggle.feature_key];
          if (mappedKeys) {
            for (const key of mappedKeys) {
              deniedByRoleFeatures.add(key);
            }
          }
          // Also deny the feature_key itself as a pseudo-permission
          deniedByRoleFeatures.add(`feature:${toggle.feature_key}`);
        }
      }
    }

    // --- Apply user-level overrides (override both role features and RBAC) ---
    const userOverrides = userPermsResult.data as { feature_key: string; is_enabled: boolean }[] | null;
    const userOverrideMap = new Map<string, boolean>();
    if (userOverrides) {
      for (const uo of userOverrides) {
        userOverrideMap.set(uo.feature_key, uo.is_enabled);
      }
    }

    // Re-evaluate: user overrides can re-enable features disabled at role level
    if (userOverrideMap.size > 0) {
      for (const [featureKey, isEnabled] of userOverrideMap) {
        const mappedKeys = FEATURE_TO_PERMISSION_MAP[featureKey];
        if (isEnabled) {
          // User override re-enables → remove from denied set
          deniedByRoleFeatures.delete(`feature:${featureKey}`);
          if (mappedKeys) {
            for (const key of mappedKeys) {
              deniedByRoleFeatures.delete(key);
            }
          }
        } else {
          // User override disables → add to denied set
          deniedByRoleFeatures.add(`feature:${featureKey}`);
          if (mappedKeys) {
            for (const key of mappedKeys) {
              deniedByRoleFeatures.add(key);
            }
          }
        }
      }
    }

    // Remove denied permissions from granted set
    for (const denied of deniedByRoleFeatures) {
      grantedKeys.delete(denied);
    }

    setPermissions(grantedKeys);
    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (permissionKey: string): boolean => {
      if (role === 'admin') return true;
      return permissions.has(permissionKey);
    },
    [permissions, role]
  );

  const hasAnyPermission = useCallback(
    (permissionKeys: string[]): boolean => {
      if (role === 'admin') return true;
      return permissionKeys.some(key => permissions.has(key));
    },
    [permissions, role]
  );

  const hasAllPermissions = useCallback(
    (permissionKeys: string[]): boolean => {
      if (role === 'admin') return true;
      return permissionKeys.every(key => permissions.has(key));
    },
    [permissions, role]
  );

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };
};
