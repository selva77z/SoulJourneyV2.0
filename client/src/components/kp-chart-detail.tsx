import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft } from "lucide-react";
import { AuthenticKPTable } from "./authentic-kp-table";
import { KPChartTable } from "@/components/kp-chart-table";
import { KPCuspTable } from "@/components/kp-cusp-table";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { DasaDisplay } from "@/components/dasa-display";

interface KPChartDetailProps {
  horoscope: any;
  onClose: () => void;
}

export function KPChartDetail({ horoscope, onClose }: KPChartDetailProps) {
  // Add logging to debug the data structure
  console.log('KPChartDetail - Horoscope data:', horoscope);

  if (!horoscope) return null;

  // Show loading state if chartData is missing
  if (!horoscope.chartData) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-cosmic-midnight border border-cosmic-purple/30 rounded-lg p-8 flex flex-col items-center gap-4 text-stellar-white">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cosmic-gold"></div>
          <p>Loading Chart Data...</p>
        </div>
      </div>
    );
  }

  const { chartData } = horoscope;

  // Format birth details
  const formattedDate = new Date(horoscope.birthDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cosmic-midnight border border-cosmic-purple/30 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto shadow-2xl text-stellar-white scrollbar-thin scrollbar-thumb-cosmic-purple/50 scrollbar-track-transparent">
        {/* Header */}
        <div className="sticky top-0 bg-cosmic-midnight/95 backdrop-blur border-b border-cosmic-purple/20 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-display font-bold text-stellar-white">KP Analysis - {horoscope.name}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-nebula-gray hover:text-stellar-white hover:bg-cosmic-purple/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">

          {/* Birth Details Section (Matching Generate View) */}
          <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-nebula-gray block mb-1">Birth Date</span>
                  <span className="text-stellar-white font-medium">{formattedDate}</span>
                </div>
                <div>
                  <span className="text-nebula-gray block mb-1">Birth Time</span>
                  <span className="text-stellar-white font-medium">{horoscope.birthTime}</span>
                </div>
                <div>
                  <span className="text-nebula-gray block mb-1">Place</span>
                  <span className="text-stellar-white font-medium">{horoscope.birthPlace}</span>
                </div>
                <div>
                  <span className="text-nebula-gray block mb-1">Ayanamsa</span>
                  <span className="text-cosmic-gold font-medium">KP-Newcomb {chartData.ayanamsa || "23°43'07\""}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional KP Tables - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-cosmic-gold mb-3 text-center">Cuspal Positions</h3>
              <KPCuspTable cusps={chartData.houses || []} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cosmic-gold mb-3 text-center">Planetary Positions</h3>
              <KPChartTable
                planets={chartData.planets || []}
                personName={horoscope.name}
                chartType="Planetary Positions"
              />
            </div>
          </div>

          {/* Rasi and Navamsa Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
            <div className="w-full max-w-sm">
              <h3 className="text-center font-bold text-stellar-white mb-2">Rasi (D1)</h3>
              <SouthIndianChart
                planets={chartData.planets || []}
                houses={chartData.houses || []}
                chartType="Rasi"
                title="Rasi Chart"
              />
            </div>
            <div className="w-full max-w-sm">
              <h3 className="text-center font-bold text-stellar-white mb-2">Navamsa (D9)</h3>
              <SouthIndianChart
                planets={chartData.planets || []}
                chartType="Navamsa"
                title="Navamsa Chart"
              />
            </div>
          </div>

          {/* Dasa Bhukti Display */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-cosmic-gold mb-3">Vimshottari Dasa Periods</h3>
            <DasaDisplay dasa={chartData.dasa} />
          </div>

          {/* Analysis Section (If available) */}
          {chartData.kpSystem && (
            <div className="bg-cosmic-purple/10 border border-cosmic-purple/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-cosmic-gold mb-2">KP Analysis Summary</h3>
              <p className="text-stellar-white text-sm leading-relaxed mb-4">
                {chartData.kpSystem.analysis || "Analysis data not available."}
              </p>
              {chartData.kpSystem.rulingPlanets && (
                <div>
                  <span className="text-nebula-gray text-sm font-medium">Ruling Planets: </span>
                  <span className="text-cosmic-gold text-sm">{chartData.kpSystem.rulingPlanets.join(", ")}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
