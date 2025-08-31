import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertBirthDataSchema, type BirthData } from "@shared/schema";
import { z } from "zod";

const birthDataFormSchema = insertBirthDataSchema.extend({
  birthDate: z.string().min(1, "Birth date is required"),
  birthTime: z.string().min(1, "Birth time is required"),
  birthPlace: z.string().min(1, "Birth place is required"),
  latitude: z.string().min(1, "Latitude is required"),
  longitude: z.string().min(1, "Longitude is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

type BirthDataFormData = z.infer<typeof birthDataFormSchema>;

interface BirthDataFormProps {
  initialData?: BirthData;
}

export default function BirthDataForm({ initialData }: BirthDataFormProps) {
  const { toast } = useToast();

  const form = useForm<BirthDataFormData>({
    resolver: zodResolver(birthDataFormSchema),
    defaultValues: {
      birthDate: initialData?.birthDate || "",
      birthTime: initialData?.birthTime || "",
      birthPlace: initialData?.birthPlace || "",
      latitude: initialData?.latitude?.toString() || "",
      longitude: initialData?.longitude?.toString() || "",
      timezone: initialData?.timezone || "",
    },
  });

  const createBirthDataMutation = useMutation({
    mutationFn: async (data: BirthDataFormData) => {
      const payload = {
        ...data,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
      };
      await apiRequest("POST", "/api/birth-data", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/birth-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chart"] }); // Invalidate chart as it depends on birth data
      toast({
        title: "Success",
        description: "Birth data saved successfully!",
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
        description: error.message || "Failed to save birth data",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BirthDataFormData) => {
    createBirthDataMutation.mutate(data);
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
      // Simple geocoding using a public API (nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        form.setValue("latitude", result.lat);
        form.setValue("longitude", result.lon);
        
        // Simple timezone detection based on coordinates
        const timezoneResponse = await fetch(
          `https://api.timezonedb.com/v2.1/get-time-zone?key=demo&format=json&by=position&lat=${result.lat}&lng=${result.lon}`
        );
        
        if (timezoneResponse.ok) {
          const timezoneData = await timezoneResponse.json();
          if (timezoneData.zoneName) {
            form.setValue("timezone", timezoneData.zoneName);
          }
        } else {
          // Fallback to a reasonable default
          form.setValue("timezone", "UTC");
        }

        toast({
          title: "Success",
          description: "Location coordinates found and filled automatically!",
        });
      } else {
        toast({
          title: "Error",
          description: "Location not found. Please enter coordinates manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search location. Please enter coordinates manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="birthDate">Birth Date</Label>
          <Input
            id="birthDate"
            type="date"
            {...form.register("birthDate")}
            className="bg-cosmic-midnight/60 border-cosmic-purple/20 text-stellar-white"
          />
          {form.formState.errors.birthDate && (
            <p className="text-red-400 text-sm">
              {form.formState.errors.birthDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthTime">Birth Time</Label>
          <Input
            id="birthTime"
            type="time"
            {...form.register("birthTime")}
            className="bg-cosmic-midnight/60 border-cosmic-purple/20 text-stellar-white"
          />
          {form.formState.errors.birthTime && (
            <p className="text-red-400 text-sm">
              {form.formState.errors.birthTime.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthPlace">Birth Place</Label>
        <div className="flex space-x-2">
          <Input
            id="birthPlace"
            {...form.register("birthPlace")}
            className="bg-cosmic-midnight/60 border-cosmic-purple/20 text-stellar-white"
            placeholder="e.g., New York, NY, USA"
          />
          <Button
            type="button"
            onClick={handleLocationSearch}
            variant="outline"
            className="border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
          >
            <i className="fas fa-search"></i>
          </Button>
        </div>
        {form.formState.errors.birthPlace && (
          <p className="text-red-400 text-sm">
            {form.formState.errors.birthPlace.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            {...form.register("latitude")}
            className="bg-cosmic-midnight/60 border-cosmic-purple/20 text-stellar-white"
            placeholder="e.g., 40.7128"
          />
          {form.formState.errors.latitude && (
            <p className="text-red-400 text-sm">
              {form.formState.errors.latitude.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            {...form.register("longitude")}
            className="bg-cosmic-midnight/60 border-cosmic-purple/20 text-stellar-white"
            placeholder="e.g., -74.0060"
          />
          {form.formState.errors.longitude && (
            <p className="text-red-400 text-sm">
              {form.formState.errors.longitude.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            {...form.register("timezone")}
            className="bg-cosmic-midnight/60 border-cosmic-purple/20 text-stellar-white"
            placeholder="e.g., America/New_York"
          />
          {form.formState.errors.timezone && (
            <p className="text-red-400 text-sm">
              {form.formState.errors.timezone.message}
            </p>
          )}
        </div>
      </div>

      <div className="bg-cosmic-midnight/40 rounded-lg p-4 border border-cosmic-purple/20">
        <div className="flex items-start space-x-3">
          <i className="fas fa-info-circle text-cosmic-gold mt-1"></i>
          <div className="text-sm text-nebula-gray">
            <p className="font-medium mb-2">Accuracy is Important</p>
            <p>
              For precise astrological calculations, please provide your exact birth time and location. 
              Use the search button to automatically find coordinates for your birth place.
            </p>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/90"
        disabled={createBirthDataMutation.isPending}
      >
        {createBirthDataMutation.isPending ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cosmic-midnight mr-2"></div>
            Saving Birth Data...
          </div>
        ) : (
          <>
            <i className="fas fa-save mr-2"></i>
            Save Birth Data
          </>
        )}
      </Button>
    </form>
  );
}
