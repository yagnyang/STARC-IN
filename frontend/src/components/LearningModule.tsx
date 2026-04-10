import React, { useState } from 'react';
import { Activity, Database, BookOpen, Verified, MessageSquare, X, ChevronRight, ChevronLeft, Rocket } from 'lucide-react';

interface LearningModuleProps {
    onClose: () => void;
    theme: 'dark' | 'light';
}

const steps = [
    {
        title: "Welcome to STARC",
        description: "Your Stellar Telemetry and Astronomical Repository and Catalog. This guide will walk you through the core features of the system.",
        icon: Rocket
    },
    {
        title: "Telemetry",
        description: "View real-time ingestion, pipeline status, and key metrics dynamically updated from the NASA Exoplanet Archive.",
        icon: Activity
    },
    {
        title: "Repository",
        description: "Explore the interactive Aladin sky viewer to observe celestial bodies and deep space imagery in real time.",
        icon: Database
    },
    {
        title: "Catalog",
        description: "Browse detailed statistical breakdowns, including discovery timelines, sizing, and habitable zone distributions.",
        icon: BookOpen
    },
    {
        title: "Exodex",
        description: "Dive deep into machine-learning classified exoplanets with rich habitability metrics and planetary personalities.",
        icon: Verified
    },
    {
        title: "Vortex",
        description: "Engage with the encrypted, anonymous forum for discussing anomalous data, signals, and community analysis.",
        icon: MessageSquare
    }
];

const LearningModule: React.FC<LearningModuleProps> = ({ onClose, theme }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const CurrentIcon = steps[currentStep].icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
            <div className={`relative w-full max-w-md p-8 shadow-2xl border ${theme === 'dark' ? 'bg-[#1b1b20] border-primary/30 text-white' : 'bg-surface text-background border-primary'} animate-in slide-in-from-bottom-4 duration-300`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-outline hover:text-primary transition-colors"
                    aria-label="Close tutorial"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mt-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 border border-primary/40">
                        <CurrentIcon className="w-8 h-8 text-primary" />
                    </div>

                    <h2 className="font-headline font-bold text-xl uppercase tracking-widest mb-3 text-primary h-8">
                        {steps[currentStep].title}
                    </h2>
                    <p className="font-mono text-sm leading-relaxed mb-8 opacity-90 h-24 sm:h-20 flex items-center justify-center">
                        {steps[currentStep].description}
                    </p>

                    <div className="w-full flex items-center justify-between">
                        <div className="flex gap-2">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-primary' : 'w-2 bg-outline/30'}`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={`p-2 border transition-colors ${currentStep === 0 ? 'border-outline/20 opacity-30 cursor-not-allowed' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
                                aria-label="Previous step"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 font-headline text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                            >
                                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                                {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningModule;
