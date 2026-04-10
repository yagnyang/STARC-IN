import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import { Loader2 } from 'lucide-react';

const SizeDistribution: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}/api/size-distribution`)
            .then((res) => {
                if (!res.ok) throw new Error('Fetch failed');
                return res.json();
            })
            .then((data) => {
                // Sort by sort_order
                const sorted = data.sort((a: any, b: any) => a.sort_order - b.sort_order);
                setData(sorted);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError(true);
                setLoading(false);
            });
    }, []);

    // Standard STARC color sequence
    const colors = ['#f5a623', '#00d4ff', '#7b61ff', '#ff4f6d', '#00ff9f', '#ffffff'];

    return (
        <div className="bg-[#0d0d1a] rounded-[8px] border border-[#00d4ff]/30 p-6 relative w-full mt-6">
            <h3 className="font-headline text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#7b61ff]"></span> Planet Radius Distribution Across Catalog
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

            <div className="h-[300px] w-full">
                {!loading && !error && data.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
                            <XAxis
                                dataKey="bin"
                                tick={{ fill: 'white', fontSize: 10, fontFamily: 'monospace' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                label={{ value: 'Number of Planets', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 12 }}
                                tick={{ fill: 'white', fontSize: 10, fontFamily: 'monospace' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#1a1a2e' }}
                                contentStyle={{ backgroundColor: '#0d0d1a', border: '1px solid #7b61ff', fontSize: '10px', fontFamily: 'monospace' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                                <LabelList dataKey="count" position="top" fill="white" fontSize={10} fontFamily="monospace" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="mt-4 text-center font-mono text-[10px] text-gray-400">
                Legend: Rocky → Super-Earth → Neptune-like → Gas Giant → Super-Jupiter → Ultra-giant
            </div>
        </div>
    );
};

export default SizeDistribution;
