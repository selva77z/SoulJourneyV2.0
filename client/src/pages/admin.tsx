import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'system'>('settings');
  const [editingSetting, setEditingSetting] = useState<string | null>(null);
  const [settingValue, setSettingValue] = useState<string>('');

  const { data: adminSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    retry: false,
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      await apiRequest("PATCH", `/api/admin/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setEditingSetting(null);
      setSettingValue('');
      toast({
        title: "Success",
        description: "Setting updated successfully!",
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
        description: error.message || "Failed to update setting",
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

    // Check if user is admin
    if (!authLoading && user && !user.email?.endsWith('@admin.com')) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [user, authLoading, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cosmic-midnight flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-cosmic-gradient rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-cog text-cosmic-gold text-2xl"></i>
          </div>
          <p className="text-stellar-white">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user?.email?.endsWith('@admin.com')) {
    return (
      <div className="min-h-screen bg-cosmic-midnight flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <i className="fas fa-lock text-4xl text-cosmic-gold mb-4"></i>
            <h1 className="text-2xl font-display font-bold mb-2">Access Denied</h1>
            <p className="text-nebula-gray">You don't have admin permissions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEditSetting = (key: string, currentValue: any) => {
    setEditingSetting(key);
    setSettingValue(typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue.toString());
  };

  const handleSaveSetting = (key: string) => {
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(settingValue);
      } catch {
        parsedValue = settingValue;
      }
      
      updateSettingMutation.mutate({ key, value: parsedValue });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingSetting(null);
    setSettingValue('');
  };

  return (
    <div className="min-h-screen bg-cosmic-midnight pt-20">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-nebula-gray">
            Manage KP Astrology platform settings and configurations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-cosmic-gold text-cosmic-midnight'
                : 'bg-cosmic-midnight/40 text-nebula-gray hover:text-stellar-white'
            }`}
          >
            <i className="fas fa-cog mr-2"></i>
            Settings
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-cosmic-gold text-cosmic-midnight'
                : 'bg-cosmic-midnight/40 text-nebula-gray hover:text-stellar-white'
            }`}
          >
            <i className="fas fa-users mr-2"></i>
            Users
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'system'
                ? 'bg-cosmic-gold text-cosmic-midnight'
                : 'bg-cosmic-midnight/40 text-nebula-gray hover:text-stellar-white'
            }`}
          >
            <i className="fas fa-server mr-2"></i>
            System
          </button>
        </div>

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
              <CardHeader>
                <CardTitle className="text-2xl font-display flex items-center">
                  <i className="fas fa-cog mr-3 text-cosmic-gold"></i>
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-gold"></div>
                  </div>
                ) : adminSettings && adminSettings.length > 0 ? (
                  <div className="space-y-4">
                    {adminSettings.map((setting: any) => (
                      <div key={setting.settingKey} className="bg-cosmic-midnight/60 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-stellar-white">{setting.settingKey}</h4>
                            {setting.description && (
                              <p className="text-sm text-nebula-gray">{setting.description}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
                            onClick={() => handleEditSetting(setting.settingKey, setting.settingValue)}
                            disabled={editingSetting === setting.settingKey}
                          >
                            <i className="fas fa-edit mr-1"></i>
                            Edit
                          </Button>
                        </div>
                        
                        {editingSetting === setting.settingKey ? (
                          <div className="space-y-3">
                            <Textarea
                              value={settingValue}
                              onChange={(e) => setSettingValue(e.target.value)}
                              className="bg-cosmic-midnight/80 border-cosmic-purple/20 text-stellar-white font-mono text-sm"
                              rows={6}
                            />
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/90"
                                onClick={() => handleSaveSetting(setting.settingKey)}
                                disabled={updateSettingMutation.isPending}
                              >
                                {updateSettingMutation.isPending ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cosmic-midnight mr-1"></div>
                                    Saving...
                                  </div>
                                ) : (
                                  <>
                                    <i className="fas fa-save mr-1"></i>
                                    Save
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-cosmic-purple/20 text-nebula-gray hover:text-stellar-white"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-cosmic-midnight/40 rounded p-3">
                            <pre className="text-sm text-nebula-gray whitespace-pre-wrap font-mono">
                              {typeof setting.settingValue === 'object'
                                ? JSON.stringify(setting.settingValue, null, 2)
                                : setting.settingValue?.toString()
                              }
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="fas fa-cog text-4xl text-cosmic-gold mb-4"></i>
                    <p className="text-lg text-nebula-gray mb-4">No settings configured yet</p>
                    <p className="text-sm text-nebula-gray">
                      Settings will appear here once they are added to the system
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center">
                <i className="fas fa-users mr-3 text-cosmic-gold"></i>
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <i className="fas fa-users text-4xl text-cosmic-gold mb-4"></i>
                <p className="text-lg text-nebula-gray mb-4">User management features coming soon</p>
                <p className="text-sm text-nebula-gray">
                  This section will include user analytics, moderation tools, and account management
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center">
                <i className="fas fa-server mr-3 text-cosmic-gold"></i>
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cosmic-midnight/60 rounded-lg p-4">
                  <h4 className="font-semibold text-stellar-white mb-3 flex items-center">
                    <i className="fas fa-info-circle mr-2 text-cosmic-gold"></i>
                    Platform Status
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-nebula-gray">Status:</span>
                      <span className="text-green-400">
                        <i className="fas fa-circle mr-1"></i>
                        Online
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nebula-gray">Environment:</span>
                      <span className="text-stellar-white">Production</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nebula-gray">Version:</span>
                      <span className="text-stellar-white">1.0.0</span>
                    </div>
                  </div>
                </div>

                <div className="bg-cosmic-midnight/60 rounded-lg p-4">
                  <h4 className="font-semibold text-stellar-white mb-3 flex items-center">
                    <i className="fas fa-database mr-2 text-cosmic-gold"></i>
                    Database
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-nebula-gray">Status:</span>
                      <span className="text-green-400">
                        <i className="fas fa-circle mr-1"></i>
                        Connected
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nebula-gray">Type:</span>
                      <span className="text-stellar-white">PostgreSQL</span>
                    </div>
                  </div>
                </div>

                <div className="bg-cosmic-midnight/60 rounded-lg p-4">
                  <h4 className="font-semibold text-stellar-white mb-3 flex items-center">
                    <i className="fas fa-brain mr-2 text-cosmic-gold"></i>
                    AI Services
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-nebula-gray">OpenAI:</span>
                      <span className="text-green-400">
                        <i className="fas fa-circle mr-1"></i>
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nebula-gray">Model:</span>
                      <span className="text-stellar-white">GPT-4o</span>
                    </div>
                  </div>
                </div>

                <div className="bg-cosmic-midnight/60 rounded-lg p-4">
                  <h4 className="font-semibold text-stellar-white mb-3 flex items-center">
                    <i className="fas fa-chart-line mr-2 text-cosmic-gold"></i>
                    Astrology Engine
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-nebula-gray">KP Calculations:</span>
                      <span className="text-green-400">
                        <i className="fas fa-circle mr-1"></i>
                        Online
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-nebula-gray">Matching:</span>
                      <span className="text-green-400">
                        <i className="fas fa-circle mr-1"></i>
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
