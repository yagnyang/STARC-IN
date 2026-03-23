import React from 'react';

interface LandingPageProps {
  onLaunch: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  return (
    <div className="bg-background text-on-background font-body h-screen w-screen overflow-hidden relative selection:bg-secondary selection:text-on-secondary">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Starfield Background */}
      <div className="absolute inset-0 z-10 overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-background/50 to-background/90 pointer-events-none">
        {/* Static Stars generated via CSS */}
        <div className="absolute bg-white rounded-full pointer-events-none w-px h-px top-[10%] left-[20%] opacity-40 animate-[twinkle-static_5s_infinite]"></div>
        <div className="absolute bg-white rounded-full pointer-events-none w-[2px] h-[2px] top-[45%] left-[80%] opacity-60 animate-[twinkle-static_7s_infinite_1s]"></div>
        <div className="absolute bg-white rounded-full pointer-events-none w-px h-px top-[70%] left-[15%] opacity-30 animate-[twinkle-static_4s_infinite_0.5s]"></div>
        <div className="absolute bg-white rounded-full pointer-events-none w-[2px] h-[2px] top-[25%] left-[65%] opacity-50 animate-[twinkle-static_6s_infinite_2s]"></div>
        <div className="absolute bg-white rounded-full pointer-events-none w-px h-px top-[85%] left-[40%] opacity-40 animate-[twinkle-static_8s_infinite_1.5s]"></div>
        <div className="absolute bg-white rounded-full pointer-events-none w-px h-px top-[35%] left-[90%] opacity-20 animate-[twinkle-static_5s_infinite_0.2s]"></div>
        <div className="absolute bg-white rounded-full pointer-events-none w-[2px] h-[2px] top-[60%] left-[55%] opacity-70 animate-[twinkle-static_9s_infinite]"></div>
        <div className="absolute bg-white rounded-full pointer-events-none w-px h-px top-[15%] left-[45%] opacity-30 animate-[twinkle-static_6s_infinite_3s]"></div>
      </div>

      {/* Cinematic Overlay Details */}
      <div className="absolute inset-0 pointer-events-none border-[40px] border-background/50 z-20"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 pointer-events-none z-10"></div>

      {/* Main Content Canvas */}
      <main className="relative z-30 flex flex-col items-center justify-center h-full w-full px-6">
        <div className="text-center group flex flex-col items-center">
          {/* STARC Title */}
          <h1 className="font-headline font-extrabold text-[clamp(4rem,15vw,12rem)] leading-none tracking-tighter text-[#f0f0ff] animate-breath title-blur-hover cursor-default drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            STARC
          </h1>
          {/* Subtitle */}
          <p className="font-label text-[clamp(0.6rem,1.2vw,0.85rem)] tracking-[0.5em] text-on-surface-variant uppercase mt-8 animate-fade-up">
            STELLAR TELEMETRY AND ASTRONOMICAL REPOSITORY AND CATALOG
          </p>
          {/* CTA Button */}
          <div className="mt-16 animate-fade-button flex justify-center w-full">
            <button
              onClick={onLaunch}
              className="relative group px-12 py-4 border border-on-surface/30 bg-transparent hover:border-primary hover:text-primary transition-all duration-500 ease-out hover:scale-105 active:scale-95 overflow-hidden font-label text-sm tracking-[0.3em] font-medium text-on-surface uppercase whitespace-nowrap cursor-pointer"
            >
              {/* Glow effect container */}
              <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500"></span>
              <span className="relative z-10 group-hover:drop-shadow-[0_0_8px_rgba(255,45,120,0.8)] transition-all duration-500">
                LAUNCH MISSION CONTROL
              </span>
              {/* Decorative corner details */}
              <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-on-surface/40 group-hover:border-primary transition-colors duration-500"></div>
              <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-on-surface/40 group-hover:border-primary transition-colors duration-500"></div>
            </button>
          </div>
        </div>
      </main>

      {/* Mandatory Footer text injection */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-20 pointer-events-none">
        <p className="font-label text-[10px] tracking-tighter uppercase text-slate-500 break-words whitespace-nowrap">
          © 2024 STARC — Stellar Telemetry and Astronomical Repository and Catalog
        </p>
      </div>

      {/* Subtle Vignette */}
      <div className="fixed inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,18,0.4)_100%)]"></div>
    </div>
  );
};

export default LandingPage;
