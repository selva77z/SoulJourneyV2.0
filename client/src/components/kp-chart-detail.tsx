import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft } from "lucide-react";
import { AuthenticKPTable } from "./authentic-kp-table";

interface KPChartDetailProps {
  horoscope: any;
  onClose: () => void;
}

export function KPChartDetail({ horoscope, onClose }: KPChartDetailProps) {
  // Add logging to debug the data structure
  console.log('KPChartDetail - Horoscope data:', horoscope);
  console.log('KPChartDetail - Chart data:', horoscope?.chartData);
  console.log('KPChartDetail - Planets:', horoscope?.chartData?.planets);

  // Function to get planets in a specific house
  const getPlanetsInHouse = (houseNumber: number) => {
    if (!horoscope.chartData?.planets) return [];
    return horoscope.chartData.planets.filter((planet: any) => planet.house === houseNumber);
  };

  // Function to get house info
  const getHouseInfo = (houseNumber: number) => {
    if (!horoscope.chartData?.houses) return null;
    return horoscope.chartData.houses.find((house: any) => house.house === houseNumber);
  };

  // Zodiac signs list and helpers
  const SIGNS = [
    'Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
  ];
  const SIGN_ABBR: Record<string, string> = {
    Aries: 'Ari', Taurus: 'Tau', Gemini: 'Gem', Cancer: 'Can', Leo: 'Leo', Virgo: 'Vir',
    Libra: 'Lib', Scorpio: 'Sco', Sagittarius: 'Sag', Capricorn: 'Cap', Aquarius: 'Aqu', Pisces: 'Pis'
  };
  const signIndex = (name?: string) => {
    if (!name) return -1;
    const i = SIGNS.findIndex(s => s.toLowerCase() === name.toLowerCase());
    return i >= 0 ? i + 1 : -1;
  };

  // Build sign -> houseNumber map using houses.sign from data
  const getSignToHouseMap = () => {
    const map: Record<number, number> = {};
    const houses = horoscope?.chartData?.houses || [];
    houses.forEach((h: any) => {
      const sIdx = signIndex(h.sign);
      if (sIdx > 0) map[sIdx] = h.house || h.number; // support either key
    });
    return map;
  };
  const signToHouse = getSignToHouseMap();

  // Parse degree string like "16° 50' 25\"" -> 16 + 50/60 + 25/3600
  const parseDmsToDegrees = (dms?: string | number) => {
    if (!dms) return 0;
    
    // If it's already a number, return it
    if (typeof dms === 'number') return dms;
    
    // If it's not a string, convert to string
    const dmsStr = String(dms);
    
    const m = dmsStr.match(/(\d+)°\s*(\d+)'\s*(\d+)?/);
    if (!m) {
      // If no DMS pattern found, try to parse as number
      const num = parseFloat(dmsStr);
      return isNaN(num) ? 0 : num;
    }
    const d = parseFloat(m[1]);
    const mi = parseFloat(m[2] || '0');
    const s = parseFloat(m[3] || '0');
    return d + mi / 60 + s / 3600;
  };

  // Navamsa sign calculation per Vedic rules
  const getNavamsaSignIndex = (planet: any) => {
    try {
      const sIdx = signIndex(planet.sign);
      if (sIdx < 1) return -1;
      const degInSign = parseDmsToDegrees(planet.degree);
      const pada = Math.floor(degInSign / (30 / 9)); // 0..8
      // Modality: movable (1,4,7,10), fixed (2,5,8,11), dual (3,6,9,12)
      const isMov = [1,4,7,10].includes(sIdx);
      const isFix = [2,5,8,11].includes(sIdx);
      const start = isMov ? sIdx : isFix ? ((sIdx + 8 - 1) % 12) + 1 : ((sIdx + 4 - 1) % 12) + 1;
      return ((start - 1 + pada) % 12) + 1;
    } catch (error) {
      console.error('Error calculating Navamsa sign index:', error, planet);
      return 1; // Default to Aries
    }
  };

  // Common 4x4 layout with center 4 cells empty
  const chartLayout = [
    [12, 1, 2, 3],
    [11, null, null, 4],
    [10, null, null, 5],
    [9, 8, 7, 6]
  ];

  // Group signs into 4 center cells (quadrants)
  const centerIndexForSignIdx = (idx: number) => {
    if ([1, 2, 3].includes(idx)) return 0; // Aries, Taurus, Gemini -> top-left center
    if ([4, 5, 6].includes(idx)) return 1; // Cancer, Leo, Virgo -> top-right center
    if ([7, 8, 9].includes(idx)) return 2; // Libra, Scorpio, Sagittarius -> bottom-left center
    if ([10, 11, 12].includes(idx)) return 3; // Capricorn, Aquarius, Pisces -> bottom-right center
    return -1;
  };
  const groupPlanetsByCenterCell = (planets: any[], getIdx: (p: any) => number) => {
    const groups: any[][] = [[], [], [], []];
    planets.forEach((p) => {
      const sIdx = getIdx(p);
      const cIdx = centerIndexForSignIdx(sIdx);
      if (cIdx >= 0) groups[cIdx].push(p);
    });
    return groups;
  };

  // Build groups once
  const allPlanets = horoscope?.chartData?.planets || [];
  const rasiCenterGroups = groupPlanetsByCenterCell(allPlanets, (p) => signIndex(p.sign));
  const navCenterGroups = groupPlanetsByCenterCell(allPlanets, (p) => getNavamsaSignIndex(p));

  // Outer ring cell without planets (house + sign only)
  const renderRasiCell = (houseNumber: number | null) => {
    if (houseNumber === null) return <div className="border border-gray-400 p-1 text-xs bg-gray-50 h-20" />;
    const targetSignIdx = Object.entries(signToHouse).find(([, h]) => h === houseNumber)?.[0];
    const tIdx = targetSignIdx ? parseInt(targetSignIdx, 10) : -1;
    const signName = tIdx > 0 ? SIGNS[tIdx - 1] : undefined;
    return (
      <div className="border border-gray-400 p-1 text-xs relative bg-white h-20 overflow-hidden">
        <div className="text-red-600 font-bold text-[10px]">{houseNumber}</div>
        {signName && (
          <div className="absolute top-1 right-1 text-purple-700 text-[10px]">{SIGN_ABBR[signName]}</div>
        )}
      </div>
    );
  };

  // Center cell renderer (planets only)
  const renderCenterCell = (groups: any[][], index: number, title: string, titleClass: string) => (
    <div className="border border-gray-400 p-1 text-xs bg-white h-20 overflow-auto">
      <div className={`${titleClass} font-bold text-[10px]`}>{title}</div>
      <div className="mt-1 grid grid-cols-2 gap-x-1 gap-y-0.5">
        {groups[index]?.map((p, i) => (
          <div key={i} className="text-blue-700 font-semibold text-[11px] truncate">
            {p.name.substring(0, 2)} {p.degree}
          </div>
        ))}
      </div>
    </div>
  );

  // Helper to compute center cell index from row/col in 4x4
  const centerIndexFromRC = (r: number, c: number) => {
    // center cells are (1,1)->0, (1,2)->1, (2,1)->2, (2,2)->3 in zero-based rows/cols
    if (r === 1 && c === 1) return 0;
    if (r === 1 && c === 2) return 1;
    if (r === 2 && c === 1) return 2;
    if (r === 2 && c === 2) return 3;
    return -1;
  };

  // Render a cell for Rasi (sign-based placement)
  const renderRasiCellFull = (houseNumber: number | null, isCenter = false) => {
    if (houseNumber === null) {
      return (
        <div className="border border-gray-400 p-1 text-xs bg-gray-50 h-20">
          {isCenter && (
            <div className="text-center">
              <div className="text-green-600 font-bold text-xs">{horoscope.name.split(' - ')[0]}</div>
              <div className="text-xs mt-1">
                <div>{horoscope.date}</div>
                <div>{horoscope.time}</div>
                <div>{horoscope.place}</div>
              </div>
            </div>
          )}
        </div>
      );
    }
    // Which sign sits in this house box?
    const targetSignIdx = Object.entries(signToHouse).find(([, h]) => h === houseNumber)?.[0];
    const tIdx = targetSignIdx ? parseInt(targetSignIdx, 10) : -1;
    const signName = tIdx > 0 ? SIGNS[tIdx - 1] : undefined;

    // Planets whose sign matches this cell's sign
    const planets = (horoscope?.chartData?.planets || []).filter((p: any) => signIndex(p.sign) === tIdx);

    return (
      <div className="border border-gray-400 p-1 text-xs relative bg-white h-20 overflow-hidden">
        <div className="text-red-600 font-bold text-[10px]">{houseNumber}</div>
        {signName && (
          <div className="absolute top-1 right-1 text-purple-700 text-[10px]">{SIGN_ABBR[signName]}</div>
        )}
        <div className="mt-3 space-y-0.5">
          {planets.map((planet: any, idx: number) => (
            <div key={idx} className="text-blue-700 font-semibold text-[11px]">
              {(planet?.name || 'Unknown').substring(0,2)} {planet?.degree || '0°'}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render a cell for Navamsa (sign-based on calculated Navamsa sign)
  const renderNavamsaCell = (houseNumber: number | null, isCenter = false) => {
    if (houseNumber === null) {
      return (
        <div className="border border-gray-400 p-1 text-xs bg-gray-50 h-20">
          {isCenter && (
            <div className="text-center">
              <div className="text-orange-600 font-bold text-xs">Navamsa</div>
              <div className="text-xs mt-1">
                <div>{horoscope.date}</div>
                <div>{horoscope.time}</div>
                <div>{horoscope.place}</div>
              </div>
            </div>
          )}
        </div>
      );
    }
    const targetSignIdx = Object.entries(signToHouse).find(([, h]) => h === houseNumber)?.[0];
    const tIdx = targetSignIdx ? parseInt(targetSignIdx, 10) : -1;
    const signName = tIdx > 0 ? SIGNS[tIdx - 1] : undefined;

    const planets = (horoscope?.chartData?.planets || []).filter((p: any) => getNavamsaSignIndex(p) === tIdx);

    return (
      <div className="border border-gray-400 p-1 text-xs relative bg-white h-20 overflow-hidden">
        <div className="text-orange-600 font-bold text-[10px]">{houseNumber}</div>
        {signName && (
          <div className="absolute top-1 right-1 text-purple-700 text-[10px]">{SIGN_ABBR[signName]}</div>
        )}
        <div className="mt-3 space-y-0.5">
          {planets.map((planet: any, idx: number) => (
            <div key={idx} className="text-blue-700 font-semibold text-[11px]">
              {(planet?.name || 'Unknown').substring(0,2)} {planet?.degree || '0°'}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-[95vw] max-h-[95vh] overflow-auto shadow-2xl text-gray-900">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">KP Analysis - {horoscope.name.split(' - ')[0]}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white text-gray-900">
          {/* Birth Details */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-bold text-blue-800 mb-2">Birth Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Date:</span>
                <p className="text-gray-900">{horoscope.date}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Time:</span>
                <p className="text-gray-900">{horoscope.time}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Place:</span>
                <p className="text-gray-900">{horoscope.place}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Ayanamsa:</span>
                <p className="text-cosmic-purple font-semibold">KP-Newcomb 23°43'07"</p>
              </div>
            </div>
          </div>

          {/* Authentic KP Planetary Positions Table - Only show saved data */}
          {horoscope?.chartData?.planets && (
            <div className="mb-6">
              <AuthenticKPTable 
                planets={horoscope.chartData.planets} 
                title="Authentic KP Planetary Positions (Swiss Ephemeris)" 
              />
            </div>
          )}

          {/* Real KP Analysis - Only if data exists */}
          {horoscope.chartData?.kpAnalysis && (
            <div className="border border-gray-300 rounded mt-6">
              <div className="bg-orange-600 text-white text-center py-2 font-bold text-sm">
                Comprehensive KP Analysis
              </div>
              <div className="p-4 text-sm space-y-3">
                <div>
                  <span className="font-semibold text-blue-600">Significators:</span>
                  <p className="mt-1 text-gray-700">{horoscope.chartData.kpAnalysis.significators}</p>
                </div>
                <div>
                  <span className="font-semibold text-green-600">Ruling Planets:</span>
                  <p className="mt-1 text-gray-700">
                    {Array.isArray(horoscope.chartData.kpAnalysis.rulingPlanets) 
                      ? horoscope.chartData.kpAnalysis.rulingPlanets.join(', ')
                      : horoscope.chartData.kpAnalysis.rulingPlanets}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-purple-600">KP Analysis:</span>
                  <p className="mt-1 text-gray-700">{horoscope.chartData.kpAnalysis.analysis}</p>
                </div>
                {horoscope.chartData.kpAnalysis.predictions && (
                  <div>
                    <span className="font-semibold text-red-600">Predictions:</span>
                    <p className="mt-1 text-gray-700">{horoscope.chartData.kpAnalysis.predictions}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
