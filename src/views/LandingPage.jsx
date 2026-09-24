import React, { useState, useEffect } from 'react';
import { useAuth, TIER_LABELS, TIER_WRISTBANDS } from '../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Calendar, 
  MapPin, 
  ArrowRight,
  CheckCircle2,
  Trophy,
  Music,
  Utensils,
  ChevronRight,
  Info,
  Ticket
} from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';
import ScrollReveal from '../components/ScrollReveal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { FESTIVAL_EXPERIENCES } from '../data/experienceData';
import ExperienceDetailModal from '../components/ExperienceDetailModal';
import FestivalInfoModal from '../components/FestivalInfoModal';

export function getRoundTicketCount(count) {
  const num = Number(count) || 0;
  if (num <= 10) return "10+";
  if (num <= 50) return `${Math.floor(num / 10) * 10}+`;
  if (num <= 100) return `${Math.floor(num / 10) * 10}+`;
  if (num <= 250) return `${Math.floor(num / 50) * 50}+`;
  if (num <= 500) return `${Math.floor(num / 50) * 50}+`;
  if (num <= 1000) return `${Math.floor(num / 100) * 100}+`;
  if (num <= 5000) return `${Math.floor(num / 500) * 500}+`;
  return `${Math.floor(num / 1000) * 1000}+`;
}

