import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UsePermissionsReturn {
  permissions: Set<string>;
  loading: boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  refetch: () => void;
}

/**
 * Hook to check custom RBAC permissions for the current user.
 * Fetches all permission keys from the user's assigned custom roles.
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
      // Fetch all permission keys so hasPermission always returns true
      const { data: allPerms } = await supabase
        .from('permissions')
        .select('key');
      
      if (allPerms) {
        setPermissions(new Set((allPerms as { key: string }[]).map(p => p.key)));
      }
      setLoading(false);
      return;
    }

    // Fetch user's custom role IDs
    const { data: userRoles } = await supabase
      .from('user_custom_roles')
      .select('role_id')
      .eq('user_id', user.id);

    if (!userRoles || userRoles.length === 0) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }

    const roleIds = (userRoles as { role_id: string }[]).map(r => r.role_id);

    // Fetch permission IDs for those roles
    const { data: rolePerms } = await supabase
      .from('custom_role_permissions')
      .select('permission_id')
      .in('role_id', roleIds);

    if (!rolePerms || rolePerms.length === 0) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }

    const permIds = (rolePerms as { permission_id: string }[]).map(rp => rp.permission_id);

    // Fetch permission keys
    const { data: perms } = await supabase
      .from('permissions')
      .select('key')
      .in('id', permIds);

    if (perms) {
      setPermissions(new Set((perms as { key: string }[]).map(p => p.key)));
    }

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
