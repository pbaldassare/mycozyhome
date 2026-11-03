import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { BlockedUserGuard } from "@/components/BlockedUserGuard";
import { ClientLayout } from "@/components/client/ClientLayout";
import { ProfessionalLayout } from "@/components/professional/ProfessionalLayout";
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Professionals = lazy(() => import("@/pages/admin/Professionals"));
const Clients = lazy(() => import("@/pages/admin/Clients"));
const Services = lazy(() => import("@/pages/admin/Services"));
const Bookings = lazy(() => import("@/pages/admin/Bookings"));
const SupportCenter = lazy(() => import("@/pages/admin/SupportCenter"));
const Payments = lazy(() => import("@/pages/admin/Payments"));
const Settings = lazy(() => import("@/pages/admin/Settings"));
const Disputes = lazy(() => import("@/pages/admin/Disputes"));
const ForgotPassword = lazy(() => import("@/pages/PasswordRecovery").then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("@/pages/PasswordRecovery").then((m) => ({ default: m.ResetPassword })));
const ProfessionalAuth = lazy(() => import("@/pages/professional/Auth"));
const ProfessionalDashboard = lazy(() => import("@/pages/professional/Dashboard"));
const ProfessionalHome = lazy(() => import("@/pages/professional/Home"));
const ProfessionalServices = lazy(() => import("@/pages/professional/Services"));
const ProfessionalReviews = lazy(() => import("@/pages/professional/Reviews"));
const ProfessionalProfile = lazy(() => import("@/pages/professional/Profile"));
const ProfessionalBookings = lazy(() => import("@/pages/professional/Bookings"));
const ProfessionalAvailability = lazy(() => import("@/pages/professional/Availability"));
const PersonalInfo = lazy(() => import("@/pages/professional/onboarding/PersonalInfo"));
const ServicesSetup = lazy(() => import("@/pages/professional/onboarding/Services"));
const AvailabilitySetup = lazy(() => import("@/pages/professional/onboarding/Availability"));
const ProfessionalMessages = lazy(() => import("@/pages/professional/Messages"));
const ProfessionalChat = lazy(() => import("@/pages/professional/Chat"));
const DocumentsUpload = lazy(() => import("@/pages/professional/onboarding/Documents"));
const ProfessionalPersonalData = lazy(() => import("@/pages/professional/profile/PersonalData"));
const ProfessionalSettings = lazy(() => import("@/pages/professional/profile/Settings"));
const ProfessionalPreferences = lazy(() => import("@/pages/professional/profile/Preferences"));
const ProfessionalFiscalData = lazy(() => import("@/pages/professional/profile/FiscalData"));
const ProfessionalEarnings = lazy(() => import("@/pages/professional/Earnings"));
const ClientHome = lazy(() => import("@/pages/client/Home"));
const ClientSearch = lazy(() => import("@/pages/client/Search"));
const ClientBookings = lazy(() => import("@/pages/client/Bookings"));
const ClientMessages = lazy(() => import("@/pages/client/Messages"));
const ClientProfile = lazy(() => import("@/pages/client/Profile"));
const ClientChat = lazy(() => import("@/pages/client/Chat"));
const ClientDispute = lazy(() => import("@/pages/client/Dispute"));
const ClientAuth = lazy(() => import("@/pages/client/Auth"));
const ClientProfessionalDetail = lazy(() => import("@/pages/client/ProfessionalDetail"));
const ClientBookingNew = lazy(() => import("@/pages/client/BookingNew"));
const ClientQuickBook = lazy(() => import("@/pages/client/QuickBook"));
const ClientBookingConfirm = lazy(() => import("@/pages/client/BookingConfirm"));
const ClientPersonalData = lazy(() => import("@/pages/client/profile/PersonalData"));
const ClientBookingDetail = lazy(() => import("@/pages/client/BookingDetail"));
const ClientPaymentMethods = lazy(() => import("@/pages/client/profile/PaymentMethods"));
const ClientNotifications = lazy(() => import("@/pages/client/profile/Notifications"));
const ClientPaymentHistory = lazy(() => import("@/pages/client/profile/PaymentHistory"));
const ClientMyReviews = lazy(() => import("@/pages/client/profile/MyReviews"));
const ClientPrivacy = lazy(() => import("@/pages/client/profile/Privacy"));
const ClientSettings = lazy(() => import("@/pages/client/profile/Settings"));
const ClientFavorites = lazy(() => import("@/pages/client/profile/Favorites"));
const ClientReceivedReviews = lazy(() => import("@/pages/client/profile/ReceivedReviews"));
const ClientPromotions = lazy(() => import("@/pages/client/Promotions"));
const SafetyCenter = lazy(() => import("@/pages/client/SafetyCenter"));
const ClientSupport = lazy(() => import("@/pages/client/Support"));
 import ClientOnboarding from "@/pages/client/Onboarding";
