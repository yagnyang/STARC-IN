import React, { useEffect, useRef, useState } from 'react';

interface LandingPageProps {
  onLaunch: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    // React has a known bug where the `muted` prop doesn't set the HTML attribute.
    // Setting it directly on the DOM element fixes autoplay in all browsers.
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => { });
    }
  }, []);

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => { });
      setIsMuted(false);
    } else {
      audioRef.current.pause();
      setIsMuted(true);
    }
  };

  return (
    <div className="bg-background text-on-background font-body h-screen w-screen overflow-hidden relative selection:bg-secondary selection:text-on-secondary">
      {/* Background Audio */}
      <audio ref={audioRef} loop>
        <source src="/music.mp3" type="audio/mpeg" />
      </audio>

      {/* Video Background */}
      <video
        ref={videoRef}
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

      {/* Music Toggle Button */}
      <button
        id="music-toggle-btn"
        onClick={toggleMute}
        title={isMuted ? 'Play Music' : 'Mute Music'}
        className="absolute top-6 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/15 hover:border-white/40 backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
      >
        {isMuted ? (
          /* Speaker off icon */
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.2-1.22.83v.91L19 12zM10 8.27L9.18 7.45 10 6.71v1.56zm-1 3.17l-1.45-1.45A.999.999 0 007 11H5v2h1.55l1.45 1.45V11.44z" />
          </svg>
        ) : (
          /* Speaker on icon */
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white/90" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

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
        <p className="font-label text-[13px] tracking-tighter uppercase text-slate-500 break-words whitespace-nowrap">
          © 2024 STARC — Stellar Telemetry and Astronomical Repository and Catalog
        </p>
      </div>

      {/* Subtle Vignette */}
      <div className="fixed inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,18,0.4)_100%)]"></div>
    </div>
  );
};

export default LandingPage;
