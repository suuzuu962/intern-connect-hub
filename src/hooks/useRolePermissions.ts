import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RolePermission {
  feature_key: string;
  is_enabled: boolean;
  settings: Record<string, unknown>;
  visible_fields: string[];
  hidden_fields: string[];
}

interface UseRolePermissionsReturn {
  permissions: RolePermission[];
  loading: boolean;
  isFeatureEnabled: (featureKey: string) => boolean;
  getFeatureSettings: (featureKey: string) => Record<string, unknown>;
  refetch: () => void;
}

/**
 * Hook to check role-level feature permissions from the role_permissions table.
 * Also checks user_permissions for individual overrides.
 */
export const useRolePermissions = (): UseRolePermissionsReturn => {
  const { user, role } = useAuth();
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [userOverrides, setUserOverrides] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user || !role) {
      setRolePermissions([]);
      setUserOverrides([]);
      setLoading(false);
      return;
    }

    // Admin always has full access
    if (role === 'admin') {
      setLoading(false);
      return;
    }

    // Fetch role-level and user-level permissions in parallel
    const [roleResult, userResult] = await Promise.all([
      supabase
        .from('role_permissions')
        .select('feature_key, is_enabled, settings, visible_fields, hidden_fields')
        .eq('role', role),
      supabase
        .from('user_permissions')
        .select('feature_key, is_enabled, settings, visible_fields, hidden_fields')
        .eq('user_id', user.id),
    ]);

    if (roleResult.data) {
      setRolePermissions(roleResult.data as unknown as RolePermission[]);
    }
    if (userResult.data) {
      setUserOverrides(userResult.data as unknown as RolePermission[]);
    }

    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const isFeatureEnabled = useCallback(
    (featureKey: string): boolean => {
      if (role === 'admin') return true;

      // Check user-level override first
      const userOverride = userOverrides.find(p => p.feature_key === featureKey);
      if (userOverride) return userOverride.is_enabled;

      // Check role-level permission
      const rolePerm = rolePermissions.find(p => p.feature_key === featureKey);
      if (rolePerm) return rolePerm.is_enabled;

      // Default: enabled if no record exists
      return true;
    },
    [rolePermissions, userOverrides, role]
  );

  const getFeatureSettings = useCallback(
    (featureKey: string): Record<string, unknown> => {
      const userOverride = userOverrides.find(p => p.feature_key === featureKey);
      if (userOverride?.settings) return userOverride.settings;

      const rolePerm = rolePermissions.find(p => p.feature_key === featureKey);
      return rolePerm?.settings || {};
    },
    [rolePermissions, userOverrides]
  );

  return {
    permissions: rolePermissions,
    loading,
    isFeatureEnabled,
    getFeatureSettings,
    refetch: fetchPermissions,
  };
};
