import React, { useState, useEffect } from 'react';
import {
  Activity, Database, BookOpen, Verified, Star,
  Github, CheckCircle, Globe, ArrowRight, X, Play, MessageSquare,
  Sun, Moon, HelpCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import AladinViewer from './AladinViewer';
import ESASkyModal from './ESASkyModal';
import DiscoveriesTimeline from './catalog/DiscoveriesTimeline';
import StatCards from './catalog/StatCards';
import DiscoveryMethods from './catalog/DiscoveryMethods';
import HabitableZone from './catalog/HabitableZone';
import SizeDistribution from './catalog/SizeDistribution';
import Exodex from './Exodex';
import Vortex from './Vortex';
import LearningModule from './LearningModule';

interface DashboardPageProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'repository' | 'catalog' | 'exodex' | 'vortex'>('telemetry');
  const [loading, setLoading] = useState(true);
  const [runningEtl, setRunningEtl] = useState(false);
  const [showESASky, setShowESASky] = useState(false);
  const [showLearningModule, setShowLearningModule] = useState(false);

  const [metrics, setMetrics] = useState({
    exoplanets: '-', hosts: '-', methods: '-', firstYear: '-', validation: '-'
  });
  const [discoveryData, setDiscoveryData] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [habitableZoneData, setHabitableZoneData] = useState<any[]>([]);
  const [radiusDistData, setRadiusDistData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, dRes, tRes, hRes, rRes, hjRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/metrics`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/discovery-methods`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/timeline`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/habitable-zone`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/radius-distribution`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/hot-jupiters`).then(r => r.json()),
        ]);

        if (mRes.exoplanets) setMetrics(mRes);
        if (dRes.length) setDiscoveryData(dRes);
        if (tRes.length) setTimelineData(tRes);
        if (hRes.length) setHabitableZoneData(hRes);
        if (rRes.length) setRadiusDistData(rRes);

      } catch (error) {
        console.error("Failed to fetch dashboard data. Make sure the backend is running.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEducate = () => {
    setShowESASky(true);
  };
  const navItems = [
    { id: 'telemetry', label: 'Telemetry', icon: Activity },
    { id: 'repository', label: 'Repository', icon: Database },
    { id: 'catalog', label: 'Catalog', icon: BookOpen },
    { id: 'exodex', label: 'Exodex', icon: Verified },
    { id: 'vortex', label: 'Vortex', icon: MessageSquare },
  ] as const;

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-[#0b0b0e]' : 'bg-background'} relative`}>
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col h-screen w-64 ${theme === 'dark' ? 'bg-[#1b1b20]/90' : 'bg-surface/90'} backdrop-blur-md border-r border-primary/10 fixed left-0 top-0 z-50`}>
        <div className="px-6 py-8">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-6 h-6 text-primary fill-current" />
            <span className="text-primary font-headline font-bold text-xl tracking-tighter uppercase">STARC</span>
          </div>
          <div className="font-mono text-[13px] text-outline uppercase tracking-[0.2em] mb-8">v2.0.4-STABLE</div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 font-headline text-sm uppercase tracking-widest transition-all ${isActive
                    ? 'bg-surface-container text-primary border-r-2 border-primary'
                    : 'text-outline opacity-70 hover:text-primary hover:bg-surface-container'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button
            onClick={handleEducate}
            className="w-full bg-primary text-on-primary py-3 flex justify-center items-center gap-2 font-headline font-bold text-xs uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            Educate
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 md:ml-64 ${theme === 'dark' ? 'bg-surface/40' : 'bg-surface/60'} backdrop-blur-sm pb-12 min-h-screen`}>
        {/* Header */}
        <header className={`${theme === 'dark' ? 'bg-[#131318]/80' : 'bg-surface/80'} backdrop-blur-md flex items-center justify-between w-full px-8 py-6 sticky top-0 z-40 border-b border-primary/10`}>
          <div className="flex flex-col">
            <h1 className="font-headline font-extrabold text-3xl tracking-tighter uppercase leading-none text-primary">STARC</h1>
            <p className="font-mono text-[13px] text-outline mt-1 uppercase tracking-tighter">Stellar Telemetry and Astronomical Repository and Catalog</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:block text-right">
              <div className="text-[13px] font-mono text-outline uppercase tracking-widest">System Status</div>
              <div className="flex items-center gap-2 justify-end">
                <span className="w-2 h-2 rounded-full animate-pulse bg-primary"></span>
                <span className="text-xs font-mono uppercase text-primary">All Nodes Operational</span>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 border border-outline/20 px-4 py-2 hover:bg-surface-container transition-colors group"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-outline group-hover:text-primary" />
              ) : (
                <Moon className="w-4 h-4 text-outline group-hover:text-primary" />
              )}
              <span className={`font-headline text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
            <button
              onClick={() => setShowLearningModule(true)}
              className="flex items-center gap-2 border border-outline/20 px-4 py-2 hover:bg-surface-container transition-colors group"
              title="Help & Tutorial"
            >
              <HelpCircle className="w-4 h-4 text-outline group-hover:text-primary" />
              <span className={`font-headline text-xs font-bold uppercase tracking-widest hidden md:inline ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Help</span>
            </button>
            <a href="https://github.com/yagnyang/STARC-INC" target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-outline/20 px-4 py-2 hover:bg-surface-container transition-colors group">
              <Github className="w-4 h-4 text-outline group-hover:text-primary" />
              <span className={`font-headline text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-black'}`}>View on GitHub</span>
            </a>
          </div>
        </header>

        {/* Repository tab fills the full main area — no padding wrapper */}
        <div className={activeTab === 'repository' ? 'block' : 'hidden'}>
          <AladinViewer />
        </div>

        <div className={activeTab !== 'repository' ? 'block' : 'hidden'}>
          <div className="px-8 space-y-8 mt-8">
            {/* Tagline */}
            <div className="border-l-4 bg-surface-container-low/80 backdrop-blur-md px-6 py-4 border-primary">
              <p className="font-mono text-xs text-outline leading-relaxed">
                End-to-end ETL pipeline // NASA Exoplanet Archive // DuckDB Core // STARC-SKY Validation Protocol v4.2
              </p>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-primary font-mono animate-pulse">
                ESTABLISHING UPLINK TO DUCKDB CORE...
              </div>
            ) : (
              <>
                {/* TELEMETRY TAB */}
                {activeTab === 'telemetry' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Pipeline Status */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {['Ingestion', 'Transformation', 'Load', 'STARC-SKY'].map((step) => (
                        <div key={step} className="bg-surface-container-low/90 backdrop-blur border border-primary/30 p-4 flex flex-col gap-3 relative overflow-hidden">
                          <div className="flex justify-between items-start">
                            <span className="font-headline text-[13px] font-bold uppercase tracking-[0.2em] text-primary">{step}</span>
                            <CheckCircle className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-2xl font-mono text-white">COMPLETE</div>
                          <div className="h-1 w-full bg-primary/20">
                            <div className="h-full w-full bg-primary"></div>
                          </div>
                        </div>
                      ))}
                    </section>

                    {/* Key Metrics */}
                    <section className="flex flex-wrap gap-1">
                      {[
                        { label: 'Exoplanets', value: metrics.exoplanets },
                        { label: 'Host Stars', value: metrics.hosts },
                        { label: 'Methods', value: metrics.methods },
                        { label: 'First Year', value: metrics.firstYear },
                        { label: 'Validation', value: metrics.validation },
                      ].map((metric) => (
                        <div key={metric.label} className="flex-1 min-w-[140px] bg-surface-container/90 backdrop-blur p-6 border-b border-primary/10 hover:bg-surface-container-high transition-colors">
                          <div className="text-[13px] font-headline text-outline uppercase tracking-widest mb-2">{metric.label}</div>
                          <div className="text-3xl lg:text-4xl font-mono font-bold text-primary">{metric.value}</div>
                        </div>
                      ))}
                    </section>

                    {/* Charts Grid */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Discoveries Over Time */}
                      <div className="bg-surface-container/90 backdrop-blur p-6 relative lg:col-span-2">
                        <h3 className="font-headline text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-primary"></span> Discoveries Cumulative
                        </h3>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineData}>
                              <Line type="monotone" dataKey="value" stroke="#d000ff" strokeWidth={2} dot={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#110022', border: '1px solid #d000ff', fontSize: '10px' }}
                                itemStyle={{ color: '#d000ff' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between mt-4 font-mono text-[11px] text-outline">
                          <span>{timelineData[0]?.year || '1992'}</span>
                          <span>{timelineData[timelineData.length - 1]?.year || '2024'}</span>
                        </div>
                      </div>

                      {/* Planet Radius Distribution */}
                      <div className="bg-surface-container/90 backdrop-blur p-6 relative">
                        <h3 className="font-headline text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-primary"></span> Radius Dist (R_Earth)
                        </h3>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={radiusDistData}>
                              <Bar dataKey="value" fill="#d000ff">
                                {radiusDistData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fillOpacity={0.2 + (index * 0.15)} />
                                ))}
                              </Bar>
                              <Tooltip
                                contentStyle={{ backgroundColor: '#110022', border: '1px solid #d000ff', fontSize: '10px' }}
                                itemStyle={{ color: '#d000ff' }}
                              />
                              <XAxis dataKey="range" hide />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between mt-4 font-mono text-[11px] text-outline">
                          {radiusDistData.map(d => <span key={d.range}>{d.range}</span>)}
                        </div>
                      </div>
                    </section>
                  </div>
                )}



                {/* CATALOG TAB */}
                {activeTab === 'catalog' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <DiscoveriesTimeline />
                    <StatCards />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <DiscoveryMethods />
                      <HabitableZone />
                    </div>
                    <SizeDistribution />
                  </div>
                )}

                {/* EXODEX ML VIEWER (REPLACES LEGACY VALIDATION) */}
                {activeTab === 'exodex' && (
                  <>
                    <Exodex />
                    <Vortex />
                  </>
                )}

                {/* VORTEX INDIVIDUAL TAB */}
                {activeTab === 'vortex' && (
                  <Vortex />
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 bg-[#131318]/90 backdrop-blur-md border-t border-primary/10 px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-2 text-center md:text-left">
              <div className="text-[13px] font-mono tracking-tighter uppercase text-primary">STARC-OS © 2024 PRECISION TELEMETRY</div>
              <div className="text-[12px] font-mono text-outline uppercase tracking-tight">Data source: NASA Exoplanet Archive (NExScI)</div>
            </div>
            <div className="flex gap-4">
              {['Python', 'DuckDB', 'Pandas', 'Express', 'React'].map(link => (
                <span key={link} className="text-outline text-[13px] font-mono uppercase">{link}</span>
              ))}
            </div>
          </div>
        </footer>
        {showESASky && <ESASkyModal onClose={() => setShowESASky(false)} />}
        {showLearningModule && <LearningModule onClose={() => setShowLearningModule(false)} theme={theme} />}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#131318]/95 backdrop-blur-lg border-t border-primary/10 flex justify-around items-center py-4 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-outline opacity-70'}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[11px] font-headline uppercase">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
};

export default DashboardPage;
