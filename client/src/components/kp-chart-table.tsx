import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Planet {
  name: string;
  sign: string;
  degree: string;
  signLord: string;
  nakshatra: string;
  padham?: number;
  nakshatraLord: string;
  starLord: string;
  subLord: string;
  subSubLord: string;
  subSubSubLord: string;
}

interface KPChartTableProps {
  planets: any[];
  personName: string;
  chartType?: string;
}

// Helper to get short name (first 2 chars)
const getShortName = (name: string) => {
  if (!name) return "";
  return name.substring(0, 2);
};

export function KPChartTable({ planets, personName, chartType = "Planetary Positions" }: KPChartTableProps) {
  return (
    <Card className="bg-white border-2 border-gray-300 rounded-none shadow-none">
      <CardHeader className="bg-gray-100 py-2 border-b-2 border-gray-300">
        <CardTitle className="text-sm font-bold text-red-800 text-center uppercase tracking-wide">
          9 Planet Positions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-300 border-b border-gray-400">
                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400">Planet Rasi</th>
                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400">Star(Padham)</th>
                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400 w-10">Ral</th>
                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400 w-10">Stl</th>
                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400 w-10">Sbl</th>
                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400 w-10">SSL</th>
                <th className="text-left p-1 pl-2 font-bold text-black w-12">SSSL</th>
              </tr>
            </thead>
            <tbody>
              {planets.map((planet, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-white'}`}
                >
                  <td className="p-1 pl-2 font-bold text-black border-r border-gray-300">
                    <span className="inline-block w-8">{planet.name.substring(0, 3)}</span>
                    <span className="font-normal ml-2">{planet.sign}</span>
                  </td>
                  <td className="p-1 pl-2 font-bold text-black border-r border-gray-300">
                    {planet.nakshatra} ({planet.padham})
                  </td>
                  <td className="p-1 pl-2 font-bold text-black border-r border-gray-300">{getShortName(planet.signLord)}</td>
                  <td className="p-1 pl-2 font-bold text-red-600 border-r border-gray-300">{getShortName(planet.starLord || planet.nakshatraLord)}</td>
                  <td className="p-1 pl-2 font-bold text-green-600 border-r border-gray-300">{getShortName(planet.subLord)}</td>
                  <td className="p-1 pl-2 font-bold text-black border-r border-gray-300">{getShortName(planet.subSubLord)}</td>
                  <td className="p-1 pl-2 font-bold text-black">{getShortName(planet.subSubSubLord)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}