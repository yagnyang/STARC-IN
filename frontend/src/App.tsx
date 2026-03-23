import { useState } from 'react';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';
import StarField from './components/StarField';

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');

  return (
    <div className="min-h-screen bg-surface text-white selection:bg-primary/30">
      <StarField />
      
      {view === 'landing' ? (
        <LandingPage onLaunch={() => setView('dashboard')} />
      ) : (
        <DashboardPage />
      )}
    </div>
  );
}
