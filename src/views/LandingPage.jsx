import React from 'react';
import { useAuth, TIER_LABELS, TIER_WRISTBANDS } from '../context/AuthContext';
import { 
  Calendar, 
  MapPin, 
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Milk,
  Trophy,
  Flame,
  Music,
  Utensils
} from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';
import ScrollReveal from '../components/ScrollReveal';

export default function LandingPage({ onClaimPass, vipTier = 'REGULAR', onSelectTier }) {
  const { currentUser } = useAuth();
  const isVip = vipTier && vipTier !== 'REGULAR';
  const tierName = TIER_LABELS[vipTier] || 'General Entry';
  const wristbandColor = TIER_WRISTBANDS[vipTier] || TIER_WRISTBANDS.REGULAR;

  return (
    <div className="space-y-12 sm:space-y-20 pb-20">
      {/* VIP Invitation Header Banner Indicator */}
      {isVip && (
        <ScrollReveal delay={50} direction="down" duration={700}>
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <div className="bg-gradient-to-r from-champagne-light via-white to-champagne-light border-2 border-champagne-border rounded-2xl p-4 text-center shadow-md animate-fadeIn">
              <p className="text-xs uppercase font-black tracking-widest text-champagne-text">
                👑 VIP INVITATION UNLOCKED
              </p>
              <h2 className="text-base font-black text-slate-900 mt-1">
                You have been dispatched an official seat as a <span className="text-amber-700">{tierName}</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Physical Wristband Allocation: <strong className="text-slate-800">{wristbandColor}</strong> • Old Parade Ground Executive VVIP Area
              </p>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Giant Countdown Section - Fades in first */}
      <ScrollReveal delay={80} duration={1000}>
        <div className="pt-6 sm:pt-10">
          <CountdownTimer onAction={onClaimPass} />
        </div>
      </ScrollReveal>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Playful atmospheric gradient accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sage-base/40 via-champagne-base/30 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Primary Event Title - Independent fade-in */}
          <ScrollReveal delay={150} duration={900}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 font-sans tracking-tight leading-[1.1]">
              National Livestock <br className="hidden sm:block" />
              <span className="text-sage-deep">Festival 2026</span>
            </h1>
          </ScrollReveal>

          {/* Sub-brand Title - Independent fade-in */}
          <ScrollReveal delay={300} duration={900}>
            <div className="mt-6 flex items-center justify-center gap-2 text-xl sm:text-3xl font-extrabold text-champagne-text">
              <span className="tracking-wide text-shadow-sm">The Golden Camel and Cow Carnival</span>
            </div>
          </ScrollReveal>

          {/* Official Tagline - Independent fade-in */}
          <ScrollReveal delay={450} duration={900}>
            <p className="mt-6 text-lg sm:text-2xl text-slate-600 font-bold italic">
              “Everything camel, everything healthy.”
            </p>
          </ScrollReveal>

          {/* Key Event Badges - Staggered 1-by-1 fade in */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <ScrollReveal delay={550} direction="up" duration={800}>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-slate-300 shadow-md text-sm sm:text-base text-slate-800 font-bold hover:-translate-y-0.5 transition-all">
                <Calendar className="w-5 h-5 text-sage-deep" />
                <span>Nov 21 – 23, 2026</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={700} direction="up" duration={800}>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-slate-300 shadow-md text-sm sm:text-base text-slate-800 font-bold hover:-translate-y-0.5 transition-all">
                <MapPin className="w-5 h-5 text-rose-600" />
                <span>Old Parade Ground, Abuja</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={850} direction="up" duration={800}>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50/85 backdrop-blur-md border-2 border-emerald-400 shadow-md text-sm sm:text-base text-status-successText font-black hover:-translate-y-0.5 transition-all">
                <CheckCircle2 className="w-5 h-5" />
                <span>100% Free Entry</span>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

      {/* Fun Carnival Highlights - Staggered 1-by-1 fade in for each card */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ScrollReveal delay={150} direction="up" duration={950} className="h-full">
            <div className="h-full bg-white/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-slate-300/80 shadow-[0_16px_36px_-6px_rgba(15,23,42,0.12),inset_0_1.5px_0_rgba(255,255,255,0.95)] hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sage-base/90 text-sage-deep border-2 border-sage-border flex items-center justify-center mx-auto shadow-md">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Livestock Showcase</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Experience a grand parade of the nation's finest livestock including cows, goats, camels, dogs, and many more.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={350} direction="up" duration={950} className="h-full">
            <div className="h-full bg-white/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-slate-300/80 shadow-[0_16px_36px_-6px_rgba(15,23,42,0.12),inset_0_1.5px_0_rgba(255,255,255,0.95)] hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-champagne-base/90 text-champagne-text border-2 border-champagne-border flex items-center justify-center mx-auto shadow-md">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Barbeque, Suya & More</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Indulge in an explosion of flavors with authentic Suya, grilled meats, and local delicacies.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={550} direction="up" duration={950} className="h-full">
            <div className="h-full bg-white/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-slate-300/80 shadow-[0_16px_36px_-6px_rgba(15,23,42,0.12),inset_0_1.5px_0_rgba(255,255,255,0.95)] hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-100/90 text-rose-600 border-2 border-rose-300 flex items-center justify-center mx-auto shadow-md">
                <Music className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Cultural Gala</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Enjoy 3 days of non-stop music, traditional dances, and vibrant pastoral heritage celebrations.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Simple Gate Logic Note - Staggered fade in */}
      <section className="max-w-3xl mx-auto px-4 text-center space-y-6">
        <ScrollReveal delay={150} direction="up" duration={900}>
          <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-slate-300/80 shadow-md">
             <p className="text-sm sm:text-base text-slate-700 font-bold leading-relaxed">
              Operating in line with the <strong className="text-slate-900">Renewed Hope Agenda</strong>. Federal Government of Nigeria in collaboration with Golden Camel and Cow (GCC).
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={350} direction="up" duration={900}>
          <button
            onClick={onClaimPass}
            className="text-sage-deep font-black hover:underline text-sm uppercase tracking-widest transition-all"
          >
            Already registered? Sign in to access your ticket
          </button>
        </ScrollReveal>
      </section>
    </div>
  );
}
