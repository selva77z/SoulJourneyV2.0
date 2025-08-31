import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const horoscopeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  birthTime: z.string().min(1, "Birth time is required"),
  birthPlace: z.string().min(1, "Birth place is required"),
  latitude: z.string().min(1, "Latitude is required"),
  longitude: z.string().min(1, "Longitude is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

type HoroscopeFormData = z.infer<typeof horoscopeFormSchema>;

const BASIC_CHARTS = [
  { id: 'raasi', name: 'Raasi Chart (D1)', description: 'Main birth chart showing planetary positions' },
  { id: 'navamsa', name: 'Navamsa Chart (D9)', description: 'Chart for marriage and spiritual life' },
  { id: 'd10', name: 'Dasamsa Chart (D10)', description: 'Career and profession chart' },
  { id: 'd60', name: 'Shashtiamsa Chart (D60)', description: 'Chart for past karma and detailed predictions' },
  { id: 'bhava', name: 'Bhava Chart', description: 'House-based chart for life aspects' },
];

const ADDITIONAL_CHARTS = [
  { id: 'd2', name: 'Hora Chart (D2)', description: 'Wealth and prosperity' },
  { id: 'd3', name: 'Drekkana Chart (D3)', description: 'Siblings and courage' },
  { id: 'd4', name: 'Chaturthamsa Chart (D4)', description: 'Luck and fortune' },
  { id: 'd7', name: 'Saptamsa Chart (D7)', description: 'Children and creativity' },
  { id: 'd12', name: 'Dwadasamsa Chart (D12)', description: 'Parents and ancestry' },
  { id: 'd16', name: 'Shodasamsa Chart (D16)', description: 'Vehicles and happiness' },
  { id: 'd20', name: 'Vimsamsa Chart (D20)', description: 'Spiritual practices' },
  { id: 'd24', name: 'Chaturvimsamsa Chart (D24)', description: 'Education and learning' },
  { id: 'd27', name: 'Bhamsa Chart (D27)', description: 'Strengths and weaknesses' },
  { id: 'd30', name: 'Trimsamsa Chart (D30)', description: 'Misfortune and diseases' },
  { id: 'd40', name: 'Khavedamsa Chart (D40)', description: 'Maternal inheritance' },
  { id: 'd45', name: 'Akshavedamsa Chart (D45)', description: 'Character and behavior' },
  { id: 'd55', name: 'Shashtyupamsa Chart (D55)', description: 'Detailed life events' },
];

export default function GenerateHoroscopeForm() {
  const { toast } = useToast();
  const [selectedCharts, setSelectedCharts] = useState<string[]>(['raasi', 'navamsa', 'd10', 'd60', 'bhava']);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<HoroscopeFormData>({
    resolver: zodResolver(horoscopeFormSchema),
    defaultValues: {
      name: "",
      birthDate: "",
      birthTime: "",
      birthPlace: "",
      latitude: "",
      longitude: "",
      timezone: "",
    },
  });

  const generateHoroscopeMutation = useMutation({
    mutationFn: async (data: HoroscopeFormData & { charts: string[] }) => {
      setIsGenerating(true);
      return await apiRequest("POST", "/api/horoscopes/generate", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horoscopes/browse"] });
      toast({
        title: "Success",
        description: "Horoscope generated successfully!",
      });
      form.reset();
      setSelectedCharts(['raasi', 'navamsa', 'd10', 'd60', 'bhava']);
      setIsGenerating(false);
    },
    onError: (error) => {
      setIsGenerating(false);
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

  const onSubmit = (data: HoroscopeFormData) => {
    if (selectedCharts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one chart to generate",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...data,
      charts: selectedCharts,
    };
    
    generateHoroscopeMutation.mutate(payload);
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

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        form.setValue("latitude", result.lat);
        form.setValue("longitude", result.lon);
        form.setValue("timezone", "UTC"); // Default timezone, user can adjust

        toast({
          title: "Location Found",
          description: `Coordinates set for ${result.display_name}`,
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Please enter coordinates manually",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search location",
        variant: "destructive",
      });
    }
  };

  const toggleChart = (chartId: string) => {
    setSelectedCharts(prev => 
      prev.includes(chartId) 
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  const selectAllBasic = () => {
    const basicIds = BASIC_CHARTS.map(chart => chart.id);
    setSelectedCharts(prev => Array.from(new Set([...prev, ...basicIds])));
  };

  const selectAllAdditional = () => {
    const additionalIds = ADDITIONAL_CHARTS.map(chart => chart.id);
    setSelectedCharts(prev => Array.from(new Set([...prev, ...additionalIds])));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Birth Details Form */}
      <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
        <CardHeader>
          <CardTitle className="text-2xl font-display text-stellar-white">
            Birth Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-stellar-white">Full Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
                placeholder="Enter full name"
              />
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="birthDate" className="text-stellar-white">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                {...form.register("birthDate")}
                className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
              />
              {form.formState.errors.birthDate && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.birthDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="birthTime" className="text-stellar-white">Birth Time</Label>
              <Input
                id="birthTime"
                type="time"
                {...form.register("birthTime")}
                className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
              />
              {form.formState.errors.birthTime && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.birthTime.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="birthPlace" className="text-stellar-white">Birth Place</Label>
              <div className="flex space-x-2">
                <Input
                  id="birthPlace"
                  {...form.register("birthPlace")}
                  className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white flex-1"
                  placeholder="City, State, Country"
                />
                <Button
                  type="button"
                  onClick={handleLocationSearch}
                  variant="outline"
                  className="border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
                >
                  Search
                </Button>
              </div>
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
                  className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
                  placeholder="e.g., 28.6139"
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
                  className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
                  placeholder="e.g., 77.2090"
                />
                {form.formState.errors.longitude && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.longitude.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="timezone" className="text-stellar-white">Timezone</Label>
              <Input
                id="timezone"
                {...form.register("timezone")}
                className="bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white"
                placeholder="e.g., Asia/Kolkata"
              />
              {form.formState.errors.timezone && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.timezone.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/90"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cosmic-midnight"></div>
                  <span>Generating Charts...</span>
                </div>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Generate Horoscope
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Chart Selection */}
      <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
        <CardHeader>
          <CardTitle className="text-2xl font-display text-stellar-white">
            Select Charts to Generate
          </CardTitle>
          <p className="text-nebula-gray">
            Choose which charts you want to include in the horoscope
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Charts */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-stellar-white">Basic Charts</h3>
              <Button
                type="button"
                onClick={selectAllBasic}
                variant="outline"
                size="sm"
                className="border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
              >
                Select All
              </Button>
            </div>
            <div className="space-y-3">
              {BASIC_CHARTS.map((chart) => (
                <div key={chart.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={chart.id}
                    checked={selectedCharts.includes(chart.id)}
                    onCheckedChange={() => toggleChart(chart.id)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor={chart.id} className="text-stellar-white font-medium cursor-pointer">
                      {chart.name}
                    </Label>
                    <p className="text-sm text-nebula-gray">{chart.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Charts */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-stellar-white">Additional Charts</h3>
              <Button
                type="button"
                onClick={selectAllAdditional}
                variant="outline"
                size="sm"
                className="border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
              >
                Select All
              </Button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {ADDITIONAL_CHARTS.map((chart) => (
                <div key={chart.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={chart.id}
                    checked={selectedCharts.includes(chart.id)}
                    onCheckedChange={() => toggleChart(chart.id)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor={chart.id} className="text-stellar-white font-medium cursor-pointer">
                      {chart.name}
                    </Label>
                    <p className="text-sm text-nebula-gray">{chart.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-cosmic-purple/30">
            <p className="text-sm text-nebula-gray">
              Selected: <span className="text-cosmic-gold font-medium">{selectedCharts.length}</span> charts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}