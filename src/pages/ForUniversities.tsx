import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

const ForUniversities = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Redirect all users to appropriate destination
  if (user && role === 'university') {
    return <Navigate to="/university/dashboard" replace />;
  }

  // Redirect to auth for non-authenticated users
  return <Navigate to="/auth?mode=signup&role=university" replace />;
};

export default ForUniversities;
