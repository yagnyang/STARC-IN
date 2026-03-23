import React, { useState, useEffect } from 'react';
import {
  Activity, Database, BookOpen, Verified, Star,
  Github, CheckCircle, Globe, ArrowRight, X, Play
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

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'repository' | 'catalog' | 'validation'>('telemetry');
  const [loading, setLoading] = useState(true);
  const [runningEtl, setRunningEtl] = useState(false);
  const [showESASky, setShowESASky] = useState(false);

  // ML Pipeline State
  const [mlLogs, setMlLogs] = useState<{ type: string, text: string }[]>([]);
  const [mlRunning, setMlRunning] = useState(false);
  const [mlComplete, setMlComplete] = useState(false);

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
          fetch('http://localhost:5001/api/metrics').then(r => r.json()),
          fetch('http://localhost:5001/api/discovery-methods').then(r => r.json()),
          fetch('http://localhost:5001/api/timeline').then(r => r.json()),
          fetch('http://localhost:5001/api/habitable-zone').then(r => r.json()),
          fetch('http://localhost:5001/api/radius-distribution').then(r => r.json()),
          fetch('http://localhost:5001/api/hot-jupiters').then(r => r.json()),
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

  const handleRunML = () => {
    if (mlRunning) return;
    setMlRunning(true);
    setMlComplete(false);
    setMlLogs([{ type: 'info', text: 'Initializing ML Pipeline connection...' }]);

    const source = new EventSource('http://localhost:5001/api/run-ml');

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'start') {
        setMlLogs(prev => [...prev, { type: 'info', text: data.msg }]);
      } else if (data.type === 'log') {
        setMlLogs(prev => [...prev, { type: data.isError ? 'error' : 'log', text: data.msg }]);
      } else if (data.type === 'done') {
        setMlRunning(false);
        setMlComplete(true);
        if (data.code === 0) {
          setMlLogs(prev => [...prev, { type: 'success', text: 'Pipeline completed successfully.' }]);
        } else {
          setMlLogs(prev => [...prev, { type: 'error', text: `Pipeline exited with code ${data.code}.` }]);
        }
        source.close();
      }
    };

    source.onerror = (err) => {
      console.error('SSE Error', err);
      source.close();
      setMlRunning(false);
    };
  };

  const navItems = [
    { id: 'telemetry', label: 'Telemetry', icon: Activity },
    { id: 'repository', label: 'Repository', icon: Database },
    { id: 'catalog', label: 'Catalog', icon: BookOpen },
    { id: 'validation', label: 'Validation', icon: Verified },
  ] as const;

  return (
    <div className="flex min-h-screen bg-[#0b0b0e] relative">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 bg-[#1b1b20]/90 backdrop-blur-md border-r border-primary/10 fixed left-0 top-0 z-50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-6 h-6 text-primary fill-current" />
            <span className="text-primary font-headline font-bold text-xl tracking-tighter uppercase">STARC</span>
          </div>
          <div className="font-mono text-[10px] text-outline uppercase tracking-[0.2em] mb-8">v2.0.4-STABLE</div>

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
            className="w-full bg-primary text-white py-3 flex justify-center items-center gap-2 font-headline font-bold text-xs uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            Educate
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 bg-surface/40 backdrop-blur-sm pb-12 min-h-screen">
        {/* Header */}
        <header className="bg-[#131318]/80 backdrop-blur-md flex items-center justify-between w-full px-8 py-6 sticky top-0 z-40 border-b border-primary/10">
          <div className="flex flex-col">
            <h1 className="font-headline font-extrabold text-3xl tracking-tighter uppercase leading-none text-primary">STARC</h1>
            <p className="font-mono text-[10px] text-outline mt-1 uppercase tracking-tighter">Stellar Telemetry and Astronomical Repository and Catalog</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:block text-right">
              <div className="text-[10px] font-mono text-outline uppercase tracking-widest">System Status</div>
              <div className="flex items-center gap-2 justify-end">
                <span className="w-2 h-2 rounded-full animate-pulse bg-primary"></span>
                <span className="text-xs font-mono uppercase text-primary">All Nodes Operational</span>
              </div>
            </div>
            <a href="https://github.com/YOUR_USERNAME/STARC" target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-outline/20 px-4 py-2 hover:bg-surface-container transition-colors group">
              <Github className="w-4 h-4 text-outline group-hover:text-primary" />
              <span className="font-headline text-xs font-bold text-white uppercase tracking-widest">View on GitHub</span>
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
                            <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{step}</span>
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
                          <div className="text-[10px] font-headline text-outline uppercase tracking-widest mb-2">{metric.label}</div>
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
                        <div className="flex justify-between mt-4 font-mono text-[8px] text-outline">
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
                        <div className="flex justify-between mt-4 font-mono text-[8px] text-outline">
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

                {/* VALIDATION TAB (ML PIPELINE) */}
                {activeTab === 'validation' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <section className="bg-surface-container-low/90 backdrop-blur border-l-4 border-[#d000ff] p-8">
                      <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div className="lg:w-1/3">
                          <h2 className="font-headline text-xl font-bold text-[#d000ff] uppercase tracking-tighter mb-4">Real-Time ML Pipeline</h2>
                          <p className="text-sm text-outline leading-relaxed mb-6">
                            Execute the STARC Machine Learning sequence. This process runs the Random Forest Planet Type Classifier and the K-Means + DBSCAN Planet Clustering modules, generating insights directly from the duckdb telemetry layer.
                          </p>
                          <button
                            onClick={handleRunML}
                            disabled={mlRunning}
                            className={`w-full py-3 px-4 flex items-center justify-center gap-2 font-headline font-bold text-xs uppercase tracking-widest transition-all ${mlRunning
                              ? 'bg-[#d000ff]/20 text-[#d000ff] cursor-not-allowed border border-[#d000ff]/30'
                              : 'bg-[#d000ff] text-white hover:brightness-110 active:scale-95'
                              }`}
                          >
                            <Play className={`w-4 h-4 ${mlRunning ? 'animate-pulse' : 'fill-current'}`} />
                            {mlRunning ? 'Executing...' : 'Initialize ML Pipeline'}
                          </button>
                        </div>
                        <div className="flex-1 w-full bg-[#0b0b0e] border border-primary/20 p-4 font-mono text-xs h-[300px] overflow-y-auto flex flex-col gap-1 rounded shadow-inner relative">
                          {mlLogs.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-outline/50 uppercase tracking-widest text-[10px]">
                              Awaiting Initialization Sequence...
                            </div>
                          ) : (
                            mlLogs.map((log, idx) => (
                              <div key={idx} className={`${log.type === 'error' ? 'text-red-400' :
                                log.type === 'success' ? 'text-green-400' :
                                  log.type === 'info' ? 'text-blue-400' : 'text-outline/80'
                                }`}>
                                <span className="text-primary/40 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log.text}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </section>

                    {/* ML OUTPUTS GRID */}
                    {mlComplete && (
                      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h3 className="font-headline text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-primary/10 pb-4">
                          <span className="w-2 h-2 bg-[#d000ff]"></span> Pipeline Artifacts Generated
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { title: 'Planet Type Classifier - Confusion Matrix', file: 'confusion_matrix.png' },
                            { title: 'Classifier Feature Importance', file: 'feature_importance.png' },
                            { title: 'Planetary Clustering Results', file: 'planet_clusters.png' },
                            { title: 'Cluster vs Actual Label Comparison', file: 'cluster_vs_label.png' },
                            { title: 'DBSCAN Anomaly Detection Outliers', file: 'dbscan_outliers.png' },
                          ].map((item, id) => (
                            <div key={id} className="bg-surface-container/90 backdrop-blur border border-primary/10 p-4">
                              <h4 className="text-[10px] font-mono uppercase text-primary mb-4 truncate" title={item.title}>
                                {item.title}
                              </h4>
                              <div className="aspect-video bg-[#0b0b0e] rounded overflow-hidden flex items-center justify-center border border-white/5 relative group">
                                <img
                                  src={`http://localhost:5001/api/ml-outputs/${item.file}`}
                                  alt={item.title}
                                  className="w-full h-full object-contain p-2"
                                />
                                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                  <span className="bg-primary px-3 py-1 font-headline text-[10px] uppercase font-bold text-white rounded shadow-xl tracking-widest">Analysis View</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 bg-[#131318]/90 backdrop-blur-md border-t border-primary/10 px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-2 text-center md:text-left">
              <div className="text-[10px] font-mono tracking-tighter uppercase text-primary">STARC-OS © 2024 PRECISION TELEMETRY</div>
              <div className="text-[9px] font-mono text-outline uppercase tracking-tight">Data source: NASA Exoplanet Archive (NExScI)</div>
            </div>
            <div className="flex gap-4">
              {['Python', 'DuckDB', 'Pandas', 'Express', 'React'].map(link => (
                <span key={link} className="text-outline text-[10px] font-mono uppercase">{link}</span>
              ))}
            </div>
          </div>
        </footer>
        {showESASky && <ESASkyModal onClose={() => setShowESASky(false)} />}
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
              <span className="text-[8px] font-headline uppercase">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
};

export default DashboardPage;
