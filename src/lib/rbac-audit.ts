import { supabase } from '@/integrations/supabase/client';

export type RBACAction =
  | 'role_created'
  | 'role_updated'
  | 'role_deleted'
  | 'role_duplicated'
  | 'permission_granted'
  | 'permission_revoked'
  | 'permissions_bulk_granted'
  | 'permissions_bulk_revoked'
  | 'user_role_assigned'
  | 'user_role_removed';

export type RBACEntityType = 'custom_role' | 'custom_role_permission' | 'user_custom_role';

interface AuditLogParams {
  action: RBACAction;
  entityType: RBACEntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
}

export const logRBACAction = async ({
  action,
  entityType,
  entityId,
  entityName,
  details = {},
}: AuditLogParams) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('rbac_audit_logs').insert({
    performed_by: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    details,
  } as any);
};
