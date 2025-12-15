import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, User, MapPin, Clock, Star, Sparkles, MessageSquare, Edit, Search } from "lucide-react";
import SimpleHoroscopeForm from "@/components/simple-horoscope-form";
import { KPChartDetail } from "@/components/kp-chart-detail";
import { useSearch, useLocation } from "wouter";
import { useEffect } from "react";
import { Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";



export default function Horoscopes() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [generationMode, setGenerationMode] = useState<'prompt' | 'manual'>('prompt');
  const [naturalPrompt, setNaturalPrompt] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingChart, setViewingChart] = useState<any>(null);
  const [showChartDetails, setShowChartDetails] = useState(false);

  // Fetch chart data for the selected birth data
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: [`/api/chart-data/${viewingChart?.id}`],
    enabled: !!viewingChart?.id,
    retry: false
  });

  // Get birth data from API for real browsing
  const { data: allBirthData = [] } = useQuery({
    queryKey: ["/api/birth-data/all"],
    retry: false
  });

  // Type the birth data properly
  const birthDataArray = Array.isArray(allBirthData) ? allBirthData : [];

  // Get unique years from birth data  
  const years = Array.from(new Set(birthDataArray.map((data: any) => {
    const year = new Date(data.birthDate).getFullYear();
    return year;
  }))).sort((a: number, b: number) => b - a);

  // Get data for selected year
  const yearData = birthDataArray.filter((data: any) => {
    const year = new Date(data.birthDate).getFullYear();
    return year === selectedYear;
  });

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(null); // Reset month when selecting year
  };

  const handleBack = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  const handlePromptSubmit = async () => {
    try {
      setIsProcessing(true);

      // Use OpenAI-powered natural language processing
      const response = await fetch('/api/parse-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: naturalPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse prompt');
      }

      const parsedData = await response.json();

      // Set the extracted data
      const data = {
        name: parsedData.name || 'Unknown Person',
        birthDate: parsedData.birthDate || '',
        birthTime: parsedData.birthTime || '12:00',
        birthPlace: parsedData.birthPlace || '',
        latitude: '',
        longitude: ''
      };

      setExtractedData(data);
      setGenerationMode('manual');
      setNaturalPrompt('');

      // Show confidence and notes if available
      if (parsedData.confidence && parsedData.confidence < 80) {
        alert(`Parsed with ${parsedData.confidence}% confidence. ${parsedData.notes || 'Please verify the details.'}`);
      }

    } catch (error) {
      console.error('Error parsing prompt:', error);
      alert('Error processing prompt. Please try again with clear birth details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const search = useSearch();
  const [location, setLocation] = useLocation();

  // Derive active tab directly from URL search params
  const getTabFromSearch = () => {
    const params = new URLSearchParams(search);
    const tab = params.get("tab");
    // Default to 'generate' or 'browse' (formerly browse is now Horoscopes)
    // If 'saved' is in URL, redirect/fallback to 'browse'
    if (tab === "saved") return "browse";
    return tab || "generate";
  };

  const activeTab = getTabFromSearch();

  const handleTabChange = (value: string) => {
    // Update URL
    const params = new URLSearchParams(search);
    params.set("tab", value);

    if (window.location.pathname === '/horoscopes') {
      setLocation("/horoscopes?" + params.toString());
    } else {
      setLocation("/horoscopes?" + params.toString());
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  // Handle Global Search in Browse Tab
  const filteredData = searchQuery
    ? birthDataArray.filter((d: any) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.birthPlace.toLowerCase().includes(searchQuery.toLowerCase()) ||
      new Date(d.birthDate).getFullYear().toString().includes(searchQuery) ||
      new Date(d.birthDate).toLocaleDateString().includes(searchQuery)
    )
    : [];

  return (
    <div className="min-h-screen bg-cosmic-midnight text-stellar-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center space-y-4">
          <h1 className="text-5xl font-display font-bold bg-gradient-to-r from-cosmic-gold via-white to-cosmic-purple bg-clip-text text-transparent">
            Cosmic Horoscopes
          </h1>
          <p className="text-lg text-nebula-gray font-light max-w-2xl mx-auto">
            Generate precise Krishnamurti Paddhati (KP) charts, explore planetary positions, and uncover cosmic insights.
          </p>
        </header>

        <Tabs key={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 border border-cosmic-purple/20 p-1 rounded-xl">
            <TabsTrigger
              value="generate"
              className="data-[state=active]:bg-cosmic-gold data-[state=active]:text-cosmic-midnight text-nebula-gray hover:text-stellar-white hover:bg-cosmic-midnight/40 transition-all rounded-lg py-3 font-medium text-lg"
            >
              Generate Horoscope
            </TabsTrigger>
            <TabsTrigger
              value="browse"
              className="data-[state=active]:bg-cosmic-gold data-[state=active]:text-cosmic-midnight text-nebula-gray hover:text-stellar-white hover:bg-cosmic-midnight/40 transition-all rounded-lg py-3 font-medium text-lg"
            >
              Horoscopes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {viewingChart ? (
              <KPChartDetail
                horoscope={{
                  ...viewingChart,
                  chartData: chartLoading ? null : chartData
                }}
                onClose={() => setViewingChart(null)}
              />
            ) : (
              <div className="space-y-6">
                {/* Total Count & Search Header */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-lg border border-cosmic-purple/20">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-2 bg-cosmic-purple/20 rounded-full">
                      <Star className="w-5 h-5 text-cosmic-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-stellar-white">Total Horoscopes</h3>
                      <p className="text-xs text-nebula-gray">in your collection</p>
                    </div>
                    <div className="text-2xl font-display font-bold text-cosmic-gold ml-2">
                      {birthDataArray.length}
                    </div>
                  </div>

                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nebula-gray" />
                    <Input
                      placeholder="Search by name, place, or year..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-cosmic-midnight/60 border-cosmic-purple/30 text-stellar-white placeholder:text-neutral-500 focus:border-cosmic-gold/50"
                    />
                  </div>
                </div>

                {searchQuery ? (
                  // SEARCH RESULTS VIEW
                  <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
                    <CardHeader>
                      <CardTitle className="text-2xl font-display text-stellar-white flex items-center gap-2">
                        <Search className="w-6 h-6" />
                        Search Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {filteredData.length === 0 ? (
                        <div className="text-center py-12 text-nebula-gray">
                          <p className="text-lg">No horoscopes found matching "{searchQuery}"</p>
                          <Button
                            variant="link"
                            onClick={() => setSearchQuery('')}
                            className="text-cosmic-gold"
                          >
                            Clear Search
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredData.map((person: any) => (
                            <div
                              key={person.id}
                              className="p-4 bg-white/5 border border-cosmic-purple/20 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group flex flex-col justify-between h-full"
                              onClick={() => {
                                console.log('Viewing chart for:', person.name);
                                setViewingChart(person);
                              }}
                            >
                              <div className="space-y-4 mb-4">
                                <h3 className="text-lg font-semibold text-stellar-white flex items-center gap-2 group-hover:text-cosmic-gold transition-colors">
                                  <User className="w-4 h-4" />
                                  {person.name}
                                </h3>
                                <div className="space-y-2 text-sm text-nebula-gray">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-cosmic-purple" />
                                    {new Date(person.birthDate).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-cosmic-purple" />
                                    {person.birthTime}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-cosmic-purple" />
                                    {person.birthPlace}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
                              >
                                View Chart
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : !selectedYear ? (
                  // Level 1: Year Selection
                  <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
                    <CardHeader>
                      <CardTitle className="text-2xl font-display text-stellar-white flex items-center gap-2">
                        <Calendar className="w-6 h-6" />
                        Browse by Year
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {years.map((year) => {
                          const count = birthDataArray.filter((d: any) => new Date(d.birthDate).getFullYear() === year).length;
                          return (
                            <Button
                              key={year}
                              variant="outline"
                              onClick={() => handleYearSelect(year)}
                              className="h-auto py-4 flex flex-col gap-1 border-cosmic-purple/20 hover:bg-cosmic-purple/20 text-black bg-white/90 hover:bg-white/80"
                            >
                              <span className="text-lg font-bold">{year}</span>
                              <span className="text-xs opacity-60 font-semibold">{count} Charts</span>
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : !selectedMonth ? (
                  // Level 2: Month Selection
                  <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-2xl font-display text-stellar-white flex items-center gap-2">
                        <Calendar className="w-6 h-6" />
                        Months in {selectedYear}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="text-cosmic-gold hover:text-cosmic-gold/80 hover:bg-transparent -mr-4"
                      >
                        ← Back to Years
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from(new Set(yearData.map((d: any) => new Date(d.birthDate).getMonth()))).sort((a, b) => a - b).map((monthIndex: number) => {
                          const monthName = new Date(selectedYear, monthIndex).toLocaleString('default', { month: 'long' });
                          const count = yearData.filter((d: any) => new Date(d.birthDate).getMonth() === monthIndex).length;
                          return (
                            <Button
                              key={monthIndex}
                              variant="outline"
                              onClick={() => setSelectedMonth(monthIndex)}
                              className="h-auto py-4 flex flex-col gap-1 border-cosmic-purple/20 hover:bg-cosmic-purple/20 text-black bg-white/90 hover:bg-white/80"
                            >
                              <span className="text-lg font-bold">{monthName}</span>
                              <span className="text-xs opacity-60 font-semibold">{count} Charts</span>
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Level 3: Charts Grid
                  <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-2xl font-display text-stellar-white flex items-center gap-2">
                        <User className="w-6 h-6" />
                        Horoscopes - {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })} {selectedYear}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedMonth(null)}
                        className="text-cosmic-gold hover:text-cosmic-gold/80 hover:bg-transparent -mr-4"
                      >
                        ← Back to Months
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {yearData.filter((d: any) => new Date(d.birthDate).getMonth() === selectedMonth).map((person: any) => (
                          <Card
                            key={person.id}
                            className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-cosmic-purple"
                          >
                            <CardContent className="p-4">
                              <div className="text-center space-y-3">
                                <div className="flex justify-center items-center space-x-4">
                                  <div className="text-blue-600">
                                    <Calendar className="w-8 h-8" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg text-gray-800">{person.name}</h3>
                                    <p className="text-gray-600">
                                      {new Date(person.birthDate).toLocaleDateString()} at {person.birthTime}
                                    </p>
                                    <p className="text-sm text-gray-500">{person.birthPlace}</p>
                                  </div>
                                </div>

                                <div className="flex justify-center space-x-4 text-xs text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3" />
                                    <span>Birth Data</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Saved Record</span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <Button
                                  onClick={() => setViewingChart(person)}
                                  className="bg-cosmic-purple hover:bg-cosmic-purple/80 text-white w-full"
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  View Chart
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await apiRequest('DELETE', `/api/birth-data/${person.id}`);
                                      queryClient.invalidateQueries({ queryKey: ["/api/birth-data/all"] });
                                      toast({ title: "Deleted", description: "Record deleted successfully" });
                                    } catch (err) {
                                      toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Delete Record
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            {/* Mode Selection */}
            <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
              <CardHeader>
                <CardTitle className="text-2xl font-display text-stellar-white">
                  Choose Generation Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={generationMode === 'prompt' ? 'default' : 'outline'}
                    onClick={() => setGenerationMode('prompt')}
                    className={generationMode === 'prompt'
                      ? "bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/90"
                      : "border-cosmic-purple/20 hover:bg-cosmic-purple/20 text-stellar-white"
                    }
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Natural Language Prompt
                  </Button>
                  <Button
                    variant={generationMode === 'manual' ? 'default' : 'outline'}
                    onClick={() => setGenerationMode('manual')}
                    className={generationMode === 'manual'
                      ? "bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/90"
                      : "border-cosmic-purple/20 hover:bg-cosmic-purple/20 text-stellar-white"
                    }
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Manual Entry
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generation Forms */}
            {generationMode === 'prompt' ? (
              <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
                <CardHeader>
                  <CardTitle className="text-xl font-display text-stellar-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Natural Language Input
                  </CardTitle>
                  <p className="text-nebula-gray text-sm">
                    Describe the birth details in natural language. For example: "Generate chart for John Smith born on March 15, 1990 at 2:30 PM in Mumbai, India"
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prompt" className="text-stellar-white mb-2 block">Birth Details Prompt</Label>
                    <textarea
                      id="prompt"
                      value={naturalPrompt}
                      onChange={(e) => setNaturalPrompt(e.target.value)}
                      placeholder="Enter birth details in natural language... e.g., 'Generate chart for John Smith born on March 15, 1990 at 2:30 PM in Mumbai, India'"
                      className="w-full min-h-32 p-3 rounded-md bg-cosmic-midnight border border-cosmic-purple/30 text-stellar-white placeholder:text-gray-400 focus:border-cosmic-gold focus:ring-2 focus:ring-cosmic-gold/50 focus:outline-none resize-none"
                      rows={4}
                      style={{
                        backgroundColor: '#1a1625',
                        color: '#e2e8f0',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                      }}
                    />
                  </div>
                  <Button
                    onClick={handlePromptSubmit}
                    disabled={!naturalPrompt.trim() || isProcessing}
                    className="w-full bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/90 disabled:opacity-50"
                  >
                    {isProcessing ? "Processing with AI..." : "Process Prompt & Generate Chart"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <SimpleHoroscopeForm initialData={extractedData} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}