import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function CountdownTimer({ onAction }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2026-11-21T09:00:00');

    const calculateTime = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-12 sm:pb-20 animate-fadeIn">
      <div className="relative bg-white/75 backdrop-blur-2xl rounded-[3rem] sm:rounded-[4rem] border-2 border-white/90 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.2),0_10px_20px_-5px_rgba(30,77,56,0.1),inset_0_2px_0_rgba(255,255,255,1)] overflow-hidden p-8 sm:p-20 text-center">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-sage-base/40 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-champagne-base/40 rounded-full translate-x-1/4 translate-y-1/4 blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <ScrollReveal delay={100} duration={950}>
            <div className="text-8xl sm:text-[18rem] font-black text-slate-900 font-sans tracking-tighter tabular-nums leading-none mb-4 animate-pulse-slow drop-shadow-sm">
              {timeLeft.days}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={250} duration={950}>
            <h2 className="text-3xl sm:text-7xl font-black text-sage-deep uppercase tracking-tight mb-8 drop-shadow-xs">
              Days Left Till The Carnival
            </h2>
          </ScrollReveal>

          <div className="flex flex-col items-center space-y-8 mt-12">
            <ScrollReveal delay={400} duration={950}>
              <div className="text-2xl sm:text-5xl font-black text-slate-800 italic uppercase tracking-[0.1em]">
                Are you ready????
              </div>
            </ScrollReveal>

            <ScrollReveal delay={550} duration={950}>
              <div className="grid grid-cols-3 gap-8 sm:gap-16 pt-4">
                {timeUnits.slice(1).map((unit) => (
                  <div key={unit.label} className="flex flex-col items-center px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200/90 shadow-sm">
                    <span className="text-2xl sm:text-5xl font-black text-slate-900 tabular-nums">
                      {unit.value.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mt-1">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={700} duration={950}>
              <button
                onClick={onAction}
                className="mt-8 px-10 py-5 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-lg sm:text-xl uppercase tracking-wider transition-all hover:scale-105 active:scale-95 border-2 border-slate-800 shadow-[0_12px_28px_-4px_rgba(15,23,42,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] active:translate-y-1"
              >
                Get Your Ticket Here
              </button>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
