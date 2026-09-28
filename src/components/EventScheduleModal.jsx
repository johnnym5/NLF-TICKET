import React, { useState } from 'react';
import { X, Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Tag, Sparkles } from 'lucide-react';

export const SCHEDULE_DAYS = [
  {
    dayNumber: 1,
    dayLabel: 'Day 1',
    dateLabel: 'Saturday, 21 November 2026',
    title: 'Sovereign Opening & Ceremonial Parade',
    events: [
      {
        time: '08:00 AM – 09:30 AM',
        title: 'Public Gate Opening & Delegate Registration',
        location: 'Main Entrance Gates',
        track: 'Ceremonial & Protocol'
      },
      {
        time: '09:30 AM – 11:30 AM',
        title: 'Sovereign Opening Ceremony & Presidential Address',
        location: 'Main Ceremonial Grandstand',
        track: 'Ceremonial & Protocol'
      },
      {
        time: '11:30 AM – 01:00 PM',
        title: 'Grand Durbar Equestrian Procession & Royal Cavalry Parade',
        location: 'Central Track (Zone 3)',
        track: 'Equestrian & Sports'
      },
      {
        time: '01:00 PM – 02:30 PM',
        title: 'Opening of Twilight Suya & Artisanal Culinary Village',
        location: 'SW West Field (Zone 2)',
        track: 'Culinary & Evening'
      },
      {
        time: '02:30 PM – 04:30 PM',
        title: 'Purebred Cattle, Bull & Camel Preliminary Judging',
        location: 'NW West Field (Zone 1)',
        track: 'Livestock Judging'
      },
      {
        time: '04:30 PM – 06:00 PM',
        title: 'Agribusiness, Tech & Vendor Exhibition Launch',
        location: 'East Complex (Zone 4)',
        track: 'B2B & Trade'
      },
      {
        time: '06:30 PM – 09:30 PM',
        title: 'Cultural Unity Performance & Evening Musical Showcase',
        location: 'Main Stage Arena',
        track: 'Culinary & Evening'
      }
    ]
  },
  {
    dayNumber: 2,
    dayLabel: 'Day 2',
    dateLabel: 'Sunday, 22 November 2026',
    title: 'Championship Judging & Agribusiness Expo',
    events: [
      {
        time: '08:30 AM – 10:30 AM',
        title: 'Supreme Champion Livestock Judging (Bulls, Cows & Camels)',
        location: 'Central Ring (Zone 3)',
        track: 'Livestock Judging'
      },
      {
        time: '10:30 AM – 12:30 PM',
        title: 'High-Speed Royal Horse Racing Knockout Rounds',
        location: 'Central Track (Zone 3)',
        track: 'Equestrian & Sports'
      },
      {
        time: '12:30 PM – 02:00 PM',
        title: 'MoorBeta Poultry, Small Ruminant & Aquaculture Expo',
        location: 'East Complex (Zone 4)',
        track: 'Livestock Judging'
      },
      {
        time: '02:00 PM – 04:00 PM',
        title: 'National Agribusiness Investment & Export Matchmaking Roundtable',
        location: 'B2B Executive Pavilion',
        track: 'B2B & Trade'
      },
      {
        time: '04:00 PM – 06:00 PM',
        title: 'Live-Weight Pricing System & Digital E-Tagging Demonstration',
        location: 'NW West Field (Zone 1)',
        track: 'B2B & Trade'
      },
      {
        time: '06:00 PM – 10:00 PM',
        title: 'Open-Flame Master Suya Chef Competition & Festival Feast',
        location: 'Culinary Village (Zone 2)',
        track: 'Culinary & Evening'
      }
    ]
  },
  {
    dayNumber: 3,
    dayLabel: 'Day 3',
    dateLabel: 'Monday, 23 November 2026',
    title: 'Cultural Pageantry, Grand Finals & Finale Concert',
    events: [
      {
        time: '09:00 AM – 11:00 AM',
        title: 'Monumental Ijele Masquerade & Cultural Parade',
        location: 'Main Grandstand Track',
        track: 'Ceremonial & Protocol'
      },
      {
        time: '11:00 AM – 01:00 PM',
        title: 'Supreme Champion Trophies & Awards Ceremony',
        location: 'Main Ceremonial Grandstand',
        track: 'Livestock Judging'
      },
      {
        time: '01:00 PM – 03:00 PM',
        title: 'Commercial Supply Chain & Cold-Chain Trade Deal Signing',
        location: 'B2B Executive Pavilion',
        track: 'B2B & Trade'
      },
      {
        time: '03:00 PM – 05:00 PM',
        title: 'Final Championship Horse Race & Exhibition Parade',
        location: 'Central Track (Zone 3)',
        track: 'Equestrian & Sports'
      },
      {
        time: '05:00 PM – 06:30 PM',
        title: 'Official Sovereign Closing Ceremony',
        location: 'Main Stage',
        track: 'Ceremonial & Protocol'
      },
      {
        time: '06:30 PM – 10:30 PM',
        title: 'Grand Festival Finale Concert & Celebratory Showcase',
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
              <h2 className="text-base sm:text-lg font-black tracking-tight">Official Event Schedule</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                National Livestock Festival 2026 • Abuja
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Day Selector Tabs / Slide Navigation */}
        <div className="bg-slate-100 p-2 sm:p-3 border-b border-slate-200 flex items-center justify-between shrink-0 gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl bg-white text-slate-700 hover:bg-slate-200 shadow-sm transition-colors shrink-0 flex items-center gap-1 text-xs font-bold"
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
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                    isActive
                      ? 'bg-sage-deep text-white shadow-md scale-105 ring-2 ring-sage-deep/20'
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
            className="p-2 rounded-xl bg-white text-slate-700 hover:bg-slate-200 shadow-sm transition-colors shrink-0 flex items-center gap-1 text-xs font-bold"
            title="Next Day"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Active Slide Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
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
                className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-sage-border shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[11px] font-bold shadow-xs">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{item.time}</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${trackStyle}`}>
                      {item.track}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-sage-deep transition-colors pt-1">
                    {item.title}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{item.location}</span>
                  </div>
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
                className={`h-2.5 rounded-full transition-all ${
                  idx === activeSlide ? 'w-8 bg-sage-deep' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Go to Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
              Swipe or click arrows to view other days
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all"
            >
              Close Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
