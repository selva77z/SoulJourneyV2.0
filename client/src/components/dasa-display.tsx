
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DasaInfo {
    currentDasa: string;
    balanceYears: number;
    dasaEndDate: string;
    fullSystem?: Array<{
        lord: string;
        start: string;
        end: string;
        bhuktis: Array<{
            lord: string;
            start: string;
            end: string;
            anthras: Array<{
                lord: string;
                start: string;
                end: string;
            }>
        }>
    }>;
}

interface DasaDisplayProps {
    dasa: DasaInfo;
}

export function DasaDisplay({ dasa }: DasaDisplayProps) {
    const [showFullSchedule, setShowFullSchedule] = useState(false);

    if (!dasa) return null;

    // Calculate years, months, days from balanceYears
    const totalDays = dasa.balanceYears * 365.25;
    const years = Math.floor(dasa.balanceYears);
    const months = Math.floor((totalDays % 365.25) / 30.44);
    const days = Math.floor((totalDays % 365.25) % 30.44);

    // Find current running Dasa/Bhukti
    const now = new Date();

    let currentMaha: any = null;
    let currentBhukti: any = null;
    let currentAnthra: any = null; // Backend might not send full Anthra yet, but structure supports it

    if (dasa.fullSystem) {
        for (const maha of dasa.fullSystem) {
            const start = new Date(maha.start);
            const end = new Date(maha.end);
            if (now >= start && now <= end) {
                currentMaha = maha;
                // Find Bhukti
                if (maha.bhuktis) {
                    for (const bhukti of maha.bhuktis) {
                        const bStart = new Date(bhukti.start);
                        const bEnd = new Date(bhukti.end);
                        if (now >= bStart && now <= bEnd) {
                            currentBhukti = bhukti;
                            break;
                        }
                    }
                }
                break;
            }
        }
    }

    return (
        <Card className="bg-cosmic-midnight/60 border-cosmic-purple/20 w-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg text-stellar-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cosmic-gold" />
                    Current Dasa Period
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Active Period Highlight */}
                {currentMaha ? (
                    <div className="bg-gradient-to-r from-cosmic-purple/20 to-cosmic-midnight border border-cosmic-gold/30 rounded-lg p-6 mb-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                            {/* Maha Dasa */}
                            <div className="text-center">
                                <div className="text-xs text-nebula-gray uppercase tracking-wider mb-1">Maha Dasa</div>
                                <div className="text-3xl font-bold text-cosmic-gold">{currentMaha.lord}</div>
                                <div className="text-xs text-stellar-white/60 mt-1">
                                    Ends: {currentMaha.end}
                                </div>
                            </div>

                            <ChevronRight className="hidden md:block w-6 h-6 text-cosmic-purple/50" />

                            {/* Bhukti */}
                            <div className="text-center">
                                <div className="text-xs text-nebula-gray uppercase tracking-wider mb-1">Bhukti (Antardasa)</div>
                                <div className="text-2xl font-semibold text-white">
                                    {currentBhukti ? currentBhukti.lord : "-"}
                                </div>
                                {currentBhukti && (
                                    <div className="text-xs text-stellar-white/60 mt-1">
                                        Ends: {currentBhukti.end}
                                    </div>
                                )}
                            </div>

                            {/* Anthra (Optional if available) */}
                            {currentAnthra && (
                                <>
                                    <ChevronRight className="hidden md:block w-6 h-6 text-cosmic-purple/50" />
                                    <div className="text-center opacity-80">
                                        <div className="text-xs text-nebula-gray uppercase tracking-wider mb-1">Anthra</div>
                                        <div className="text-xl font-medium text-white">{currentAnthra.lord}</div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-sm text-nebula-gray">
                            <span>Balance at Birth: {years}y {months}m {days}d</span>
                            {currentBhukti && (
                                <span className="text-cosmic-gold">
                                    Current Bhukti ends in {Math.ceil((new Date(currentBhukti.end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-4 text-nebula-gray">
                        Could not determine current period. Dates might be out of range.
                    </div>
                )}

                <div className="text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullSchedule(!showFullSchedule)}
                        className="text-cosmic-purple hover:text-cosmic-gold hover:bg-transparent"
                    >
                        {showFullSchedule ? "Hide Full Schedule" : "View Full Dasa Schedule"}
                        <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${showFullSchedule ? 'rotate-180' : ''}`} />
                    </Button>
                </div>

                {showFullSchedule && dasa.fullSystem && (
                    <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <h3 className="text-md font-semibold text-stellar-white mb-3">Vimshottari Dasa Schedule</h3>
                        <ScrollArea className="h-[400px] w-full pr-4">
                            <Accordion type="single" collapsible className="w-full">
                                {dasa.fullSystem.map((dasaPeriod, idx) => (
                                    <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-white/10">
                                        <AccordionTrigger className={`text-sm hover:no-underline hover:bg-white/5 px-2 rounded font-medium ${dasaPeriod.lord === currentMaha?.lord ? 'text-cosmic-gold' : 'text-blue-300'}`}>
                                            <div className="flex justify-between w-full pr-4">
                                                <span className="flex items-center gap-2">
                                                    {dasaPeriod.lord} Maha Dasa
                                                    {dasaPeriod.lord === currentMaha?.lord && <Badge variant="outline" className="text-[10px] border-cosmic-gold text-cosmic-gold h-4">Current</Badge>}
                                                </span>
                                                <span className="text-xs text-gray-400 font-mono">{dasaPeriod.start} to {dasaPeriod.end}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="bg-black/20 p-2 rounded-b">
                                            <div className="space-y-1">
                                                {dasaPeriod.bhuktis.map((bhukti, bIdx) => (
                                                    <div key={bIdx} className={`grid grid-cols-12 text-xs py-1 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded ${bhukti.lord === currentBhukti?.lord && dasaPeriod.lord === currentMaha?.lord ? 'bg-cosmic-gold/10' : ''}`}>
                                                        <div className={`col-span-3 pl-4 flex items-center gap-2 ${bhukti.lord === currentBhukti?.lord && dasaPeriod.lord === currentMaha?.lord ? 'text-cosmic-gold font-bold' : 'text-pink-300'}`}>
                                                            ▸ {bhukti.lord}
                                                            {bhukti.lord === currentBhukti?.lord && dasaPeriod.lord === currentMaha?.lord && <span className="w-2 h-2 rounded-full bg-cosmic-gold animate-pulse"></span>}
                                                        </div>
                                                        <div className="col-span-9 text-right text-gray-500 font-mono">
                                                            {bhukti.start} - {bhukti.end}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
