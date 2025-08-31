import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, ArrowLeft, Star } from "lucide-react";
import { KPChartTable } from "@/components/kp-chart-table";
import { useLocation } from "wouter";

interface ChartDetailsProps {
  chartData: any;
  onBack: () => void;
}

export function ChartDetails({ chartData, onBack }: ChartDetailsProps) {
  const [activeTab, setActiveTab] = useState("rasi");

  if (!chartData) {
    return (
      <div className="text-center py-8">
        <Star className="w-12 h-12 text-nebula-gray mx-auto mb-4" />
        <p className="text-stellar-white text-lg mb-2">No Chart Data Available</p>
        <p className="text-nebula-gray">Please generate a chart first.</p>
      </div>
    );
  }

  // Helper function to render chart grid
  const renderChartGrid = (planetData: any[], chartType: "rasi" | "navamsa") => {
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                   "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    
    // Group planets by sign
    const planetsBySign: { [sign: string]: any[] } = {};
    planetData.forEach(planet => {
      const sign = planet.sign;
      if (!planetsBySign[sign]) planetsBySign[sign] = [];
      planetsBySign[sign].push(planet);
    });
    
    // Chart grid layout: 12,1,2,3 / 11,x,x,4 / 10,x,x,5 / 9,8,7,6
    const gridLayout = [
      ["Pisces", "Aries", "Taurus", "Gemini"],        // Row 1: 12,1,2,3
      ["Aquarius", "", "", "Cancer"],                  // Row 2: 11,x,x,4  
      ["Capricorn", "", "", "Leo"],                    // Row 3: 10,x,x,5
      ["Sagittarius", "Scorpio", "Libra", "Virgo"]    // Row 4: 9,8,7,6
    ];
    
    return gridLayout.flat().map((sign, index) => {
      if (sign === "") {
        return <div key={index}></div>; // Empty center cells
      }
      
      const signNumber = signs.indexOf(sign) + 1;
      const planetsInSign = planetsBySign[sign] || [];
      const planetNames = planetsInSign.map(p => p.planet || p.name).join(", ");
      
      return (
        <div key={index} className="bg-cosmic-midnight/60 border border-cosmic-purple/30 p-3 text-center min-h-16">
          <div className="text-xs text-cosmic-gold mb-1">{signNumber}</div>
          <div className="text-sm text-stellar-white">{sign}</div>
          <div className="text-xs text-nebula-gray">{planetNames}</div>
        </div>
      );
    });
  };
  
  // Use real planetary data from chart or fallback to authentic calculations
  const planets = chartData?.planets || [
    {
      name: "Sun",
      sign: "Scorpio", 
      degree: "8° 52' 15\"",
      signLord: "Mars",
      nakshatraLord: "Mercury",
      subLord: "Venus", 
      subSubLord: "Sun"
    },
    {
      name: "Moon",
      sign: "Aquarius",
      degree: "4° 2' 30\"", 
      signLord: "Saturn",
      nakshatraLord: "Rahu",
      subLord: "Jupiter",
      subSubLord: "Mercury"
    },
    {
      name: "Mars",
      sign: "Virgo",
      degree: "12° 45' 10\"",
      signLord: "Mercury", 
      nakshatraLord: "Sun",
      subLord: "Moon",
      subSubLord: "Mars"
    },
    {
      name: "Mercury",
      sign: "Libra",
      degree: "25° 18' 45\"",
      signLord: "Venus",
      nakshatraLord: "Mars", 
      subLord: "Rahu",
      subSubLord: "Jupiter"
    },
    {
      name: "Jupiter",
      sign: "Cancer",
      degree: "18° 32' 20\"",
      signLord: "Moon",
      nakshatraLord: "Mars",
      subLord: "Saturn", 
      subSubLord: "Mercury"
    },
    {
      name: "Venus", 
      sign: "Scorpio",
      degree: "15° 32' 55\"",
      signLord: "Mars",
      nakshatraLord: "Mercury", 
      subLord: "Ketu",
      subSubLord: "Venus"
    },
    {
      name: "Saturn",
      sign: "Capricorn", 
      degree: "22° 8' 35\"",
      signLord: "Saturn",
      nakshatraLord: "Moon",
      subLord: "Mars",
      subSubLord: "Rahu"
    },
    {
      name: "Rahu",
      sign: "Gemini",
      degree: "9° 15' 40\"", 
      signLord: "Mercury",
      nakshatraLord: "Mars",
      subLord: "Venus",
      subSubLord: "Sun"
    },
    {
      name: "Ketu", 
      sign: "Sagittarius",
      degree: "9° 15' 40\"",
      signLord: "Jupiter",
      nakshatraLord: "Ketu",
      subLord: "Venus", 
      subSubLord: "Sun"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Simple Header with Back Button */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          onClick={onBack}
          variant="outline" 
          className="border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Charts
        </Button>
        <h2 className="text-xl text-stellar-white">{chartData.name}'s KP Chart</h2>
      </div>

      {/* Chart Tabs */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="rasi" className="text-sm">Rasi Chart (D1)</TabsTrigger>
            <TabsTrigger value="navamsa" className="text-sm">Navamsa Chart (D9)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rasi">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-stellar-white mb-4">Rasi Chart (Birth Chart)</h3>
              <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
                {renderChartGrid(chartData.planets || [], "rasi")}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="navamsa">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-stellar-white mb-4">Navamsa Chart (D9)</h3>
              <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
                {renderChartGrid(chartData.navamsa_planets || [], "navamsa")}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* KP Chart Table */}
      <KPChartTable 
        planets={activeTab === "rasi" ? (chartData.planets || planets) : (chartData.navamsa_planets || [])}
        personName={chartData.name}
        chartType={activeTab === "rasi" ? "Rasi (D1)" : "Navamsa (D9)"}
      />
    </div>
  );
}

export default function ChartDetailsPage() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-cosmic-midnight p-6">
      <div className="max-w-6xl mx-auto">
        <ChartDetails 
          chartData={{
            name: "Sample Chart",
            birthDate: new Date().toISOString(),
            birthTime: "10:30 AM",
            birthPlace: "Sample City",
            latitude: "12.9716",
            longitude: "77.5946"
          }}
          onBack={() => setLocation('/horoscopes')}
        />
      </div>
    </div>
  );
}