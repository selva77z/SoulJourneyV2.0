import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { KPChartDetail } from "./kp-chart-detail";
import { KPChartTable } from "@/components/kp-chart-table";
import { KPCuspTable } from "@/components/kp-cusp-table";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { DasaDisplay } from "@/components/dasa-display";

import { z } from "zod";

const horoscopeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  birthTime: z.string()
    .min(1, "Birth time is required")
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Time must be in HH:MM:SS format"),
  birthPlace: z.string().min(1, "Birth place is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type HoroscopeFormData = z.infer<typeof horoscopeFormSchema>;

// Helper functions for astrological calculations
function calculateJulianDay(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getSign(longitude: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[Math.floor(longitude / 30) % 12];
}

function getHouseLord(sign: string): string {
  const lordMap: Record<string, string> = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
    "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
    "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
  };
  return lordMap[sign] || "Unknown";
}

interface SimpleHoroscopeFormProps {
  initialData?: any;
}

export default function SimpleHoroscopeForm({ initialData }: SimpleHoroscopeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedChart, setGeneratedChart] = useState<any>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showKPModal, setShowKPModal] = useState(false);

  const form = useForm<HoroscopeFormData>({
    resolver: zodResolver(horoscopeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      birthDate: initialData?.birthDate || "",
      birthTime: initialData?.birthTime || "",
      birthPlace: initialData?.birthPlace || "",
      latitude: initialData?.latitude || "",
      longitude: initialData?.longitude || "",
    },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        birthDate: initialData.birthDate || "",
        birthTime: initialData.birthTime || "",
        birthPlace: initialData.birthPlace || "",
        latitude: initialData.latitude || "",
        longitude: initialData.longitude || "",
      });
    }
  }, [initialData, form]);

  // Location search function
  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoadingLocation(true);
      // Using OpenStreetMap Nominatim API for location search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();

      const formattedSuggestions = data.map((item: any) => ({
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        country: item.address?.country || '',
        state: item.address?.state || item.address?.region || '',
        city: item.address?.city || item.address?.town || item.address?.village || ''
      }));

      setLocationSuggestions(formattedSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSuggestions([]);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle location selection
  const selectLocation = (location: any) => {
    form.setValue('birthPlace', location.display_name);
    form.setValue('latitude', location.lat);
    form.setValue('longitude', location.lon);
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const generateHoroscopeMutation = useMutation({
    mutationFn: async (data: HoroscopeFormData) => {
      // Call the accurate Swiss Ephemeris API endpoint
      const response = await fetch("/api/horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          birthDate: data.birthDate,
          birthTime: data.birthTime,
          birthPlace: data.birthPlace,
          latitude: data.latitude || "10.381389",
          longitude: data.longitude || "78.821389"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Failed to generate horoscope: " + errorText);
      }

      const result = await response.json();

      // Format the result for the frontend chart display
      const chart = {
        name: data.name,
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        birthPlace: data.birthPlace,
        latitude: parseFloat(data.latitude || "10.381389"),
        longitude: parseFloat(data.longitude || "78.821389"),
        generated: new Date().toISOString(),
        chartType: "KP Raasi Chart",

        // Use accurate Swiss Ephemeris calculations from the API
        planets: result.planets || [],
        houses: result.houses || [],

        kpSystem: {
          significators: "Calculated using Swiss Ephemeris with KP Ayanamsa 23° 43' 07\"",
          rulingPlanets: result.rulingPlanets || ["Mercury", "Venus", "Sun"],
          analysis: "This chart shows planetary positions calculated using Swiss Ephemeris with authentic KP ayanamsa for accurate predictions."
        },

        message: "Horoscope generated successfully using Swiss Ephemeris with KP astrological calculations"
      };

      return chart;
    },
    onSuccess: (chart) => {
      console.log("Generated chart:", chart);
      console.log("Setting chart state...");

      // Force React re-render by updating both state and render key
      setGeneratedChart(chart);
      setRenderKey(prev => prev + 1);
      console.log("Chart state set successfully");

      toast({
        title: "Success",
        description: "Horoscope generated successfully! Click Save to store this chart.",
      });
    },
    onError: (error: Error) => {
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
        description: error.message || "Failed to generate horoscope",
        variant: "destructive",
      });
    },
  });

  const saveChartMutation = useMutation({
    mutationFn: async (chartData: any) => {
      console.log("Saving complete chart data:", chartData);

      // Use the new single endpoint to save horoscope data
      const response = await fetch("/api/horoscopes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chartData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Failed to save horoscope: " + errorText);
      }

      const result = await response.json();
      console.log("Horoscope saved successfully:", result);

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Horoscope saved successfully!",
      });
      // Invalidate multiple caches to refresh the saved horoscopes list
      queryClient.invalidateQueries({ queryKey: ["/api/birth-data"] });
      queryClient.invalidateQueries({ queryKey: ["savedHoroscopes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-horoscopes"] });
      setGeneratedChart(null);
      form.reset();
    },
    onError: (error: Error) => {
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
        description: error.message || "Failed to save chart",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (generatedChart) {
      saveChartMutation.mutate(generatedChart);
    }
  };

  const handleLocationSearch = async () => {
    const location = form.getValues("birthPlace");
    if (!location) {
      toast({
        title: "Error",
        description: "Please enter a birth place first",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        form.setValue("latitude", result.lat);
        form.setValue("longitude", result.lon);

        toast({
          title: "Location Found",
          description: `Coordinates set for ${result.display_name}`,
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Please try a different location or enter coordinates manually",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search location",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const onSubmit = (data: HoroscopeFormData) => {
    generateHoroscopeMutation.mutate(data);
  };

  if (generatedChart) {
    return (
      <div className="space-y-6">
        <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
          <CardHeader>
            <CardTitle className="text-2xl font-display text-stellar-white">
              {generatedChart.name}'s {generatedChart.chartType}
            </CardTitle>
            <Button
              onClick={() => setGeneratedChart(null)}
              variant="outline"
              className="w-fit border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
            >
              Generate Another Chart
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-nebula-gray">Birth Date:</span>
                <span className="text-stellar-white ml-2">{generatedChart.birthDate}</span>
              </div>
              <div>
                <span className="text-nebula-gray">Birth Time:</span>
                <span className="text-stellar-white ml-2">{generatedChart.birthTime}</span>
              </div>
              <div className="col-span-2">
                <span className="text-nebula-gray">Birth Place:</span>
                <span className="text-stellar-white ml-2">{generatedChart.birthPlace}</span>
              </div>
            </div>

            {/* Professional KP Tables - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <KPCuspTable cusps={generatedChart.houses || []} />
              </div>
              <div>
                <KPChartTable
                  planets={generatedChart.planets || []}
                  personName={generatedChart.name}
                  chartType="Planetary Positions"
                />
              </div>
            </div>

            {/* Rasi and Navamsa Charts */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
              <div className="w-full max-w-sm">
                <h3 className="text-center font-bold text-stellar-white mb-2">Rasi (D1)</h3>
                <SouthIndianChart
                  planets={generatedChart.planets || []}
                  houses={generatedChart.houses || []}
                  chartType="Rasi"
                  title="Rasi Chart"
                />
              </div>
              <div className="w-full max-w-sm">
                <h3 className="text-center font-bold text-stellar-white mb-2">Navamsa (D9)</h3>
                <SouthIndianChart
                  planets={generatedChart.planets || []}
                  chartType="Navamsa"
                  title="Navamsa Chart"
                />
              </div>
            </div>



            {/* Dasa Bhukti Display */}
            <div className="mt-8">
              <DasaDisplay dasa={generatedChart.dasa} />
            </div>

            <div className="bg-cosmic-purple/20 p-4 rounded-lg mt-4">
              <h3 className="text-lg font-semibold text-cosmic-gold mb-2">KP Analysis</h3>
              <p className="text-stellar-white text-sm">{generatedChart.kpSystem.analysis}</p>
              <div className="mt-2">
                <span className="text-nebula-gray text-sm">Ruling Planets: </span>
                <span className="text-cosmic-gold text-sm">{generatedChart.kpSystem.rulingPlanets.join(", ")}</span>
              </div>
            </div>
          </CardContent>

          {/* Action Buttons */}
          <div className="px-6 pb-6">
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setGeneratedChart(null);
                  setRenderKey(prev => prev + 1);
                }}
                className="bg-cosmic-purple text-stellar-white hover:bg-cosmic-purple/80"
              >
                Generate Another Chart
              </Button>

              <Button
                onClick={handleSave}
                disabled={saveChartMutation.isPending}
                className="bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/80"
              >
                {saveChartMutation.isPending ? 'Saving...' : 'Save Chart'}
              </Button>
            </div>
          </div>
        </Card>
      </div >
    );
  }

  return (
    <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-display text-stellar-white">
          Generate Horoscope
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-stellar-white">Full Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter full name"
              className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
            />
            {form.formState.errors.name && (
              <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="birthDate" className="text-stellar-white">Birth Date</Label>
            <Input
              id="birthDate"
              {...form.register("birthDate")}
              type="date"
              className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
            />
            {form.formState.errors.birthDate && (
              <p className="text-red-400 text-sm mt-1">{form.formState.errors.birthDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="birthTime" className="text-stellar-white">Birth Time (HH:MM:SS)</Label>
            <Input
              id="birthTime"
              {...form.register("birthTime")}
              type="text"
              placeholder="03:17:25"
              pattern="[0-2][0-9]:[0-5][0-9]:[0-5][0-9]"
              className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
            />
            <p className="text-nebula-gray text-xs mt-1">Format: Hours:Minutes:Seconds (24-hour format)</p>
            {form.formState.errors.birthTime && (
              <p className="text-red-400 text-sm mt-1">{form.formState.errors.birthTime.message}</p>
            )}
          </div>

          <div className="relative">
            <Label htmlFor="birthPlace" className="text-stellar-white">Birth Place</Label>
            <Input
              id="birthPlace"
              {...form.register("birthPlace")}
              placeholder="Type to search for city..."
              className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
              onChange={(e) => {
                form.setValue('birthPlace', e.target.value);
                searchLocation(e.target.value);
              }}
              onFocus={() => form.getValues('birthPlace').length >= 3 && setShowSuggestions(true)}
            />

            {/* Location Suggestions Dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {locationSuggestions.map((location, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    onClick={() => selectLocation(location)}
                  >
                    <div className="font-medium text-gray-900">{location.city}</div>
                    <div className="text-sm text-gray-600">
                      {location.state && `${location.state}, `}{location.country}
                    </div>
                    <div className="text-xs text-gray-500">{location.display_name}</div>
                  </div>
                ))}
              </div>
            )}

            {isLoadingLocation && (
              <div className="absolute right-3 top-8 text-cosmic-gold">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cosmic-gold"></div>
              </div>
            )}

            {form.formState.errors.birthPlace && (
              <p className="text-red-400 text-sm mt-1">{form.formState.errors.birthPlace.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude" className="text-stellar-white">Latitude</Label>
              <Input
                id="latitude"
                {...form.register("latitude")}
                placeholder="e.g., 28.6139"
                className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
              />
              {form.formState.errors.latitude && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.latitude.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="longitude" className="text-stellar-white">Longitude</Label>
              <Input
                id="longitude"
                {...form.register("longitude")}
                placeholder="e.g., 77.2090"
                className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
              />
              {form.formState.errors.longitude && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.longitude.message}</p>
              )}
            </div>
          </div>



          <Button
            type="submit"
            disabled={generateHoroscopeMutation.isPending}
            className="w-full bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/90 disabled:opacity-50"
          >
            {generateHoroscopeMutation.isPending ? "Generating..." : "Generate Horoscope"}
          </Button>
        </form>
      </CardContent>

      {/* DEBUG: Show state */}
      <div className="mt-4 p-2 bg-red-500/20 text-white text-sm">
        DEBUG: Chart exists = {generatedChart ? "YES" : "NO"}
        {generatedChart && ` | Chart name: ${generatedChart.name}`}
      </div>

      {/* Show generated chart and save button ONLY after generation */}
      {generatedChart ? (
        <div className="mt-6 p-4 bg-cosmic-midnight/40 border border-cosmic-purple/30 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-stellar-white">Generated Chart</h3>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  console.log("Generate Another Chart clicked");
                  setGeneratedChart(null);
                  // Stay on the same page, don't navigate
                }}
                variant="outline"
                className="border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
              >
                Generate Another Chart
              </Button>
              <Button
                onClick={() => {
                  console.log("Save button clicked!");
                  console.log("Generated chart exists:", !!generatedChart);
                  console.log("Starting save mutation...");
                  saveChartMutation.mutate(generatedChart);
                }}
                disabled={saveChartMutation.isPending}
                className="bg-cosmic-purple text-stellar-white hover:bg-cosmic-purple/80"
              >
                {saveChartMutation.isPending ? "Saving..." : "Save Chart"}
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-stellar-white mb-2">
                {generatedChart.name}
              </h4>
              <p className="text-cosmic-gold mb-4">
                {generatedChart.birthDate} at {generatedChart.birthTime}
              </p>
              <p className="text-gray-300 mb-6">
                {generatedChart.birthPlace}
              </p>
            </div>

            <div className="text-center">
              <Button
                onClick={() => setShowKPModal(true)}
                className="bg-cosmic-purple text-stellar-white hover:bg-cosmic-purple/80 px-8 py-3"
              >
                View KP Analysis
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-yellow-500/20 text-yellow-200 text-center">
          No chart generated yet. Generate a horoscope first to see save options.
        </div>
      )}


      {/* KP Chart Detail Modal */}
      {showKPModal && generatedChart && (
        <KPChartDetail
          horoscope={generatedChart}
          onClose={() => setShowKPModal(false)}
        />
      )}

    </Card>
  );
}