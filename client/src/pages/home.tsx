import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stars, Calendar, User } from "lucide-react";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cosmic-midnight flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-cosmic-gradient rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Stars className="w-8 h-8 text-cosmic-gold" />
          </div>
          <p className="text-stellar-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-midnight pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Simple Welcome */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-stellar-white">
            Welcome, {user?.firstName || "Explorer"}!
          </h1>
          <p className="text-lg text-nebula-gray">
            Professional KP astrology with authentic calculations
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Horoscopes Card */}
          <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20 hover:border-cosmic-gold/20 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center text-stellar-white">
                <Calendar className="w-6 h-6 mr-3 text-cosmic-gold" />
                Horoscopes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-nebula-gray mb-4">
                Generate KP charts with real astronomical calculations
              </p>
              <Button asChild className="w-full bg-cosmic-gold hover:bg-cosmic-gold/90 text-cosmic-midnight">
                <Link href="/horoscopes">KP Charts</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20 hover:border-cosmic-gold/20 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center text-stellar-white">
                <User className="w-6 h-6 mr-3 text-cosmic-gold" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-nebula-gray mb-4">
                Manage your birth data and profile information
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/profile">Edit Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
