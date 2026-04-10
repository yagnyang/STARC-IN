import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts';
import { Loader2 } from 'lucide-react';

const HabitableZone: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}/api/habitable-candidates`)
            .then((res) => {
                if (!res.ok) throw new Error('Fetch failed');
                return res.json();
            })
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError(true);
                setLoading(false);
            });
    }, []);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-[#0d0d1a] border border-[#00d4ff] p-2 text-[10px] font-mono">
                    <p className="text-[#00d4ff] mb-1 font-bold">{data.pl_name}</p>
                    <p className="text-white">Host: {data.hostname}</p>
                    <p className="text-white">Temp: {data.eq_temp} K</p>
                    <p className="text-white">Radius: {data.radius} R⊕</p>
                    <p className="text-gray-400">Distance: {data.distance_pc} pc</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#0d0d1a] rounded-[8px] border border-[#00d4ff]/30 p-6 relative h-[350px]">
            <h3 className="font-headline text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#f5a623]"></span> Habitable Zone Candidates
            </h3>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d1a]/80 rounded-[8px] z-10">
                    <Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" />
                </div>
            )}

            {error && !loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d1a]/80 rounded-[8px] z-10">
                    <span className="text-red-500 font-mono text-xs uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded">Failed to load</span>
                </div>
            )}

            <div className="h-[250px] w-full">
                {!loading && !error && data.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                            <XAxis
                                type="number"
                                dataKey="eq_temp"
                                name="Equilibrium Temperature"
                                domain={[0, 1000]} // Setting domain to give context around habitable zone
                                tick={{ fill: 'white', fontSize: 10, fontFamily: 'monospace' }}
                                label={{ value: 'Equilibrium Temperature (K)', position: 'insideBottom', offset: -15, fill: 'white', fontSize: 10 }}
                            />
                            <YAxis
                                type="number"
                                dataKey="radius"
                                name="Planet Radius"
                                domain={[0, 5]}
                                tick={{ fill: 'white', fontSize: 10, fontFamily: 'monospace' }}
                                label={{ value: 'Planet Radius (Earth Radii)', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                            {/* Habitable Zone Shading */}
                            {/* @ts-ignore */}
                            <ReferenceArea x1={200} x2={350} y1={0} y2={2} fill="#00ff9f" fillOpacity={0.15} ifOverflow="hidden" />

                            <Scatter name="Candidates" data={data} fill="#f5a623" />
                        </ScatterChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default HabitableZone;
