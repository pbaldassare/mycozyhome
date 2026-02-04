import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import Professionals from "@/pages/admin/Professionals";
import Clients from "@/pages/admin/Clients";
import Services from "@/pages/admin/Services";
import Bookings from "@/pages/admin/Bookings";
import Disputes from "@/pages/admin/Disputes";
import SupportCenter from "@/pages/admin/SupportCenter";
import Payments from "@/pages/admin/Payments";
import Settings from "@/pages/admin/Settings";
import ProfessionalAuth from "@/pages/professional/Auth";
import ProfessionalDashboard from "@/pages/professional/Dashboard";
import PersonalInfo from "@/pages/professional/onboarding/PersonalInfo";
import ServicesSetup from "@/pages/professional/onboarding/Services";
import AvailabilitySetup from "@/pages/professional/onboarding/Availability";
import DocumentsUpload from "@/pages/professional/onboarding/Documents";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to admin dashboard */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="professionals" element={<Professionals />} />
            <Route path="clients" element={<Clients />} />
            <Route path="services" element={<Services />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="disputes" element={<Disputes />} />
            <Route path="support" element={<SupportCenter />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Professional Routes */}
          <Route path="/professional/auth" element={<ProfessionalAuth />} />
          <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
          <Route path="/professional/onboarding/personal" element={<PersonalInfo />} />
          <Route path="/professional/onboarding/services" element={<ServicesSetup />} />
          <Route path="/professional/onboarding/availability" element={<AvailabilitySetup />} />
          <Route path="/professional/onboarding/documents" element={<DocumentsUpload />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
