import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Planet {
  name: string;
  sign: string;
  degree: string;
  signLord: string;
  nakshatraLord: string;
  subLord: string;
  subSubLord: string;
}

interface KPChartTableProps {
  planets: Planet[];
  personName: string;
  chartType?: string;
}

export function KPChartTable({ planets, personName, chartType = "Rasi (D1)" }: KPChartTableProps) {
  return (
    <Card className="bg-cosmic-midnight/60 border-cosmic-purple/20">
      <CardHeader>
        <CardTitle className="text-lg text-stellar-white">
          KP {chartType} Chart Details - {personName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-cosmic-purple/30">
                <th className="text-left p-3 text-cosmic-gold font-semibold">Planet</th>
                <th className="text-left p-3 text-cosmic-gold font-semibold">Zodiac Sign</th>
                <th className="text-left p-3 text-cosmic-gold font-semibold">Degree</th>
                <th className="text-left p-3 text-cosmic-gold font-semibold">Sign Lord</th>
                <th className="text-left p-3 text-cosmic-gold font-semibold">Nakshatra Lord</th>
                <th className="text-left p-3 text-cosmic-gold font-semibold">Sub Lord</th>
                <th className="text-left p-3 text-cosmic-gold font-semibold">SS Lord</th>
              </tr>
            </thead>
            <tbody>
              {planets.map((planet, index) => (
                <tr 
                  key={index}
                  className="border-b border-cosmic-purple/20 hover:bg-white/5 transition-colors"
                >
                  <td className="p-3 text-stellar-white font-medium">{planet.name}</td>
                  <td className="p-3 text-stellar-white">{planet.sign}</td>
                  <td className="p-3 text-stellar-white">{planet.degree}</td>
                  <td className="p-3 text-nebula-gray">{planet.signLord}</td>
                  <td className="p-3 text-nebula-gray">{planet.nakshatraLord}</td>
                  <td className="p-3 text-nebula-gray">{planet.subLord}</td>
                  <td className="p-3 text-nebula-gray">{planet.subSubLord}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}