import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Significator {
    planet: string;
    level1: number[];
    level2: number[];
    level3: number[];
    level4: number[];
}

interface KPSignificatorTableProps {
    significators: Significator[];
}

export function KPSignificatorTable({ significators }: KPSignificatorTableProps) {
    if (!significators || significators.length === 0) return null;

    return (
        <Card className="bg-cosmic-midnight/60 border-cosmic-purple/20">
            <CardHeader>
                <CardTitle className="text-lg text-stellar-white">
                    Planetary Significators (4-Fold)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-cosmic-purple/30">
                                <th className="text-left p-3 text-cosmic-gold font-semibold">Planet</th>
                                <th className="text-left p-3 text-cosmic-gold font-semibold">Level 1 (Star Occ)</th>
                                <th className="text-left p-3 text-cosmic-gold font-semibold">Level 2 (Occ)</th>
                                <th className="text-left p-3 text-cosmic-gold font-semibold">Level 3 (Star Lord)</th>
                                <th className="text-left p-3 text-cosmic-gold font-semibold">Level 4 (Lord)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {significators.map((sig, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-cosmic-purple/20 hover:bg-white/5 transition-colors"
                                >
                                    <td className="p-3 text-stellar-white font-medium">{sig.planet}</td>
                                    <td className="p-3 text-nebula-gray">{sig.level1.join(", ")}</td>
                                    <td className="p-3 text-nebula-gray">{sig.level2.join(", ")}</td>
                                    <td className="p-3 text-nebula-gray">{sig.level3.join(", ")}</td>
                                    <td className="p-3 text-nebula-gray">{sig.level4.join(", ")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
