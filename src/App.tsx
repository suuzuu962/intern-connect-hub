import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ZoomProvider } from "@/contexts/ZoomContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ZoomControls } from "@/components/layout/ZoomControls";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UniversityAuth from "./pages/UniversityAuth";
import ForUniversities from "./pages/ForUniversities";
import Internships from "./pages/Internships";
import InternshipDetails from "./pages/InternshipDetails";
import Companies from "./pages/Companies";
import CompanyDetails from "./pages/CompanyDetails";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Notifications from "./pages/Notifications";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UniversityDashboard from "./pages/university/UniversityDashboard";

import CollegeDashboard from "./pages/college/CollegeDashboard";
import UserJourneyMap from "./pages/UserJourneyMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ZoomProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/for-universities" element={<ForUniversities />} />
              <Route path="/university-auth" element={<UniversityAuth />} />
              <Route path="/internships" element={<Internships />} />
              <Route path="/internships/:id" element={<InternshipDetails />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/:id" element={<CompanyDetails />} />
              <Route path="/user-journey" element={<UserJourneyMap />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route 
                path="/company/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['company']}>
                    <CompanyDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/university/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['university']}>
                    <UniversityDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/college/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['college_coordinator']}>
                    <CollegeDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <ZoomControls />
        </TooltipProvider>
      </ZoomProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;