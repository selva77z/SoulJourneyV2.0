import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserMatchCard from "@/components/user-match-card";

export default function Matches() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'liked' | 'mutual'>('all');

  const { data: chart, isLoading: chartLoading } = useQuery({
    queryKey: ["/api/chart"],
    retry: false,
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/matches"],
    retry: false,
  });

  const generateMatchesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/matches/generate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Success",
        description: "New matches have been generated based on your chart!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to generate matches",
        variant: "destructive",
      });
    },
  });

  const updateMatchStatusMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number; status: string }) => {
      await apiRequest("PATCH", `/api/matches/${matchId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Success",
        description: "Match status updated!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to update match status",
        variant: "destructive",
      });
    },
  });

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
            <i className="fas fa-star text-cosmic-gold text-2xl"></i>
          </div>
          <p className="text-stellar-white">Loading your matches...</p>
        </div>
      </div>
    );
  }

  const handleGenerateMatches = () => {
    generateMatchesMutation.mutate();
  };

  const handleMatchAction = (matchId: number, action: 'like' | 'pass') => {
    updateMatchStatusMutation.mutate({ matchId, status: action === 'like' ? 'liked' : 'passed' });
  };

  const filteredMatches = matches?.filter((match: any) => {
    if (filter === 'all') return true;
    return match.status === filter;
  }) || [];

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-cosmic-gold';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-cosmic-midnight pt-20">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Your Cosmic Matches
          </h1>
          <p className="text-xl text-nebula-gray">
            Discover compatible souls through astrological harmony
          </p>
        </div>

        {/* Match Generation */}
        {!chart ? (
          <Card className="mb-8 bg-cosmic-gradient border-cosmic-gold/20">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center">
                <i className="fas fa-chart-pie mr-3 text-cosmic-gold"></i>
                Generate Your Chart First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-lg mb-4">
                  You need to generate your astrology chart before we can find your matches
                </p>
                <Button onClick={() => window.location.href = "/chart"}>
                  Generate Chart
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !matches || matches.length === 0 ? (
          <Card className="mb-8 bg-cosmic-gradient border-cosmic-gold/20">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center">
                <i className="fas fa-heart mr-3 text-cosmic-gold"></i>
                Find Your Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-lg mb-6">
                  Ready to discover your cosmic connections? Let's find users who share astrological harmony with you.
                </p>
                <Button
                  onClick={handleGenerateMatches}
                  disabled={generateMatchesMutation.isPending}
                  className="bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/90"
                >
                  {generateMatchesMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cosmic-midnight mr-2"></div>
                      Finding Matches...
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-search mr-2"></i>
                      Find Matches
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-cosmic-gold text-cosmic-midnight'
                    : 'bg-cosmic-midnight/40 text-nebula-gray hover:text-stellar-white'
                }`}
              >
                All Matches ({matches?.length || 0})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  filter === 'pending'
                    ? 'bg-cosmic-gold text-cosmic-midnight'
                    : 'bg-cosmic-midnight/40 text-nebula-gray hover:text-stellar-white'
                }`}
              >
                Pending ({matches?.filter((m: any) => m.status === 'pending').length || 0})
              </button>
              <button
                onClick={() => setFilter('liked')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  filter === 'liked'
                    ? 'bg-cosmic-gold text-cosmic-midnight'
                    : 'bg-cosmic-midnight/40 text-nebula-gray hover:text-stellar-white'
                }`}
              >
                Liked ({matches?.filter((m: any) => m.status === 'liked').length || 0})
              </button>
              <button
                onClick={() => setFilter('mutual')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  filter === 'mutual'
                    ? 'bg-cosmic-gold text-cosmic-midnight'
                    : 'bg-cosmic-midnight/40 text-nebula-gray hover:text-stellar-white'
                }`}
              >
                Mutual ({matches?.filter((m: any) => m.status === 'mutual').length || 0})
              </button>
            </div>

            {/* Matches Display */}
            {matchesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-gold"></div>
              </div>
            ) : filteredMatches.length === 0 ? (
              <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
                <CardContent className="text-center py-12">
                  <i className="fas fa-search text-4xl text-cosmic-gold mb-4"></i>
                  <p className="text-lg text-nebula-gray mb-4">
                    No matches found for the selected filter
                  </p>
                  <Button
                    onClick={handleGenerateMatches}
                    disabled={generateMatchesMutation.isPending}
                    variant="outline"
                    className="border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
                  >
                    <i className="fas fa-refresh mr-2"></i>
                    Generate New Matches
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMatches.map((match: any) => (
                  <UserMatchCard
                    key={match.id}
                    match={match}
                    onAction={handleMatchAction}
                    isUpdating={updateMatchStatusMutation.isPending}
                  />
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleGenerateMatches}
                disabled={generateMatchesMutation.isPending}
                variant="outline"
                className="border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
              >
                <i className="fas fa-refresh mr-2"></i>
                Generate New Matches
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
