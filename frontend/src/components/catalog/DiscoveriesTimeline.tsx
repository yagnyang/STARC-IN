import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';

const DiscoveriesTimeline: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8000/api/discoveries-by-year')
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

    return (
        <div className="bg-[#0d0d1a] rounded-[8px] border border-[#00d4ff]/30 p-6 relative w-full mb-6 relative">
            <h3 className="font-headline text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00d4ff]"></span> Confirmed Exoplanet Discoveries Over Time
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
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.12} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
                            <XAxis
                                dataKey="year"
                                tick={{ fill: 'white', fontSize: 10, fontFamily: 'monospace' }}
                                tickFormatter={(val) => val % 5 === 0 ? val : ''}
                            />
                            <YAxis
                                label={{ value: 'Discoveries', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 12, style: { textAnchor: 'middle' } }}
                                tick={{ fill: 'white', fontSize: 10, fontFamily: 'monospace' }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0d0d1a', border: '1px solid #00d4ff', fontSize: '10px', fontFamily: 'monospace' }}
                                itemStyle={{ color: '#00d4ff' }}
                                labelStyle={{ color: 'white' }}
                            />
                            <ReferenceLine x={2009} stroke="#f5a623" strokeDasharray="3 3" label={{ value: 'Kepler Launch', fill: '#f5a623', fontSize: 10, position: 'insideTopLeft' }} />
                            <ReferenceLine x={2018} stroke="#f5a623" strokeDasharray="3 3" label={{ value: 'TESS Launch', fill: '#f5a623', fontSize: 10, position: 'insideTopLeft' }} />
                            <Area type="monotone" dataKey="count" stroke="#00d4ff" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default DiscoveriesTimeline;
