import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface PermissionGateProps {
  /** Single permission key or array of keys */
  permission?: string;
  permissions?: string[];
  /** If true, requires ALL permissions. Default: requires ANY */
  requireAll?: boolean;
  /** Content to show when permission is granted */
  children: React.ReactNode;
  /** If true, shows a 403 message instead of hiding. Default: hides */
  showForbidden?: boolean;
  /** Custom fallback when denied */
  fallback?: React.ReactNode;
}

/**
 * Gate component that conditionally renders children based on RBAC permissions.
 * Super Admin always passes through.
 */
export const PermissionGate = ({
  permission,
  permissions: permissionKeys,
  requireAll = false,
  children,
  showForbidden = false,
  fallback,
}: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) return null;

  let allowed = false;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (permissionKeys && permissionKeys.length > 0) {
    allowed = requireAll
      ? hasAllPermissions(permissionKeys)
      : hasAnyPermission(permissionKeys);
  } else {
    // No permission specified = always show
    allowed = true;
  }

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showForbidden) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto my-8">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to access this feature. Contact your administrator to request access.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
