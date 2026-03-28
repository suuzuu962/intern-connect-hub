import { ReactNode } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DashboardBreadcrumb } from './DashboardBreadcrumb';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  /** Label for the dashboard type, e.g. "Admin", "Student" */
  dashboardLabel?: string;
  /** Label for the current active section */
  activeLabel?: string;
  /** Called when the dashboard breadcrumb link is clicked */
  onDashboardClick?: () => void;
}

export const DashboardLayout = ({ sidebar, children, dashboardLabel, activeLabel, onDashboardClick }: DashboardLayoutProps) => {
  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {sidebar}
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-background page-transition">
          {dashboardLabel && activeLabel && (
            <DashboardBreadcrumb
              dashboardLabel={dashboardLabel}
              activeLabel={activeLabel}
              onDashboardClick={onDashboardClick}
            />
          )}
          {children}
        </main>
      </div>
    </Layout>
  );
};
