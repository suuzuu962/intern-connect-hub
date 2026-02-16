import { useState } from 'react';
import { Shield, Users, Clock } from 'lucide-react';
import { RBACRoles } from './RBACRoles';
import { RBACUserRoles } from './RBACUserRoles';
import { RBACAuditLog } from './RBACAuditLog';
import { cn } from '@/lib/utils';

const SIDEBAR_ITEMS = [
  { key: 'roles', label: 'Roles', icon: Shield },
  { key: 'user-roles', label: 'User Roles', icon: Users },
  { key: 'audit-log', label: 'Audit Log', icon: Clock },
];

export const AccessControlManager = () => {
  const [activeSection, setActiveSection] = useState('roles');

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Left Sidebar */}
      <div className="w-56 shrink-0">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Access Permission
          </h3>
        </div>
        <nav className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeSection === item.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {activeSection === 'roles' && <RBACRoles />}
        {activeSection === 'user-roles' && <RBACUserRoles />}
        {activeSection === 'audit-log' && <RBACAuditLog />}
      </div>
    </div>
  );
};
