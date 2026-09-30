import React, { useState } from 'react';
import { X, Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const SCHEDULE_DAYS = [
  {
    dayNumber: 1,
    dayLabel: 'Day 1',
    dateLabel: 'Saturday, 21 November 2026',
    title: 'Grand Opening, Presidential Commission & Livestock Parade',
    events: [
      {
        time: '08:00 - 10:00 AM',
        title: 'VIP Reception & Security',
        details: 'VIP Arrival, Red Carpet Reception & Security Sweep by Police, Military & Agro-Rangers.',
        location: 'VIP Arrival & Reception Gate',
        track: 'Ceremonial & Protocol'
      },
      {
        time: '10:00 - 12:30 PM',
        title: 'Opening Parade & Ribbon Cutting',
        details: 'Official opening of Livestock Pavilion & Grand Parade of prize dairy cattle, camels, and bulls by the Hon. Minister of Livestock.',
        location: 'Main Ceremonial Grandstand',
        track: 'Ceremonial & Protocol'
      },
      {
        time: '13:00 - 16:00 PM',
        title: 'E-Tagging & Vet Showcase',
        details: 'Arena 1: RFID tracking demo. Tech Hub: Modern husbandry workshop.',
        location: 'Arena 1 & Tech Hub',
        track: 'Livestock Judging'
      },
      {
        time: '17:00 - 21:00 PM',
        title: 'Cultural Heritage Night',
        details: 'Kano Durbar Horsemen Display, Live Cultural Troupes, and Opening Fireworks.',
        location: 'Main Stage Arena',
        track: 'Culinary & Evening'
      }
    ]
  },
  {
    dayNumber: 2,
    dayLabel: 'Day 2',
    dateLabel: 'Sunday, 22 November 2026',
    title: 'Agro-Investment Summit, Pastoralist Forum & Concert Night 1',
    events: [
      {
        time: '09:00 - 11:30 AM',
        title: 'Concurrent Forums',
        details: 'Marquee 1: Investors Roundtable. Hall B: Agropreneur Financing Workshop.',
        location: 'Marquee 1 & Hall B',
        track: 'B2B & Trade'
      },
      {
        time: '12:00 - 15:00 PM',
        title: 'Live Auction & Tech Fair',
        details: 'Auction Arena: Livestock Auction with RFID bidding. Exhibition: Meat/Dairy Tech.',
        location: 'Auction Arena & Exhibition Hall',
        track: 'B2B & Trade'
      },
      {
        time: '15:30 - 18:00 PM',
        title: 'Pastoralist Forum',
        details: 'MACBAN & Kautal Hore Dialogue, Regional Cooperative Harmonization & Awards.',
        location: 'B2B Executive Pavilion',
        track: 'B2B & Trade'
      },
      {
        time: '18:30 - 23:00 PM',
        title: 'Live Concert Night 1',
        details: 'Gala Dinner, Stand-Up Comedy, and Headlining Concert featuring Top Nigerian Artist #1.',
        location: 'Main Stage Arena',
        track: 'Culinary & Evening'
      }
    ]
  },
  {
    dayNumber: 3,
    dayLabel: 'Day 3',
    dateLabel: 'Monday, 23 November 2026',
    title: 'Commercial B2B Matchmaking, Breed Awards & Grand Finale Concert',
    events: [
      {
        time: '09:00 - 12:00 PM',
        title: 'Commercial B2B Matchmaking',
        details: 'Direct trade agreements signing between commercial investors and pastoralist cooperatives.',
        location: 'B2B Executive Pavilion',
        track: 'B2B & Trade'
      },
      {
        time: '13:00 - 15:00 PM',
        title: 'Awards & Recognition',
        details: 'Exhibitor Recognition, Breed Champions Awards, & Pastoralist Cooperative Grants.',
        location: 'Main Ceremonial Grandstand',
        track: 'Livestock Judging'
      },
      {
        time: '15:30 - 17:30 PM',
        title: 'Closing Press Conference',
        details: 'Communique Readout by Steering Committee & Media Q&A Session.',
        location: 'Press Briefing Room',
        track: 'Ceremonial & Protocol'
      },
      {
        time: '18:00 - 23:00 PM',
        title: 'Grand Finale Concert',
        details: 'Closing Festival Party featuring superstar Top Nigerian Artist #2 and Laser Light Show.',
        location: 'Main Stage Arena',
        track: 'Culinary & Evening'
      }
    ]
  }
];

const trackColorMap = {
  'Ceremonial & Protocol': 'bg-amber-100 text-amber-900 border-amber-200',
  'Equestrian & Sports': 'bg-emerald-100 text-emerald-900 border-emerald-200',
  'Culinary & Evening': 'bg-rose-100 text-rose-900 border-rose-200',
  'Livestock Judging': 'bg-blue-100 text-blue-900 border-blue-200',
  'B2B & Trade': 'bg-purple-100 text-purple-900 border-purple-200'
};

export default function EventScheduleModal({ isOpen, onClose }) {
  const [activeSlide, setActiveSlide] = useState(0);

  if (!isOpen) return null;

  const currentDay = SCHEDULE_DAYS[activeSlide];

  const handlePrev = () => {
    setActiveSlide((prev) => (prev > 0 ? prev - 1 : SCHEDULE_DAYS.length - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev < SCHEDULE_DAYS.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-md transition-all animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage-deep flex items-center justify-center text-emerald-300 border border-emerald-800 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Official 3-Day Itinerary</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                National Livestock Festival 2026 • Abuja
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Day Selector Tabs / Slide Navigation */}
        <div className="bg-slate-100 p-2 sm:p-3 border-b border-slate-200 flex items-center justify-between shrink-0 gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl bg-white text-slate-700 hover:bg-slate-200 shadow-sm transition-colors shrink-0 flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Slide Indicator Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto justify-center flex-1">
            {SCHEDULE_DAYS.map((day, idx) => {
              const isActive = idx === activeSlide;
              return (
                <button
                  key={day.dayNumber}
                  onClick={() => setActiveSlide(idx)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0F4A2F] text-white shadow-md scale-105 ring-2 ring-[#0F4A2F]/20'
                      : 'bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span className="font-extrabold">{day.dayLabel}</span>
                  <span className="hidden sm:inline opacity-80 text-[10px] ml-1.5">({day.dateLabel.split(',')[0]})</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-xl bg-white text-slate-700 hover:bg-slate-200 shadow-sm transition-colors shrink-0 flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="Next Day"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Active Slide Header */}
        <div className="px-6 py-4 bg-[#0F4A2F] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-widest">
                {currentDay.dayLabel}
              </span>
              <span className="text-xs font-bold text-emerald-200">{currentDay.dateLabel}</span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5 text-white">
              {currentDay.title}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-300 bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-700/50 self-start sm:self-center shrink-0">
            Slide {activeSlide + 1} of 3
          </span>
        </div>

        {/* Slide Event List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {currentDay.events.map((item, index) => {
            const trackStyle = trackColorMap[item.track] || 'bg-slate-100 text-slate-800 border-slate-200';
            return (
              <div
                key={index}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-sage-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5 group"
              >
                <div className="flex items-center gap-2 flex-wrap justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 text-amber-400 font-mono text-[11px] font-bold shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{item.time}</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${trackStyle}`}>
                    {item.track}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-900 group-hover:text-[#0F4A2F] transition-colors">
                    {item.title}
                  </h4>
                  {item.details && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                      {item.details}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold pt-1 border-t border-slate-100 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{item.location}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Carousel Dots & Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            {SCHEDULE_DAYS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === activeSlide ? 'w-8 bg-[#0F4A2F]' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Go to Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
              Click arrows or tabs to view Day 1, 2, or 3
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Close Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
