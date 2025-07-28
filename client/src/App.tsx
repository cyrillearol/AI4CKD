import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientDetails from "@/pages/patient-details";
import Consultations from "@/pages/consultations";
import AlertsPage from "@/pages/alerts";
import ReportsPage from "@/pages/reports";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Parametres from "@/pages/parametres";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route>
        <div className="min-h-screen bg-medical-gray">
          <Header />
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-12 gap-6">
              <Sidebar />
              <main className="col-span-9">
                <Switch>
                  <ProtectedRoute path="/" component={Dashboard} />
                  <ProtectedRoute path="/patients" component={Patients} />
                  <ProtectedRoute path="/patients/:id" component={PatientDetails} />
                  <ProtectedRoute path="/consultations" component={Consultations} />
                  <ProtectedRoute path="/alerts" component={AlertsPage} />
                  <ProtectedRoute path="/reports" component={ReportsPage} />
                  <ProtectedRoute path="/settings" component={Parametres} />
                  <Route component={NotFound} />
                </Switch>
              </main>
            </div>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
