import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthenticKPPlanet {
  name: string;
  sign: string;
  house: number;
  degree: number;
  longitude: number;
  nakshatra: string;
  ral: string;  // Rasi Lord
  stl: string;  // Star Lord
  sbl: string;  // Sub Lord
  ssl: string;  // Sub-Sub Lord
  sssl: string; // Sub-Sub-Sub Lord
}

interface AuthenticKPTableProps {
  planets: AuthenticKPPlanet[];
  title?: string;
}

export function AuthenticKPTable({ planets, title = "Authentic KP Planetary Positions" }: AuthenticKPTableProps) {
  if (!planets || planets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-cosmic-purple">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No authentic KP planetary data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-cosmic-purple text-white">
        <CardTitle className="text-lg font-bold text-center">{title}</CardTitle>
        <p className="text-center text-sm opacity-90">Swiss Ephemeris with KP-Newcomb Ayanamsa (23°43'07")</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">Planet</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">Sign</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">House</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">Degree</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">Longitude</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">Nakshatra</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">RAL</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">STL</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">SBL</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">SSL</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 text-sm">SSSL</th>
              </tr>
            </thead>
            <tbody>
              {planets.map((planet, index) => (
                <tr key={`planet-${planet.name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-3 py-2 font-bold text-blue-700 text-sm">
                    {planet.name}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-red-700 font-semibold text-sm">
                    {planet.sign}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-purple-700 font-semibold text-sm">
                    {planet.house}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900 font-mono text-sm">
                    {planet.degree}°
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700 font-mono text-xs">
                    {planet.longitude?.toFixed(2) ?? "0.00"}°
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-green-700 text-sm">
                    {planet.nakshatra}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-indigo-700 font-medium text-sm">
                    {planet.ral}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-orange-700 font-medium text-sm">
                    {planet.stl}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-pink-700 font-bold text-sm">
                    {planet.sbl}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-teal-700 font-medium text-sm">
                    {planet.ssl}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-violet-700 font-medium text-sm">
                    {planet.sssl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* KP System Information */}
        <div className="p-4 bg-blue-50 border-t">
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-2">Authentic KP System Details:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Calculation Engine:</strong> Swiss Ephemeris</li>
                <li><strong>Ayanamsa:</strong> KP-Newcomb (23° 43' 07")</li>
                <li><strong>Total Planets:</strong> {planets.length}</li>
                <li><strong>Method:</strong> Authentic Krishnamurti Paddhati</li>
              </ul>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>RAL:</strong> Rasi Lord (Sign Ruler)</li>
                <li><strong>STL:</strong> Star Lord (Nakshatra Ruler)</li>
                <li><strong>SBL:</strong> Sub Lord (1st Sub-division)</li>
                <li><strong>SSL:</strong> Sub-Sub Lord (2nd Sub-division)</li>
                <li><strong>SSSL:</strong> Sub-Sub-Sub Lord (3rd Sub-division)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}