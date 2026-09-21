import React, { useEffect, useState } from 'react';
import { X, MapPin, Clock, CheckCircle2, ChevronLeft, ChevronRight, Trophy, Utensils, Music } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import Button from './ui/Button';
import Badge from './ui/Badge';

const iconMap = {
  Trophy: Trophy,
  Utensils: Utensils,
  Music: Music
};

export default function ExperienceDetailModal({ experience, isOpen, onClose }) {
  const [activeImage, setActiveImage] = useState(experience?.coverImage);

  // Reset active image when experience changes
  useEffect(() => {
    if (experience) {
      setActiveImage(experience.coverImage);
    }
  }, [experience]);

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md md:hidden"
        >
          <X className="w-5 h-5 text-slate-900" />
        </button>

        {/* Visual Content Section */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-slate-100">
          <img
            src={activeImage}
            alt={experience.title}
            className="w-full h-full object-cover transition-opacity duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent md:bg-gradient-to-r" />

          {/* Gallery Thumbnails */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            {[experience.coverImage, ...experience.gallery].map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  activeImage === img ? 'border-sage-base scale-110 shadow-lg' : 'border-white/40 hover:border-white'
                }`}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        {/* Text Content Section */}
        <div className="w-full md:w-1/2 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-sage-light rounded-lg text-sage-deep">
                  <Icon className="w-5 h-5" />
                </div>
                <Badge variant="pending" className="text-[10px] uppercase tracking-widest font-black">Festival Event</Badge>
              </div>
              <h2 id="modal-title" className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {experience.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="hidden md:flex p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Details */}
          <div className="p-8 space-y-8 flex-1">
            {/* Context Badges */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>{experience.details.location}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Clock className="w-4 h-4 text-sage-deep" />
                <span>{experience.details.schedule}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Overview</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                "{experience.details.description}"
              </p>
            </div>

            {/* Highlights */}
            <div className="space-y-4 pb-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Key Highlights</h4>
              <ul className="grid grid-cols-1 gap-3">
                {experience.details.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 font-bold">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
            <Button className="w-full py-4 h-auto text-base" onClick={onClose}>
              Back to Main Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