export default function LandingPage({ onClaimPass, vipTier = 'REGULAR' }) {
  const { currentUser, attendeeRecord } = useAuth();
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [totalTickets, setTotalTickets] = useState(0);

  const hasTicket = Boolean(currentUser && attendeeRecord?.ticketCode);
  const isVip = vipTier && vipTier !== 'REGULAR';
  const tierName = TIER_LABELS[vipTier] || 'General Entry';
  const wristbandColor = TIER_WRISTBANDS[vipTier] || TIER_WRISTBANDS.REGULAR;

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const statsRef = doc(db, 'eventStats', 'global');
      unsubscribe = onSnapshot(statsRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.totalRegistrations !== undefined) {
            setTotalTickets(data.totalRegistrations);
          }
        }
      }, (err) => {
        console.warn('Error fetching eventStats for landing page:', err);
      });
    } catch (err) {
      console.warn('Failed to listen to eventStats:', err);
    }
    return () => unsubscribe();
  }, []);

  return (
    <div className="pb-24">
      {/* Top Floating Action & Stats Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-8 sm:pt-12 px-4">
        <button
          onClick={() => setInfoModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EBF3EE] border border-[#B8D8C5] text-[#0F4A2F] text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:bg-[#D8EADF] transition-all active:scale-95"
        >
          <Info className="w-4 h-4" />
          <span>Festival Info</span>
        </button>

        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-100 text-xs font-black uppercase tracking-wider shadow-sm">
          <Ticket className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
          <span>
            {hasTicket
              ? `YOU AND OVER ${getRoundTicketCount(totalTickets)} OTHERS HAVE ALREADY GOTTEN THEIR TICKET`
              : `WITH OVER ${getRoundTicketCount(totalTickets)} PEOPLE ALREADY GOTTEN THEIR TICKET`}
          </span>
        </div>
      </div>

      {/* VIP Invitation Header */}
      {isVip && (
        <ScrollReveal delay={50} direction="down">
          <div className="max-w-7xl mx-auto px-4 pt-6">
            <div className="bg-champagne-light border border-champagne-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm border border-champagne-border">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">Official VIP Invitation</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Dispatched as <span className="font-bold text-amber-700">{tierName}</span> • Executive Area Access</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="gold">{wristbandColor} Wristband</Badge>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 lg:pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 hero-gradient pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal delay={100}>
            <span className="section-label">Official Event Platform</span>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[1] mb-6">
              National Livestock <br />
              <span className="text-sage-deep">Festival 2026</span>
            </h1>
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-[1px] w-8 bg-champagne-border hidden sm:block" />
              <p className="text-lg sm:text-2xl font-extrabold text-champagne-text tracking-tight uppercase">
                The Golden Camel and Cow Carnival
              </p>
              <div className="h-[1px] w-8 bg-champagne-border hidden sm:block" />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="max-w-2xl mx-auto mb-8">
              <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed italic">
                “Everything camel, everything healthy.”: Celebrating Nigeria's vibrant pastoral heritage and the future of livestock excellence.
              </p>
            </div>
          </ScrollReveal>

          {/* Dynamic Social Proof Ticket Badge */}
          <ScrollReveal delay={400}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900 text-white border border-emerald-500/30 shadow-xl mb-12 max-w-2xl mx-auto backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">
                <Ticket className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-emerald-100 text-center sm:text-left leading-snug">
                {hasTicket
                  ? `YOU AND OVER ${getRoundTicketCount(totalTickets)} OTHERS HAVE ALREADY GOTTEN THEIR TICKET`
                  : `WITH OVER ${getRoundTicketCount(totalTickets)} PEOPLE ALREADY GOTTEN THEIR TICKET`}
              </p>
            </div>
          </ScrollReveal>

          {/* Quick Actions */}
          <ScrollReveal delay={500}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button size="lg" icon={ArrowRight} onClick={onClaimPass}>
                {currentUser ? 'View My Digital Pass' : 'Get My Entry Pass'}
              </Button>
              <Button variant="secondary" size="lg" icon={Info}>
                Event Schedule
              </Button>
            </div>
          </ScrollReveal>

          {/* Key Info Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <ScrollReveal delay={700}>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Date</span>
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Calendar className="w-4 h-4 text-sage-deep" />
                  <span>Nov 21 – 23, 2026</span>
                </div>
              </div>
            </ScrollReveal>
            <div className="w-[1px] h-8 bg-slate-200 hidden sm:block" />
            <ScrollReveal delay={800}>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Venue</span>
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>Old Parade Ground, Abuja</span>
                </div>
              </div>
            </ScrollReveal>
            <div className="w-[1px] h-8 bg-slate-200 hidden sm:block" />
            <ScrollReveal delay={900}>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission</span>
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>100% Free Entry</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="max-w-7xl mx-auto px-4 mb-24">
        <ScrollReveal delay={200}>
          <div className="premium-card p-1">
            <CountdownTimer onAction={onClaimPass} />
          </div>
        </ScrollReveal>
      </section>

      {/* Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 mb-24">
        <div className="text-center mb-12">
          <span className="section-label">Festival Experience</span>
          <h2 className="text-3xl font-black text-slate-900">What to Expect</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FESTIVAL_EXPERIENCES.map((item, idx) => {
            const Icon = { Trophy, Utensils, Music }[item.icon];
            return (
              <ScrollReveal key={item.id} delay={200 * idx} className="h-full">
                <div
                  onClick={() => setSelectedExperience(item)}
                  className="premium-card h-full p-8 hover:border-sage-border hover:shadow-lg group transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-sage-light transition-colors">
                    <Icon className="w-6 h-6 text-slate-600 group-hover:text-sage-deep" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                    {item.shortDesc}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-black text-sage-deep opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    <span>Learn more</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Experience Detail Modal */}
      <ExperienceDetailModal
        experience={selectedExperience}
        isOpen={!!selectedExperience}
        onClose={() => setSelectedExperience(null)}
      />

      {/* Festival Info Modal */}
      <FestivalInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        onRegister={onClaimPass}
      />

      {/* Official Footnote */}
      <section className="max-w-2xl mx-auto px-4">
        <ScrollReveal delay={150}>
          <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
            <Info className="w-6 h-6 text-slate-400 mx-auto mb-4" />
            <p className="text-sm text-slate-600 font-bold leading-relaxed mb-6">
              The National Livestock Festival operates in alignment with the <strong className="text-slate-900">Renewed Hope Agenda</strong> of the Federal Government of Nigeria.
            </p>
            <button
              onClick={onClaimPass}
              className="text-sage-deep font-black hover:underline text-xs uppercase tracking-widest"
            >
              Secure your free digital pass today
            </button>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
