import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/game/AppSidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";
import Index from "./pages/Index.tsx";
import ManageInstancePage from "./pages/ManageInstancePage.tsx";
import InstancesPage from "./pages/InstancesPage.tsx";
import CICDPage from "./pages/CICDPage.tsx";
import LiveInstancesPage from "./pages/LiveInstancesPage.tsx";
import CLIPage from "./pages/CLIPage.tsx";
import TicketsPage from "./pages/TicketsPage.tsx";
import ApplicationsPage from "./pages/ApplicationsPage.tsx";
import ManageApplicationPage from "./pages/ManageApplicationPage.tsx";
import IssuesPage from "./pages/IssuesPage.tsx";
import IAMPage from "./pages/IAMPage.tsx";
import ScenariosPage from "./pages/ScenariosPage.tsx";
import ContainerLabPage from "./pages/ContainerLabPage.tsx";
import NetworkingPage from "./pages/NetworkingPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import VerifyOTPPage from "./pages/VerifyOTPPage.tsx";
import NotFound from "./pages/NotFound.tsx";

import { LearningSidebar } from "@/components/learning/LearningSidebar";
import { GuidanceBanner } from "@/components/learning/GuidanceBanner";
import { OnboardingOverlay } from "@/components/learning/OnboardingOverlay";
import { MobileBottomNav } from "@/components/game/MobileBottomNav";

const queryClient = new QueryClient();

const App = () => {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Show loading screen while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Restoring your session...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />

            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <LearningSidebar />
                  <GuidanceBanner />
                  <OnboardingOverlay />
                  <SidebarProvider defaultOpen={false}>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/apps" element={<ApplicationsPage />} />
                          <Route path="/apps/:id" element={<ManageApplicationPage />} />
                          <Route path="/instances" element={<InstancesPage />} />
                          <Route path="/instances/:id" element={<ManageInstancePage />} />
                          <Route path="/cicd" element={<CICDPage />} />
                          <Route path="/live" element={<LiveInstancesPage />} />
                          <Route path="/cli" element={<CLIPage />} />
                          <Route path="/tickets" element={<TicketsPage />} />
                          <Route path="/issues" element={<IssuesPage />} />
                          <Route path="/iam" element={<IAMPage />} />
                          <Route path="/scenarios" element={<ScenariosPage />} />
                          <Route path="/containers" element={<ContainerLabPage />} />
                          <Route path="/networking" element={<NetworkingPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                        <MobileBottomNav />
                      </div>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
