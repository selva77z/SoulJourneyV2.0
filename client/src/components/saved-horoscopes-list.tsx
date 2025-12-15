import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Star, Eye, Sparkles, Trash2 } from "lucide-react";
import { KPChartDetail } from "./kp-chart-detail";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SavedHoroscope {
  id: number;
  name: string;
  date: string;
  time: string;
  place: string;
  calculation_type?: string;
  chartData: {
    planets: Array<{
      name: string;
      sign: string;
      degree: string;
      house: number;
      star: string;
      starLord: string;
    }>;
    houses: Array<{
      number: number;
      sign: string;
      degree: string;
      lord: string;
    }>;
    lagna?: {
      sign: string;
      degree: string;
    };
    ayanamsa?: string;
  };
}

const fetchSavedHoroscopes = async (): Promise<SavedHoroscope[]> => {
  const response = await fetch('/api/saved-horoscopes');
  if (!response.ok) {
    throw new Error('Failed to fetch saved horoscopes');
  }
  return response.json();
};

export function SavedHoroscopesList() {
  const [selectedHoroscope, setSelectedHoroscope] = useState<SavedHoroscope | null>(null);
  const { toast } = useToast();

  const { data: horoscopes, isLoading, error } = useQuery({
    queryKey: ['savedHoroscopes'],
    queryFn: fetchSavedHoroscopes,
    refetchInterval: 30000,
  });

  const deleteHoroscopeMutation = useMutation({
    mutationFn: async (horoscopeId: number) => {
      await apiRequest("DELETE", `/api/saved-horoscopes/${horoscopeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedHoroscopes'] });
      toast({
        title: "Success",
        description: "Chart deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete chart",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-purple mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading saved horoscopes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading horoscopes: {(error as Error).message}</p>
      </div>
    );
  }

  if (!horoscopes || horoscopes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔮</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Saved Horoscopes</h3>
        <p className="text-gray-600 mb-6">
          Generate your first KP horoscope to see it appear here.
        </p>
        <Button onClick={() => window.location.href = '/'} className="bg-cosmic-purple hover:bg-cosmic-purple/80 text-white">
          Generate New Horoscope
        </Button>
      </div>
    );
  }

  const handleOpenChart = (horoscope: SavedHoroscope) => {
    console.log('Opening chart for:', horoscope.name);
    setSelectedHoroscope(horoscope);
  };

  const handleCloseChart = () => {
    console.log('Closing chart');
    setSelectedHoroscope(null);
  };

  const handleDeleteChart = (horoscopeId: number, horoscopeName: string) => {
    deleteHoroscopeMutation.mutate(horoscopeId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Saved Horoscopes</h2>
        <p className="text-gray-600">Your personal collection of KP astrology charts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {horoscopes.map((horoscope, index) => (
          <Card key={`horoscope-${horoscope.id}-${index}-${horoscope.date}`} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-cosmic-purple">
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <div className="flex justify-center items-center space-x-4">
                  <div className="text-blue-600">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{horoscope.name.split(' - ')[0]}</h3>
                    <p className="text-gray-600">{horoscope.date} at {horoscope.time}</p>
                    <p className="text-sm text-gray-500">{horoscope.place}</p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3" />
                    <span>KP System</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Swiss Ephemeris</span>
                  </div>
                </div>

                <div className="pt-3">
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 mb-3">
                    {horoscope.calculation_type || 'Professional KP Analysis'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  onClick={() => handleOpenChart(horoscope)}
                  className="bg-cosmic-purple hover:bg-cosmic-purple/80 text-white w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Open Complete KP Analysis
                </Button>
                <Button
                  onClick={() => handleDeleteChart(horoscope.id, horoscope.name)}
                  disabled={deleteHoroscopeMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  {deleteHoroscopeMutation.isPending ? 'Deleting...' : 'Delete Chart'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal for detailed view */}
      {selectedHoroscope && (
        <KPChartDetail
          horoscope={selectedHoroscope}
          onClose={handleCloseChart}
        />
      )}

      {/* Debug info */}
      {selectedHoroscope && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
          Selected: {selectedHoroscope.name}
        </div>
      )}
    </div>
  );
}
