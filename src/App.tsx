import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { DashboardRedirect } from "@/components/DashboardRedirect";
import StaffDashboard from "./pages/StaffDashboard";
import OrderHistory from "./pages/OrderHistory";
import OrdersByDate from "./pages/OrdersByDate";
import HRDashboard from "./pages/HRDashboard";
// import StaffList from "./pages/StaffList";
import MenuManagement from "./pages/MenuManagement";
// import NewOrder from "./pages/NewOrder";
import StaffList from "./pages/StaffList";
import StaffOrderHistory from "./pages/StaffOrderHistory";
// import MenuManagement from "./pages/MenuManagement";
import ViewOrderHistory from "./pages/ViewOrderHistory";
import NewOrder from "./pages/NewOrder";
import EditOrder from "./pages/EditOrder";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Verify from "./pages/Verify";
import OAuthCallback from "./pages/OAuthCallback";
import NotFound from "./pages/NotFound";
import StaffOrderHistoryForStaffDashboard from "./pages/StaffOrderHistoryForStaffDashboard";
import SetNewPassword from "./pages/setNewPassword";

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/set-new-password" element={<SetNewPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />
          <Route path="/staff" element={
            <ProtectedRoute>
              <Layout><StaffDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/staffOrderHistoryForDashboard" element={
            <ProtectedRoute>
              <Layout><StaffOrderHistoryForStaffDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <Layout><OrderHistory /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/hr" element={
            <RoleProtectedRoute requiredRole="hr">
              <Layout><HRDashboard /></Layout>
            </RoleProtectedRoute>
          } />
          <Route path="/hr/staff-list" element={
            <RoleProtectedRoute requiredRole="hr">
              <Layout><StaffList /></Layout>
            </RoleProtectedRoute>
          } />
          <Route path="/hr/new-order/:staffId" element={
            <RoleProtectedRoute requiredRole="hr">
              <Layout><NewOrder /></Layout>
            </RoleProtectedRoute>
          } />
          <Route path="/hr/edit-order/:userId" element={
            <RoleProtectedRoute requiredRole="hr">
              <Layout><EditOrder /></Layout>
            </RoleProtectedRoute>
          } />
          {/*<Route path="/" element={<Layout><StaffDashboard /></Layout>} />*/}
          {/*<Route path="/history" element={<Layout><OrderHistory /></Layout>} />*/}
          {/*<Route path="/hr" element={<Layout><HRDashboard /></Layout>} />*/}
          {/*<Route path="/hr/staff-list" element={<Layout><StaffList /></Layout>} />*/}
          <Route path="/hr/staff-order-history/" element={<Layout><StaffOrderHistory /></Layout>} />
          <Route path="/orders/:date" element={<Layout><OrdersByDate /></Layout>} />
          <Route path="/hr/menu-management/" element={<Layout><MenuManagement /></Layout>} />
          <Route path="/view/:userId" element={<Layout><ViewOrderHistory /></Layout>} />
          {/*<Route path="/hr/new-order/:staffId" element={<Layout><NewOrder /></Layout>} />*/}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;