const ClientWelcomeStory = lazy(() => import("@/pages/client/WelcomeStory"));
const ClientNotificationsInbox = lazy(() => import("@/pages/client/Notifications"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const Login = lazy(() => import("@/pages/Login"));
const Install = lazy(() => import("@/pages/Install"));
 import ProfessionalTutorial from "@/pages/professional/Tutorial";
const ProfessionalWelcomeStory = lazy(() => import("@/pages/professional/WelcomeStory"));
const ProfessionalSupport = lazy(() => import("@/pages/professional/Support"));
const ProfessionalFavoriteClients = lazy(() => import("@/pages/professional/FavoriteClients"));
const ServiceBoard = lazy(() => import("@/pages/professional/ServiceBoard"));
const MyOffers = lazy(() => import("@/pages/professional/MyOffers"));
const ClientServiceRequests = lazy(() => import("@/pages/client/ServiceRequests"));
const ServiceRequestNew = lazy(() => import("@/pages/client/ServiceRequestNew"));
const ServiceRequestDetail = lazy(() => import("@/pages/client/ServiceRequestDetail"));
import NotFound from "./pages/NotFound";
import { InstallBanner } from "@/components/pwa/InstallBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Segna l'area (admin o app) sull'html: su desktop l'app è una colonna centrata. */
function AreaMarker() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.documentElement.dataset.area = pathname.startsWith("/admin") ? "admin" : "app";
  }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Caricamento">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <AreaMarker />
        <AppErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Welcome/Landing Page */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/install" element={<Install />} />
          
          {/* Client Routes */}
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<ClientHome />} />
            <Route path="search" element={<ClientSearch />} />
            <Route path="bookings" element={<ClientBookings />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>
          {/* Client routes outside layout (full screen) */}
          <Route path="/client/welcome" element={<ClientWelcomeStory />} />
          <Route path="/client/auth" element={<ClientAuth />} />
          <Route path="/client/professional/:id" element={<ClientProfessionalDetail />} />
          <Route path="/client/onboarding" element={<ClientOnboarding />} />
          <Route element={<RoleGuard allowedRole="client"><BlockedUserGuard userType="client"><Outlet /></BlockedUserGuard></RoleGuard>}>
            <Route path="/client/book" element={<ClientQuickBook />} />
            <Route path="/client/booking/new" element={<ClientBookingNew />} />
            <Route path="/client/booking/:id" element={<ClientBookingDetail />} />
            <Route path="/client/booking/confirm" element={<ClientBookingConfirm />} />
            <Route path="/client/profile/personal" element={<ClientPersonalData />} />
            <Route path="/client/profile/payments" element={<ClientPaymentMethods />} />
            <Route path="/client/profile/notifications" element={<ClientNotifications />} />
            <Route path="/client/profile/payment-history" element={<ClientPaymentHistory />} />
            <Route path="/client/profile/reviews" element={<ClientMyReviews />} />
            <Route path="/client/profile/privacy" element={<ClientPrivacy />} />
            <Route path="/client/profile/settings" element={<ClientSettings />} />
            <Route path="/client/profile/favorites" element={<ClientFavorites />} />
            <Route path="/client/profile/received-reviews" element={<ClientReceivedReviews />} />
            <Route path="/client/chat/:conversationId" element={<ClientChat />} />
            <Route path="/client/dispute" element={<ClientDispute />} />
            <Route path="/client/promotions" element={<ClientPromotions />} />
            <Route path="/client/safety" element={<SafetyCenter />} />
            <Route path="/client/support" element={<ClientSupport />} />
            <Route path="/client/notifications" element={<ClientNotificationsInbox />} />
            <Route path="/client/service-requests" element={<ClientServiceRequests />} />
            <Route path="/client/service-requests/new" element={<ServiceRequestNew />} />
            <Route path="/client/service-requests/:id" element={<ServiceRequestDetail />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="professionals" element={<Professionals />} />
            <Route path="clients" element={<Clients />} />
            <Route path="services" element={<Services />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="support" element={<SupportCenter />} />
            <Route path="disputes" element={<Disputes />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Professional Routes with Layout */}
          <Route path="/professional" element={<ProfessionalLayout />}>
            <Route index element={<ProfessionalHome />} />
            <Route path="bookings" element={<ProfessionalBookings />} />
            <Route path="messages" element={<ProfessionalMessages />} />
            <Route path="availability" element={<ProfessionalAvailability />} />
            <Route path="services" element={<ProfessionalServices />} />
            <Route path="reviews" element={<ProfessionalReviews />} />
            <Route path="profile" element={<ProfessionalProfile />} />
          </Route>
          {/* Professional routes outside layout (full screen) */}
          <Route path="/professional/welcome" element={<ProfessionalWelcomeStory />} />
          <Route path="/professional/auth" element={<ProfessionalAuth />} />
          <Route path="/professional/tutorial" element={<ProfessionalTutorial />} />
          <Route element={<RoleGuard allowedRole="professional"><BlockedUserGuard userType="professional"><Outlet /></BlockedUserGuard></RoleGuard>}>
            <Route path="/professional/chat/:conversationId" element={<ProfessionalChat />} />
            <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
            <Route path="/professional/onboarding/personal" element={<PersonalInfo />} />
            <Route path="/professional/onboarding/services" element={<ServicesSetup />} />
            <Route path="/professional/onboarding/availability" element={<AvailabilitySetup />} />
            <Route path="/professional/onboarding/documents" element={<DocumentsUpload />} />
            <Route path="/professional/profile/personal" element={<ProfessionalPersonalData />} />
            <Route path="/professional/profile/settings" element={<ProfessionalSettings />} />
            <Route path="/professional/profile/preferences" element={<ProfessionalPreferences />} />
            <Route path="/professional/profile/fiscal" element={<ProfessionalFiscalData />} />
            <Route path="/professional/earnings" element={<ProfessionalEarnings />} />
            <Route path="/professional/support" element={<ProfessionalSupport />} />
            <Route path="/professional/profile/favorite-clients" element={<ProfessionalFavoriteClients />} />
            <Route path="/professional/service-board" element={<ServiceBoard />} />
            <Route path="/professional/my-offers" element={<MyOffers />} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </AppErrorBoundary>
        <InstallBanner />
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
  </QueryClientProvider>
);

export default App;
