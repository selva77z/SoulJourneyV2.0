import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateKPData, formatDegreeAsDMS, getDegreeInSign } from "@shared/kp-calculations";

interface Planet {
  name: string;
  sign: string;
  degree: number | string;
  house: number;
  star?: string;
  starLord?: string;
  longitude?: number;
}

interface PlanetaryPositionsTableProps {
  planets: Planet[];
  title?: string;
}

export function PlanetaryPositionsTable({ planets, title = "Planetary Positions" }: PlanetaryPositionsTableProps) {
  if (!planets || planets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-cosmic-purple">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No planetary data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate KP data for each planet
  const enrichedPlanets = planets.map(planet => {
    if (!planet.longitude) {
      return {
        ...planet,
        kpData: null
      };
    }
    
    const kpData = calculateKPData({
      name: planet.name,
      sign: planet.sign,
      degree: typeof planet.degree === 'number' ? planet.degree : parseFloat(String(planet.degree)) || 0,
      longitude: planet.longitude,
      house: planet.house
    });
    
    return {
      ...planet,
      kpData
    };
  });

  const formatDegree = (degree: number | string) => {
    if (typeof degree === 'string') {
      return degree;
    }
    if (typeof degree === 'number') {
      return formatDegreeAsDMS(getDegreeInSign(degree));
    }
    return '0°00\'00"';
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-cosmic-purple text-white">
        <CardTitle className="text-lg font-bold text-center">{title}</CardTitle>
        <p className="text-center text-sm opacity-90">Using Swiss Ephemeris with KP-Newcomb Ayanamsa</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-900 text-sm">Planet</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-900 text-sm">Sign</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-900 text-sm">Degree</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-900 text-sm">House</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-900 text-sm">Nakshatra</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-900 text-sm">Sign Lord</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-900 text-sm">Star Lord</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-900 text-sm">Sub Lord</th>
              </tr>
            </thead>
            <tbody>
              {enrichedPlanets.map((planet, index) => (
                <tr key={`planet-${planet.name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-2 py-2 font-semibold text-blue-700 text-sm">
                    {planet.name}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-red-700 font-medium text-sm">
                    {planet.sign}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-gray-900 font-mono text-sm">
                    {planet.kpData ? formatDegreeAsDMS(getDegreeInSign(planet.longitude || 0)) : formatDegree(planet.degree)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-purple-700 font-semibold text-sm">
                    {planet.house}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-green-700 text-sm">
                    {planet.kpData?.nakshatra || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-indigo-700 font-medium text-sm">
                    {planet.kpData?.signLord || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-orange-700 font-medium text-sm">
                    {planet.kpData?.starLord || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-pink-700 font-bold text-sm">
                    {planet.kpData?.subLord || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary */}
        <div className="p-4 bg-blue-50 border-t">
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-2">KP System Calculation Details:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Ayanamsa:</strong> KP-Newcomb (23° 43' 07")</li>
                <li><strong>Calculation Engine:</strong> Swiss Ephemeris</li>
                <li><strong>House System:</strong> Placidus</li>
                <li><strong>Total Planets:</strong> {planets.length}</li>
              </ul>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Sign Lord:</strong> Ruler of the zodiac sign</li>
                <li><strong>Star Lord:</strong> Ruler of the nakshatra (27 divisions)</li>
                <li><strong>Sub Lord:</strong> Ruler of the sub-division (243 divisions)</li>
                <li><strong>KP Method:</strong> Authentic Krishnamurti Paddhati</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}