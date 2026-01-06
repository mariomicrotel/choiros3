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

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/select-org"} component={SelectOrganization} />
      
      {/* Dashboard Routes */}
      <Route path={"/dashboard"}>
        <TenantRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </TenantRoute>
      </Route>
      
      <Route path={"/calendar"}>
        <TenantRoute>
          <DashboardLayout>
            <Calendar />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      <Route path={"/profile"}>
        <TenantRoute>
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      {/* Admin Routes */}
      <Route path={"/admin/members"}>
        <TenantRoute>
          <DashboardLayout>
            <AdminMembers />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      <Route path={"/admin/events"}>
        <TenantRoute>
          <DashboardLayout>
            <AdminEvents />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      <Route path={"/admin/payments"}>
        <TenantRoute>
          <DashboardLayout>
            <AdminPayments />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      {/* Check-in Routes */}
      <Route path={"/checkin"}>
        <TenantRoute>
          <DashboardLayout>
            <CheckIn />
          </DashboardLayout>
        </TenantRoute>
      </Route>

      <Route path={"/events/:id/qr"}>
        <TenantRoute>
          <DashboardLayout>
            <EventQRCode />
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
