import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SiteHead } from "@/components/SiteHead";

// Public
import Home from "@/pages/home";
import SearchPage from "@/pages/search";
import ListingDetail from "@/pages/listing-detail";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";

// Vendor
import VendorLogin from "@/pages/vendor/login";
import VendorRegister from "@/pages/vendor/register";
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorMenu from "@/pages/vendor/menu";
import VendorEvents from "@/pages/vendor/events";
import VendorPhotos from "@/pages/vendor/photos";
import VendorReviews from "@/pages/vendor/reviews";
import VendorAnalytics from "@/pages/vendor/analytics";
import VendorSettings from "@/pages/vendor/settings";

// Admin
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminPartners from "@/pages/admin/partners";
import AdminSettings from "@/pages/admin/settings";
import AdminSubscriptions from "@/pages/admin/subscriptions";
import AdminCategories from "@/pages/admin/categories";
import AdminEditorsPicks from "@/pages/admin/editors-picks";

import PaymentVerify from "@/pages/payment-verify";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchPage} />
      <Route path="/listings/:slug" component={ListingDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />

      {/* Vendor Routes */}
      <Route path="/vendor/login" component={VendorLogin} />
      <Route path="/vendor/register" component={VendorRegister} />
      <Route path="/vendor/dashboard" component={VendorDashboard} />
      <Route path="/vendor/menu" component={VendorMenu} />
      <Route path="/vendor/events" component={VendorEvents} />
      <Route path="/vendor/photos" component={VendorPhotos} />
      <Route path="/vendor/reviews" component={VendorReviews} />
      <Route path="/vendor/analytics" component={VendorAnalytics} />
      <Route path="/vendor/settings" component={VendorSettings} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/editors-picks" component={AdminEditorsPicks} />

      {/* Payment */}
      <Route path="/payment/verify" component={PaymentVerify} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <SiteHead />
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
