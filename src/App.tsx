import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ZoomProvider } from "@/contexts/ZoomContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ZoomControls } from "@/components/layout/ZoomControls";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";
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
import ArchitectureDoc from "./pages/admin/ArchitectureDoc";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/for-universities" element={<PageTransition><ForUniversities /></PageTransition>} />
        <Route path="/university-auth" element={<PageTransition><UniversityAuth /></PageTransition>} />
        <Route path="/internships" element={<PageTransition><Internships /></PageTransition>} />
        <Route path="/internships/:id" element={<PageTransition><InternshipDetails /></PageTransition>} />
        <Route path="/companies" element={<PageTransition><Companies /></PageTransition>} />
        <Route path="/companies/:id" element={<PageTransition><CompanyDetails /></PageTransition>} />
        <Route path="/user-journey" element={<PageTransition><UserJourneyMap /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/notifications" element={<PageTransition><Notifications /></PageTransition>} />
        <Route 
          path="/company/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['company']}>
              <PageTransition><CompanyDashboard /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <PageTransition><StudentDashboard /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageTransition><AdminDashboard /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/university/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['university']}>
              <PageTransition><UniversityDashboard /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/college/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['college_coordinator']}>
              <PageTransition><CollegeDashboard /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/architecture-doc" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageTransition><ArchitectureDoc /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/architecture-documentation" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageTransition><ArchitectureDoc /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ZoomProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
          <ZoomControls />
        </TooltipProvider>
      </ZoomProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
