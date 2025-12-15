import React from 'react';

interface Planet {
    name: string;
    sign: string;
    degree: number | string;
    [key: string]: any;
}

interface SouthIndianChartProps {
    planets: Planet[];
    houses?: {
        house: number;
        sign: string;
    }[];
    chartType: "Rasi" | "Navamsa";
    title?: string;
    className?: string;
}

export function SouthIndianChart({ planets, houses, chartType, title, className = "" }: SouthIndianChartProps) {
    // Constants
    const SIGNS = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];

    const SIGN_ABBR: Record<string, string> = {
        Aries: 'Ari', Taurus: 'Tau', Gemini: 'Gem', Cancer: 'Can', Leo: 'Leo', Virgo: 'Vir',
        Libra: 'Lib', Scorpio: 'Sco', Sagittarius: 'Sag', Capricorn: 'Cap', Aquarius: 'Aqu', Pisces: 'Pis'
    };

    // Helper: Get sign index (1-12)
    const getSignIndex = (name?: string) => {
        if (!name) return -1;
        const i = SIGNS.findIndex(s => s.toLowerCase() === name.toLowerCase());
        return i >= 0 ? i + 1 : -1;
    };

    // Helper: Parse DMS to degrees
    const parseDmsToDegrees = (dms?: string | number) => {
        if (!dms) return 0;
        if (typeof dms === 'number') return dms;
        const dmsStr = String(dms);
        const m = dmsStr.match(/(\d+)°\s*(\d+)'\s*(\d+)?/);
        if (!m) {
            const num = parseFloat(dmsStr);
            return isNaN(num) ? 0 : num;
        }
        const d = parseFloat(m[1]);
        const mi = parseFloat(m[2] || '0');
        const s = parseFloat(m[3] || '0');
        return d + mi / 60 + s / 3600;
    };

    // Helper: Calculate Navamsa Sign Index
    const getNavamsaSignIndex = (planet: Planet) => {
        try {
            const sIdx = getSignIndex(planet.sign);
            if (sIdx < 1) return -1;
            const degInSign = parseDmsToDegrees(planet.degree);
            const pada = Math.floor(degInSign / (30 / 9)); // 0..8

            // Movable: 1, 4, 7, 10
            // Fixed: 2, 5, 8, 11
            // Dual: 3, 6, 9, 12
            const isMov = [1, 4, 7, 10].includes(sIdx);
            const isFix = [2, 5, 8, 11].includes(sIdx);

            // Start sign for counting based on modality
            // Movable: Starts from same sign
            // Fixed: Starts from 9th from same sign
            // Dual: Starts from 5th from same sign
            const start = isMov ? sIdx : isFix ? ((sIdx + 8 - 1) % 12) + 1 : ((sIdx + 4 - 1) % 12) + 1;

            return ((start - 1 + pada) % 12) + 1;
        } catch (error) {
            console.error('Error calculating Navamsa sign index:', error);
            return 1;
        }
    };

    // Layout: South Indian Chart is a 4x4 grid. 
    // The signs are fixed in position:
    // 12 1 2 3
    // 11     4
    // 10     5
    // 9  8 7 6
    // But we render as a flat 12-cell loop or 4x4 grid? 
    // Actually usually implemented as a CSS Grid.
    // Row 1: Pis(12), Ari(1), Tau(2), Gem(3)
    // Row 2: Aqu(11), [Center], [Center], Can(4)
    // Row 3: Cap(10), [Center], [Center], Leo(5)
    // Row 4: Sag(9), Sco(8), Lib(7), Vir(6)

    // Let's map strict grid positions (row, col) to Sign Index (1-12)
    const gridToSignMap: Record<string, number> = {
        "0-0": 12, "0-1": 1, "0-2": 2, "0-3": 3,
        "1-0": 11, "1-3": 4,
        "2-0": 10, "2-3": 5,
        "3-0": 9, "3-1": 8, "3-2": 7, "3-3": 6
    };

    const getPlanetsForSign = (signIdx: number) => {
        if (chartType === "Rasi") {
            return planets.filter(p => getSignIndex(p.sign) === signIdx);
        } else {
            return planets.filter(p => getNavamsaSignIndex(p) === signIdx);
        }
    };

    const getHouseNumberForSign = (signIdx: number) => {
        if (!houses || chartType === "Navamsa") return null; // Houses usually only shown on Rasi
        const h = houses.find(h => getSignIndex(h.sign) === signIdx);
        return h ? h.house : null;
    };

    // Render a single cell
    const renderCell = (row: number, col: number) => {
        const signIdx = gridToSignMap[`${row}-${col}`];

        // If it's a center cell (no sign)
        if (!signIdx) {
            if (row === 1 && col === 1) {
                return (
                    <div className="col-span-2 row-span-2 flex items-center justify-center bg-white border border-gray-800">
                        <div className="text-center p-2">
                            <div className="text-cosmic-purple font-black text-base uppercase tracking-wider mb-1">{title || chartType}</div>
                            <div className="text-xs text-gray-800 font-bold">South Indian Style</div>
                        </div>
                    </div>
                );
            }
            return null;
        }

        const cellPlanets = getPlanetsForSign(signIdx);
        const houseNum = getHouseNumberForSign(signIdx);
        const signName = SIGNS[signIdx - 1];

        return (
            <div className="border border-gray-800 min-h-[80px] relative bg-white p-1 hover:bg-gray-50 transition-colors">
                {/* Sign Name (Top Right) */}
                <div className="absolute top-0.5 right-1 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                    {SIGN_ABBR[signName]}
                </div>

                {/* House Number (Top Left, Red) */}
                {houseNum && (
                    <div className="absolute top-0.5 left-1 text-xs font-black text-red-700">
                        {houseNum}
                    </div>
                )}

                {/* Planets Content */}
                <div className="mt-4 flex flex-wrap content-start gap-1">
                    {cellPlanets.map((p, idx) => (
                        <div key={idx} className="text-xs font-bold text-blue-800 w-full leading-tight truncate" title={`${p.name} ${p.degree}°`}>
                            {p.name.substring(0, 2)} <span className="text-black font-semibold">{typeof p.degree === 'number' ? p.degree.toFixed(0) : String(p.degree).split('.')[0]}°</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={`w-full max-w-sm mx-auto aspect-square bg-white border-2 border-gray-900 shadow-xl ${className}`}>
            <div className="grid grid-cols-4 grid-rows-4 w-full h-full bg-gray-900 gap-[1px]">
                {/* Row 0 */}
                {renderCell(0, 0)} {renderCell(0, 1)} {renderCell(0, 2)} {renderCell(0, 3)}
                {/* Row 1 */}
                {renderCell(1, 0)} {renderCell(1, 1)} {/* Center spans 2x2, handled in renderCell */} {renderCell(1, 3)}
                {/* Row 2 */}
                {renderCell(2, 0)} {renderCell(2, 3)}
                {/* Row 3 */}
                {renderCell(3, 0)} {renderCell(3, 1)} {renderCell(3, 2)} {renderCell(3, 3)}
            </div>
        </div>
    );
}
