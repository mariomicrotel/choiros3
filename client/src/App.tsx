import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminPayments from "./pages/admin/AdminPayments";
import CheckIn from "./pages/CheckIn";
import EventQRCode from "./pages/EventQRCode";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      
      {/* Dashboard Routes */}
      <Route path={"/dashboard"}>
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      
      <Route path={"/calendar"}>
        <DashboardLayout>
          <Calendar />
        </DashboardLayout>
      </Route>

      <Route path={"/profile"}>
        <DashboardLayout>
          <Profile />
        </DashboardLayout>
      </Route>

      {/* Admin Routes */}
      <Route path={"/admin/members"}>
        <DashboardLayout>
          <AdminMembers />
        </DashboardLayout>
      </Route>

      <Route path={"/admin/events"}>
        <DashboardLayout>
          <AdminEvents />
        </DashboardLayout>
      </Route>

      <Route path={"/admin/payments"}>
        <DashboardLayout>
          <AdminPayments />
        </DashboardLayout>
      </Route>

      {/* Check-in Routes */}
      <Route path={"/checkin"}>
        <DashboardLayout>
          <CheckIn />
        </DashboardLayout>
      </Route>

      <Route path={"/events/:id/qr"}>
        <DashboardLayout>
          <EventQRCode />
        </DashboardLayout>
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
