import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface DashboardBreadcrumbProps {
  /** e.g. "Admin", "Student", "Company", "University", "College" */
  dashboardLabel: string;
  /** Current active section label, e.g. "Org Chart", "Analytics" */
  activeLabel: string;
  /** Called when the dashboard root breadcrumb is clicked */
  onDashboardClick?: () => void;
}

export const DashboardBreadcrumb = ({
  dashboardLabel,
  activeLabel,
  onDashboardClick,
}: DashboardBreadcrumbProps) => {
  const navigate = useNavigate();

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            className="cursor-pointer flex items-center gap-1"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            className="cursor-pointer"
            onClick={onDashboardClick}
          >
            {dashboardLabel}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{activeLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
