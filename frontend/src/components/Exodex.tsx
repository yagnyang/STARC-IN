import React, { useState, useEffect } from 'react';
import { Search, Activity, Star, AlertTriangle, ShieldCheck, Flame, Info } from 'lucide-react';

const Exodex: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showAllHtml, setShowAllHtml] = useState(false);

  useEffect(() => {
    // Load top habitable planets automatically on mount for the "All Planets" initial grid
    fetch(`${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}/api/exodex/leaderboard/habitable?limit=12`)
      .then(r => r.json())
      .then(data => setLeaderboard(data))
      .catch(e => console.error(e));
  }, []);

  const handleSearch = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const q = typeof e === 'string' ? e : query;
    if (!q.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}/api/exodex/planet?name=${encodeURIComponent(q)}`);
      if (!res.ok) {
        throw new Error("Planet not found in ML Model database.");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    if (score >= 20) return 'text-orange-400';
    return 'text-red-500';
  };

  const scoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-400';
    if (score >= 50) return 'bg-yellow-400';
    if (score >= 20) return 'bg-orange-400';
    return 'bg-red-500';
  };

  const getTierIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="w-5 h-5" />;
    if (score >= 50) return <Activity className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-surface-container-low/90 backdrop-blur border-l-4 border-cyan-500 p-8">
        <h2 className="font-headline text-xl font-bold text-cyan-400 uppercase tracking-tighter mb-2">Exodex Planet Personality</h2>
        <p className="text-sm text-outline leading-relaxed mb-6">
          Real-time habitability analysis powered by K-Means clustering and Gradient Boosting ML regression. Displays full astronomical personality cards.
        </p>

        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-outline" />
            </div>
            <input
              type="text"
              className="w-full bg-background/50 border border-primary/20 text-white pl-10 pr-4 py-3 font-mono focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              placeholder="Search planet (e.g. Kepler-452 b, KELT-9 b)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-headline font-bold uppercase tracking-widest px-6 py-3 transition-colors disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Scan'}
          </button>
          {result && (
            <button type="button" onClick={() => { setResult(null); setQuery(''); setShowAllHtml(false); }} className="border border-white/20 text-white font-headline font-bold uppercase tracking-widest px-4 py-3 hover:bg-white/10 flex-shrink-0">Clear</button>
          )}
          <button
            type="button"
            onClick={() => { setShowAllHtml(!showAllHtml); setResult(null); }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-headline font-bold uppercase tracking-widest px-6 py-3 transition-colors flex-shrink-0"
          >
            {showAllHtml ? 'Hide' : 'Show All'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 font-mono text-sm uppercase">
          ERROR: {error}
        </div>
      )}

      {showAllHtml ? (
        <div className="w-full h-[800px] bg-background/50/90 border border-indigo-500/30 rounded-sm mt-8 animate-in fade-in duration-500">
          <iframe src="/starc-pokedex.html" className="w-full h-full border-0 rounded-sm" title="Exoplanet Dataset Grid" />
        </div>
      ) : (
        <>
          {result ? (
            <div className="bg-surface/90 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 mt-8 p-6 lg:p-8 rounded-sm animate-in zoom-in-95 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start border-b border-cyan-500/20 pb-4 mb-4">
                <div>
                  <h3 className="font-headline text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-3">
                    <Star className="text-cyan-400" />
                    {result.planet_name}
                  </h3>
                  <div className="font-mono text-sm text-cyan-400 mt-2 uppercase tracking-widest">
                    {result.archetype_emoji} {result.archetype} Archetype
                  </div>
                  <div className="font-mono text-base text-outline italic mt-1 bg-black/40 border-l-2 border-cyan-500 p-2 w-max max-w-lg leading-relaxed font-bold">
                    "{result.one_liner}"
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-left md:text-right">
                  <div className="text-[13px] uppercase font-mono tracking-widest text-outline mb-1">Final Habitability Score</div>
                  <div className={`font-mono text-5xl font-bold ${scoreColor(result.habitability_score)}`}>
                    {result.habitability_score.toFixed(1)}<span className="text-xl text-outline font-light">/100</span>
                  </div>
                  <div className={`mt-2 flex items-center justify-end gap-2 font-headline text-sm font-bold tracking-widest ${scoreColor(result.habitability_score)}`}>
                    {result.score_emoji} {result.score_tier}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatBox label="Orbital Period" value={result.stats.orbital_period_days ? `${result.stats.orbital_period_days} d` : 'N/A'} />
                <StatBox label="Planet Radius" value={result.stats.planet_radius_earth ? `${result.stats.planet_radius_earth} R⊕` : 'N/A'} />
                <StatBox label="Eq Temp" value={result.stats.eq_temperature_K ? `${result.stats.eq_temperature_K} K` : 'N/A'} />
                <StatBox label="Distance" value={result.stats.distance_parsecs ? `${result.stats.distance_parsecs} pc` : 'N/A'} />
              </div>

              <div className="bg-background/50 border border-white/5 p-6 rounded-sm">
                <h4 className="font-mono text-xs uppercase text-cyan-500 tracking-widest mb-4">ML Component Scores Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(result.component_scores).map(([key, score]: any) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-mono text-sm uppercase text-outline w-1/3 font-bold">{key.replace('_', ' ')}</span>
                      <div className="flex-1 h-3 bg-white/5 mx-4 rounded-full overflow-hidden relative">
                        <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ${scoreBgColor(score)}`} style={{ width: `${score}%` }}></div>
                      </div>
                      <span className="font-mono text-sm text-white w-10 text-right font-bold">{score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <h3 className="font-headline text-sm font-bold text-white uppercase tracking-widest mb-4 border-b border-primary/10 pb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Top Habitable Candidates Grid
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {leaderboard.map((planet, idx) => (
                  <div key={idx} onClick={() => handleSearch(planet.name)} className="bg-surface/80 hover:bg-[#1b1b24] border border-cyan-500/10 hover:border-cyan-500/50 p-4 transition-all cursor-pointer group exodex-card">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-headline font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                        {planet.name}
                      </div>
                      <div className={`font-mono text-sm font-bold ${scoreColor(planet.score)}`}>
                        {planet.score.toFixed(1)}
                      </div>
                    </div>
                    <div className="font-mono text-[13px] text-outline uppercase tracking-widest mb-2 flex items-center gap-1 truncate">
                      <span>{planet.emoji}</span> {planet.archetype}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatBox = ({ label, value }: { label: string, value: string | number }) => (
  <div className="bg-background/50 border border-white/10 p-4">
    <div className="text-sm font-mono uppercase tracking-widest text-outline mb-2 font-bold">{label}</div>
    <div className="font-headline font-bold text-lg text-white">{value}</div>
  </div>
);

export default Exodex;
