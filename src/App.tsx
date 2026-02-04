import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientLayout } from "@/components/client/ClientLayout";
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
import ClientHome from "@/pages/client/Home";
import ClientSearch from "@/pages/client/Search";
import ClientBookings from "@/pages/client/Bookings";
import ClientMessages from "@/pages/client/Messages";
import ClientProfile from "@/pages/client/Profile";
import ClientChat from "@/pages/client/Chat";
import ClientDispute from "@/pages/client/Dispute";
import ClientAuth from "@/pages/client/Auth";
import ClientPersonalData from "@/pages/client/profile/PersonalData";
import ClientPaymentMethods from "@/pages/client/profile/PaymentMethods";
import ClientNotifications from "@/pages/client/profile/Notifications";
import ClientPaymentHistory from "@/pages/client/profile/PaymentHistory";
import ClientMyReviews from "@/pages/client/profile/MyReviews";
import ClientPrivacy from "@/pages/client/profile/Privacy";
import ClientSettings from "@/pages/client/profile/Settings";
import ClientPromotions from "@/pages/client/Promotions";
import SafetyCenter from "@/pages/client/SafetyCenter";
import Welcome from "@/pages/Welcome";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Welcome/Landing Page */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          
          {/* Client Routes */}
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<ClientHome />} />
            <Route path="search" element={<ClientSearch />} />
            <Route path="bookings" element={<ClientBookings />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>
          {/* Client routes outside layout (full screen) */}
          <Route path="/client/auth" element={<ClientAuth />} />
          <Route path="/client/profile/personal" element={<ClientPersonalData />} />
          <Route path="/client/profile/payments" element={<ClientPaymentMethods />} />
          <Route path="/client/profile/notifications" element={<ClientNotifications />} />
          <Route path="/client/profile/payment-history" element={<ClientPaymentHistory />} />
          <Route path="/client/profile/reviews" element={<ClientMyReviews />} />
          <Route path="/client/profile/privacy" element={<ClientPrivacy />} />
          <Route path="/client/profile/settings" element={<ClientSettings />} />
          <Route path="/client/chat/:conversationId" element={<ClientChat />} />
          <Route path="/client/dispute" element={<ClientDispute />} />
          <Route path="/client/promotions" element={<ClientPromotions />} />
          <Route path="/client/safety" element={<SafetyCenter />} />
          
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
