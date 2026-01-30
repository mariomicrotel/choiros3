import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SelectOrganization from "./pages/SelectOrganization";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminPayments from "./pages/admin/AdminPayments";
import CheckIn from "./pages/CheckIn";
import EventQRCode from "./pages/EventQRCode";
import DashboardLayout from "./components/DashboardLayout";
import TenantRoute from "./components/TenantRoute";
import SuperadminDashboard from "./pages/superadmin/SuperadminDashboard";
import SuperadminOrganizations from "./pages/superadmin/SuperadminOrganizations";
import Songs from "./pages/Songs";
import SongDetail from "./pages/SongDetail";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/select-org"} component={SelectOrganization} />
      
      {/* Tenant Routes with /t/:slug prefix */}
      <Route path="/t/:slug/dashboard">
        <TenantRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </TenantRoute>
      </Route>
      
      
      <Route path="/t/:slug/calendar">
        <TenantRoute>
          <DashboardLayout>
            <Calendar />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      
      <Route path="/t/:slug/profile">
        <TenantRoute>
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      
      {/* Admin Routes with tenant prefix */}
      <Route path="/t/:slug/admin/members">
        <TenantRoute>
          <DashboardLayout>
            <AdminMembers />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      
      <Route path="/t/:slug/admin/events">
        <TenantRoute>
          <DashboardLayout>
            <AdminEvents />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      
      <Route path="/t/:slug/admin/payments">
        <TenantRoute>
          <DashboardLayout>
            <AdminPayments />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      {/* Songs/Repository Routes */}
      <Route path="/t/:slug/songs">
        <TenantRoute>
          <DashboardLayout>
            <Songs />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      <Route path="/t/:slug/songs/:id">
        <TenantRoute>
          <DashboardLayout>
            <SongDetail />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      
      {/* Superadmin Routes (no tenant prefix) */}
      <Route path="/superadmin">
        <SuperadminDashboard />
      </Route>
      
      <Route path="/superadmin/organizations">
        <SuperadminOrganizations />
      </Route>

      {/* Check-in Routes with tenant prefix */}
      <Route path="/t/:slug/checkin">
        <TenantRoute>
          <DashboardLayout>
            <CheckIn />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      
      <Route path="/t/:slug/events/:id/qr">
        <TenantRoute>
          <DashboardLayout>
            <EventQRCode />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      
      {/* Legacy routes without tenant prefix - redirect to home */}
      <Route path="/dashboard">
        <TenantRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </TenantRoute>
      </Route>
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
