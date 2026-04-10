import { useState } from 'react';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';
import StarField from './components/StarField';

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`min-h-screen bg-surface text-white selection:bg-primary/30 ${theme === 'light' ? 'light' : ''}`}>
      <StarField />

      {view === 'landing' ? (
        <LandingPage onLaunch={() => setView('dashboard')} />
      ) : (
        <DashboardPage theme={theme} toggleTheme={toggleTheme} />
      )}
    </div>
  );
}
