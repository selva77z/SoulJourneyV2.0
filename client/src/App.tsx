import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Horoscopes from "@/pages/horoscopes";
import Profile from "@/pages/profile";
import ChartDetailsPage from "@/pages/chart-details";

import Matches from "@/pages/matches";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/navigation";


function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cosmic-midnight flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-cosmic-gradient rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-star text-cosmic-gold text-2xl"></i>
          </div>
          <p className="text-stellar-white">Loading your cosmic journey...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Navigation />
          <Route path="/" component={Home} />
          <Route path="/horoscopes" component={Horoscopes} />
          <Route path="/profile" component={Profile} />
          <Route path="/chart-details" component={ChartDetailsPage} />
          <Route path="/matches" component={Matches} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
