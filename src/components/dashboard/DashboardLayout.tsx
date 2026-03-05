import { ReactNode } from 'react';
import { Layout } from '@/components/layout/Layout';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export const DashboardLayout = ({ sidebar, children }: DashboardLayoutProps) => {
  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {sidebar}
        <main className="flex-1 p-6 overflow-auto bg-background page-transition">
          {children}
        </main>
      </div>
    </Layout>
  );
};
