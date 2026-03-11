import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Mapping from role_permissions feature_keys to permission keys.
 * When a role-level feature is disabled, the corresponding permission keys are revoked.
 */
const FEATURE_TO_PERMISSION_MAP: Record<string, string[]> = {
  view_students: ['student.view', 'student.view_contact', 'student.view_resume', 'student.export'],
  manage_colleges: ['college.manage', 'college.create', 'college.edit', 'college.delete', 'college.view', 'college.assign_coordinator'],
  view_coordinators: ['coordinator.view', 'coordinator.create', 'coordinator.edit', 'coordinator.delete', 'coordinator.approve', 'coordinator.suspend'],
  view_internships: ['internship.view_own', 'internship.view_all'],
  apply_internships: ['application.view'],
  view_companies: ['company.view'],
  diary_entries: ['activity.add', 'activity.edit_own', 'diary.view'],
  post_internships: ['internship.create', 'internship.edit', 'internship.publish', 'internship.close'],
  view_applications: ['application.view', 'application.shortlist', 'application.reject', 'application.select', 'application.export'],
  approve_diary: ['activity.review', 'activity.mark_reviewed', 'diary.approve', 'diary.reject', 'diary.add_remarks'],
  view_students_coord: ['student.view', 'student.view_contact'],
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
 * Permission hook that checks:
 * 1. Role-level feature toggles (role_permissions table)
 * 2. User-level feature overrides (user_permissions table)
 *
 * Admin role always has full access.
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

    // Admin always has full access
    if (role === 'admin') {
      const { data: allPerms } = await supabase.from('permissions').select('key');
      if (allPerms) {
        setPermissions(new Set((allPerms as { key: string }[]).map(p => p.key)));
      }
      setLoading(false);
      return;
    }

    // Fetch role-level and user-level permissions in parallel
    const [rolePermsResult, userPermsResult, allPermsResult] = await Promise.all([
      role
        ? supabase.from('role_permissions').select('feature_key, is_enabled').eq('role', role)
        : Promise.resolve({ data: null }),
      supabase.from('user_permissions').select('feature_key, is_enabled').eq('user_id', user.id),
      supabase.from('permissions').select('id, key'),
    ]);

    // Start with all permissions granted by default
    const allPermsMap = new Map<string, string>();
    const grantedKeys = new Set<string>();
    if (allPermsResult.data) {
      for (const p of allPermsResult.data as { id: string; key: string }[]) {
        allPermsMap.set(p.id, p.key);
        grantedKeys.add(p.key);
      }
    }

    // Apply role-level feature toggles - deny disabled features
    const deniedByRoleFeatures = new Set<string>();
    const roleFeatureToggles = rolePermsResult.data as { feature_key: string; is_enabled: boolean }[] | null;
    if (roleFeatureToggles) {
      for (const toggle of roleFeatureToggles) {
        if (!toggle.is_enabled) {
          const mappedKeys = FEATURE_TO_PERMISSION_MAP[toggle.feature_key];
          if (mappedKeys) {
            for (const key of mappedKeys) deniedByRoleFeatures.add(key);
          }
          deniedByRoleFeatures.add(`feature:${toggle.feature_key}`);
        }
      }
    }

    // Apply user-level overrides
    const userOverrides = userPermsResult.data as { feature_key: string; is_enabled: boolean }[] | null;
    if (userOverrides) {
      for (const uo of userOverrides) {
        const mappedKeys = FEATURE_TO_PERMISSION_MAP[uo.feature_key];
        if (uo.is_enabled) {
          deniedByRoleFeatures.delete(`feature:${uo.feature_key}`);
          if (mappedKeys) mappedKeys.forEach(k => deniedByRoleFeatures.delete(k));
        } else {
          deniedByRoleFeatures.add(`feature:${uo.feature_key}`);
          if (mappedKeys) mappedKeys.forEach(k => deniedByRoleFeatures.add(k));
        }
      }
    }

    for (const denied of deniedByRoleFeatures) grantedKeys.delete(denied);

    setPermissions(grantedKeys);
    setLoading(false);
  }, [user, role]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const hasPermission = useCallback(
    (permissionKey: string): boolean => role === 'admin' ? true : permissions.has(permissionKey),
    [permissions, role]
  );

  const hasAnyPermission = useCallback(
    (permissionKeys: string[]): boolean => role === 'admin' ? true : permissionKeys.some(key => permissions.has(key)),
    [permissions, role]
  );

  const hasAllPermissions = useCallback(
    (permissionKeys: string[]): boolean => role === 'admin' ? true : permissionKeys.every(key => permissions.has(key)),
    [permissions, role]
  );

  return { permissions, loading, hasPermission, hasAnyPermission, hasAllPermissions, refetch: fetchPermissions };
};
