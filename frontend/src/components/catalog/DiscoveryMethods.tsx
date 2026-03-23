import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { Loader2 } from 'lucide-react';

const DiscoveryMethods: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8000/api/discovery-methods')
            .then((res) => {
                if (!res.ok) throw new Error('Fetch failed');
                return res.json();
            })
            .then((data) => {
                // Sort descending
                const sorted = data.sort((a: any, b: any) => b.count - a.count);
                setData(sorted);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError(true);
                setLoading(false);
            });
    }, []);

    return (
        <div className="bg-[#0d0d1a] rounded-[8px] border border-[#00d4ff]/30 p-6 relative h-[350px]">
            <h3 className="font-headline text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00d4ff]"></span> Exoplanets by Discovery Method
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
                        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="method"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'white', fontSize: 10, fontFamily: 'monospace' }}
                            />
                            <Tooltip
                                cursor={{ fill: '#1a1a2e' }}
                                contentStyle={{ backgroundColor: '#0d0d1a', border: '1px solid #00d4ff', fontSize: '10px', fontFamily: 'monospace' }}
                                itemStyle={{ color: '#00d4ff' }}
                            />
                            <Bar dataKey="count" fill="#00d4ff" radius={[0, 4, 4, 0]} barSize={16}>
                                <LabelList dataKey="count" position="right" fill="#f5a623" fontSize={10} fontFamily="monospace" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default DiscoveryMethods;
