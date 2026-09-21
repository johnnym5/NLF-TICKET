import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import Button from './ui/Button';

export default function CountdownTimer({ onAction }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-11-21T09:00:00');
    const calculateTime = () => {
      const difference = targetDate.getTime() - new Date().getTime();
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

  return (
    <div className="w-full">
      <div className="premium-card bg-slate-900 border-none p-12 sm:p-24 text-center relative overflow-hidden">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          <ScrollReveal delay={100}>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sage-base mb-8 block">Event Countdown</span>
            <div className="flex flex-col items-center">
              <div className="text-9xl sm:text-[14rem] font-black text-white leading-none tracking-tighter tabular-nums mb-4">
                {timeLeft.days}
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-16">
                Days Remaining <br className="sm:hidden" /> <span className="text-sage-base/50 text-xl sm:text-3xl tracking-widest font-extrabold uppercase">Until National Carnival</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-3 gap-4 sm:gap-12 max-w-2xl mx-auto mb-16">
            {[
              { label: 'Hours', val: timeLeft.hours },
              { label: 'Minutes', val: timeLeft.minutes },
              { label: 'Seconds', val: timeLeft.seconds }
            ].map((unit) => (
              <div key={unit.label} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <span className="text-3xl sm:text-5xl font-black text-white tabular-nums block mb-1">
                  {unit.val.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>

          <ScrollReveal delay={500}>
            <div className="flex flex-col items-center gap-6">
               <Button size="lg" className="w-full sm:w-auto px-12 py-5 text-lg" icon={ArrowRight} onClick={onAction}>
                 Secure Attendance Pass
               </Button>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Limited capacity official registry</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
