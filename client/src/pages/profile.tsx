import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertBirthDataSchema, insertProfileSchema } from "@shared/schema";
import { z } from "zod";
import BirthDataForm from "@/components/birth-data-form";

const profileFormSchema = insertProfileSchema.extend({
  interests: z.string().optional(),
  astrologyTags: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'birth' | 'profile'>('birth');

  const { data: birthData, isLoading: birthDataLoading } = useQuery({
    queryKey: ["/api/birth-data"],
    retry: false,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      interests: "",
      astrologyTags: "",
      isVisible: true,
    },
  });

  // Set form values when profile data loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        interests: profile.interests?.join(", ") || "",
        astrologyTags: profile.astrologyTags?.join(", ") || "",
        isVisible: profile.isVisible,
      });
    }
  }, [profile, profileForm]);

  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const payload = {
        ...data,
        interests: data.interests ? data.interests.split(",").map(s => s.trim()) : [],
        astrologyTags: data.astrologyTags ? data.astrologyTags.split(",").map(s => s.trim()) : [],
      };
      await apiRequest("POST", "/api/profile", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Profile created successfully!",
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
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!profile) throw new Error("Profile not found");
      const payload = {
        ...data,
        interests: data.interests ? data.interests.split(",").map(s => s.trim()) : [],
        astrologyTags: data.astrologyTags ? data.astrologyTags.split(",").map(s => s.trim()) : [],
      };
      await apiRequest("PATCH", `/api/profile/${profile.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
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
        description: error.message || "Failed to update profile",
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
          <p className="text-stellar-white">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const handleProfileSubmit = (data: ProfileFormData) => {
    if (profile) {
      updateProfileMutation.mutate(data);
    } else {
      createProfileMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-midnight pt-20">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Your Profile
          </h1>
          <p className="text-xl text-nebula-gray">
            Complete your cosmic profile to find your perfect matches
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('birth')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'birth'
                ? 'bg-cosmic-gold text-cosmic-midnight'
                : 'bg-cosmic-midnight/40 text-nebula-gray hover:text-stellar-white'
            }`}
          >
            <i className="fas fa-calendar-alt mr-2"></i>
            Birth Data
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-cosmic-gold text-cosmic-midnight'
                : 'bg-cosmic-midnight/40 text-nebula-gray hover:text-stellar-white'
            }`}
          >
            <i className="fas fa-user mr-2"></i>
            Profile Info
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'birth' && (
          <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center">
                <i className="fas fa-calendar-alt mr-3 text-cosmic-gold"></i>
                Birth Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {birthDataLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-gold"></div>
                </div>
              ) : (
                <BirthDataForm initialData={birthData} />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'profile' && (
          <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center">
                <i className="fas fa-user mr-3 text-cosmic-gold"></i>
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-gold"></div>
                </div>
              ) : (
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      {...profileForm.register("displayName")}
                      className="bg-cosmic-midnight/60 border-cosmic-purple/20 text-stellar-white"
                      placeholder="How you'd like to be known"
                    />
                    {profileForm.formState.errors.displayName && (
                      <p className="text-red-400 text-sm">
                        {profileForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...profileForm.register("bio")}
                      className="bg-cosmic-midnight/60 border-cosmic-purple/20 text-stellar-white min-h-[100px]"
                      placeholder="Tell others about yourself and your interests in astrology..."
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="text-red-400 text-sm">
                        {profileForm.formState.errors.bio.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests (comma-separated)</Label>
                    <Input
                      id="interests"
                      {...profileForm.register("interests")}
                      className="bg-cosmic-midnight/60 border-cosmic-purple/20 text-stellar-white"
                      placeholder="e.g., Meditation, Yoga, Spirituality, Music"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="astrologyTags">Astrology Tags (comma-separated)</Label>
                    <Input
                      id="astrologyTags"
                      {...profileForm.register("astrologyTags")}
                      className="bg-cosmic-midnight/60 border-cosmic-purple/20 text-stellar-white"
                      placeholder="e.g., Vedic, Western, Tarot, Numerology"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isVisible"
                      {...profileForm.register("isVisible")}
                      className="w-4 h-4 rounded border-cosmic-purple/20 bg-cosmic-midnight/60 text-cosmic-gold focus:ring-cosmic-gold"
                    />
                    <Label htmlFor="isVisible" className="text-sm">
                      Make my profile visible to others for matching
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/90"
                    disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
                  >
                    {createProfileMutation.isPending || updateProfileMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cosmic-midnight mr-2"></div>
                        {profile ? "Updating..." : "Creating..."}
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        {profile ? "Update Profile" : "Create Profile"}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
