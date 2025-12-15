import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPCuspTableProps {
    cusps: any[]; // relaxed type
}

// Helper to get short name (first 2 chars)
const getShortName = (name: string) => {
    if (!name) return "";
    return name.substring(0, 2);
};

export function KPCuspTable({ cusps }: KPCuspTableProps) {
    if (!cusps || cusps.length === 0) return null;

    return (
        <Card className="bg-white border-2 border-gray-300 rounded-none shadow-none h-full">
            <CardHeader className="bg-gray-100 py-2 border-b-2 border-gray-300">
                <CardTitle className="text-sm font-bold text-red-800 text-center uppercase tracking-wide">
                    12 Bhava Cuspal Positions
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-300 border-b border-gray-400">
                                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400 w-8">Cu</th>
                                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400">Rasi</th>
                                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400">Star(Padham)</th>
                                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400 w-8">Ral</th>
                                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400 w-8">Stl</th>
                                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400 w-8">Sbl</th>
                                <th className="text-left p-1 pl-2 font-bold text-black border-r border-gray-400 w-8">SSL</th>
                                <th className="text-left p-1 pl-2 font-bold text-black w-10">SSSL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cusps.map((cusp, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-gray-300 bg-white"
                                >
                                    <td className="p-1 pl-2 font-bold text-black border-r border-gray-300 bg-gray-200 text-center">{cusp.house}</td>
                                    <td className="p-1 pl-2 font-bold text-black border-r border-gray-300">{cusp.sign}</td>
                                    <td className="p-1 pl-2 font-bold text-black border-r border-gray-300">
                                        {cusp.nakshatra} ({cusp.padham})
                                    </td>
                                    <td className="p-1 pl-2 font-bold text-black border-r border-gray-300">{getShortName(cusp.signLord)}</td>
                                    <td className="p-1 pl-2 font-bold text-black border-r border-gray-300">{getShortName(cusp.starLord)}</td>
                                    <td className="p-1 pl-2 font-bold text-red-600 border-r border-gray-300">{getShortName(cusp.subLord)}</td>
                                    <td className="p-1 pl-2 font-bold text-blue-800 border-r border-gray-300">{getShortName(cusp.subSubLord)}</td>
                                    <td className="p-1 pl-2 font-bold text-black">{getShortName(cusp.subSubSubLord)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
