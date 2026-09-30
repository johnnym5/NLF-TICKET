import React, { useEffect } from 'react';
import { X, MapPin, Clock, CheckCircle2, Sparkles, Trophy, Utensils, Music } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import AutoImageCarousel from './AutoImageCarousel';

const iconMap = {
  Trophy: Trophy,
  Utensils: Utensils,
  Music: Music
};

export default function ExperienceDetailModal({ experience, isOpen, onClose }) {
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen || !experience) return null;

  const Icon = iconMap[experience.icon] || Trophy;
  const carouselImages = experience.images || [experience.coverImage, ...(experience.gallery || [])];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 bg-slate-900/80 text-white backdrop-blur-md rounded-full shadow-lg md:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Visual Content Section with Auto 7s Ken Burns Zoom Carousel */}
        <div className="w-full md:w-1/2 p-4 md:p-6 bg-slate-950 flex flex-col justify-between shrink-0">
          <div className="space-y-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-900 font-black text-[10px] uppercase tracking-widest">
                Official Live Experience
              </span>
              <span className="text-[10px] font-bold text-slate-400">7s Ken Burns Zoom</span>
            </div>
          </div>

          <AutoImageCarousel
            images={carouselImages}
            alt={experience.title}
            heightClass="h-64 md:h-[460px]"
          />

          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500" /> {experience.details.location}</div>
            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> {experience.details.schedule}</div>
          </div>
        </div>

        {/* Text Content Section */}
        <div className="w-full md:w-1/2 flex flex-col overflow-y-auto bg-white">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-50 rounded-xl text-[#0F4A2F] border border-emerald-200">
                  <Icon className="w-5 h-5" />
                </div>
                <Badge variant="pending" className="text-[10px] uppercase tracking-widest font-black">Official Carnival Event</Badge>
              </div>
              <h2 id="modal-title" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {experience.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="hidden md:flex p-2.5 hover:bg-slate-100 rounded-full transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6 flex-1">
            {/* Overview Description */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Overview</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                "{experience.details.description}"
              </p>
            </div>

            {/* Key Highlights */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Key Highlights</h4>
              <ul className="grid grid-cols-1 gap-2.5">
                {experience.details.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-800 font-extrabold">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Live Activities Happening at Event */}
            {experience.details.activities && experience.details.activities.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F4A2F] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Live Event Activities
                </h4>
                <div className="space-y-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  {experience.details.activities.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                      <span className="text-emerald-700 font-black shrink-0">•</span>
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto shrink-0">
            <Button className="w-full py-3.5 text-sm" onClick={onClose}>
              Close & Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
