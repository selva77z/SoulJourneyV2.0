import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, User, MapPin, Clock, Star, Sparkles, MessageSquare, Edit } from "lucide-react";
import SimpleHoroscopeForm from "@/components/simple-horoscope-form";
import { SavedHoroscopesList } from "@/components/saved-horoscopes-list";
import { ChartDetails } from "@/pages/chart-details";


export default function Horoscopes() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [generationMode, setGenerationMode] = useState<'manual' | 'prompt'>('manual');
  const [naturalPrompt, setNaturalPrompt] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingChart, setViewingChart] = useState<any>(null);
  const [showChartDetails, setShowChartDetails] = useState(false);

  // Fetch chart data for the selected birth data
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["/api/chart", viewingChart?.userId],
    enabled: !!viewingChart?.userId,
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
  };

  const handleBack = () => {
    setSelectedYear(null);
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

  return (
    <div className="min-h-screen bg-cosmic-midnight text-stellar-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold mb-4 bg-cosmic-gradient bg-clip-text text-transparent">
            Horoscope Center
          </h1>
          <p className="text-nebula-gray max-w-2xl mx-auto">
            Explore the stars through KP astrology. Browse existing horoscopes or generate your own celestial chart.
          </p>
        </div>

        <Tabs defaultValue="saved" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
            <TabsTrigger value="saved" className="data-[state=active]:bg-white data-[state=active]:text-black text-[#10e814] font-semibold">
              <Star className="w-4 h-4 mr-2" />
              Saved Horoscopes
            </TabsTrigger>
            <TabsTrigger value="browse" className="data-[state=active]:bg-white data-[state=active]:text-black text-[#10e814] font-semibold">
              <Calendar className="w-4 h-4 mr-2" />
              Browse by Year
            </TabsTrigger>
            <TabsTrigger value="generate" className="data-[state=active]:bg-white data-[state=active]:text-black text-[#10e814] font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Horoscope
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-6">
            {showChartDetails && viewingChart ? (
              <ChartDetails 
                chartData={viewingChart}
                onBack={() => {
                  setShowChartDetails(false);
                  setViewingChart(null);
                }}
              />
            ) : (
              <SavedHoroscopesList />
            )}
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            <div className="space-y-6">
              {/* All Saved Charts Section */}
              <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
                <CardHeader>
                  <CardTitle className="text-2xl font-display text-stellar-white flex items-center gap-2">
                    <Star className="w-6 h-6" />
                    All Saved Charts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allBirthData && allBirthData.length > 0 ? (
                    <div className="grid gap-4">
                      {allBirthData.map((person: any) => (
                        <div
                          key={person.id}
                          className="p-4 bg-white/5 border border-cosmic-purple/20 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => {
                            console.log('Viewing chart for:', person.name);
                            setViewingChart(person);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h4 className="text-lg font-semibold text-stellar-white flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {person.name}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-nebula-gray">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(person.birthDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {person.birthTime}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {person.birthPlace}
                                </div>
                              </div>
                            </div>
                            <div className="text-cosmic-gold text-sm">
                              Born {person.year}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-nebula-gray text-center py-8">No saved charts yet. Generate your first horoscope!</p>
                  )}
                </CardContent>
              </Card>

              {!selectedYear ? (
                // Year selection
                <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
                  <CardHeader>
                    <CardTitle className="text-2xl font-display text-stellar-white flex items-center gap-2">
                      <Calendar className="w-6 h-6" />
                      Browse by Year
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {years.map((year) => (
                        <Button
                          key={year}
                          variant="outline"
                          onClick={() => handleYearSelect(year)}
                          className="border-cosmic-purple/20 hover:bg-cosmic-purple/20 text-black bg-white/90 hover:bg-white/80 font-semibold"
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // List of people with birth details for selected year
                <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
                  <CardHeader>
                    <CardTitle className="text-2xl font-display text-stellar-white flex items-center gap-2">
                      <User className="w-6 h-6" />
                      People Born in {selectedYear}
                    </CardTitle>
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="w-fit border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
                    >
                      ← Back to Years
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {yearData.length === 0 ? (
                      <p className="text-nebula-gray text-center py-8">No horoscopes found for {selectedYear}</p>
                    ) : (
                      <div className="space-y-4">
                        {yearData.map((person: any) => (
                          <div
                            key={person.id}
                            className="p-4 bg-white/5 border border-cosmic-purple/20 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => {
                              console.log('Viewing chart for:', person.name);
                              setViewingChart(person);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-stellar-white flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  {person.name}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-nebula-gray">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(person.birthDate).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {person.birthTime}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {person.birthPlace}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
                              >
                                View Chart
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
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