import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const StatCards: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}/api/stats`)
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

    const cards = [
        { key: 'total_exoplanets', label: 'Confirmed Exoplanets' },
        { key: 'unique_host_stars', label: 'Host Star Systems' },
        { key: 'transit_count', label: 'Transit Detections' },
        { key: 'radial_velocity_count', label: 'Radial Velocity Detections' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d1a]/80 rounded-[8px] z-10 w-full h-[100px]">
                    <Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" />
                </div>
            )}

            {error && !loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d1a]/80 rounded-[8px] z-10 w-full h-[100px]">
                    <span className="text-red-500 font-mono text-xs uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded">Failed to load</span>
                </div>
            )}

            {cards.map((card, idx) => (
                <div key={idx} className="bg-[#0d0d1a] rounded-[8px] border border-[#00d4ff]/30 border-l-4 border-l-[#00d4ff] p-6 flex flex-col justify-center h-[100px]">
                    <div className="text-[#00d4ff] font-mono text-3xl font-bold">
                        {data ? data[card.key] : '-'}
                    </div>
                    <div className="text-gray-400 font-headline text-xs uppercase tracking-widest mt-1">
                        {card.label}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatCards;
