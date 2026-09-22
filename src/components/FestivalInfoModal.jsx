import React from 'react';
import {
  X,
  Info,
  Calendar,
  MapPin,
  Ticket,
  ShieldCheck,
  Star,
  Users,
  Utensils,
  Music,
  Gamepad2,
  ShoppingBag,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function FestivalInfoModal({ isOpen, onClose, onRegister }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FBFBFA] rounded-3xl shadow-elevated overflow-hidden max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-6 sm:p-8 border-b border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="text-[#0F4A2F] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              About the Festival
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#0F4A2F] font-sans tracking-tight leading-tight">
              National Livestock Festival 2026
            </h2>
            <p className="text-[#E4B03A] font-extrabold text-sm sm:text-lg uppercase tracking-wide mt-1">
              The Golden Camel and Cow Carnival
            </p>
            <p className="text-slate-500 italic font-medium mt-2 text-sm sm:text-base">
              "Everything camel, everything healthy."
            </p>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
          {/* Quick Metadata Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-[#EBF3EE] flex items-center justify-center text-[#0F4A2F]">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                <p className="text-xs font-black text-slate-700">21 - 23 Nov 2026</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-[#FAF6EC] flex items-center justify-center text-[#E4B03A]">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                <p className="text-xs font-black text-slate-700">Abuja Grounds</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-[#EBF3EE] flex items-center justify-center text-[#0F4A2F]">
                <Ticket className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Gate Policy</p>
                <p className="text-xs font-black text-[#0F4A2F]">100% Free Entry</p>
              </div>
            </div>
          </div>

          {/* Sovereign Endorsement Card */}
          <div className="p-5 rounded-2xl bg-[#FAF6EC] border-2 border-[#FEF3D6] relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Star className="w-24 h-24 text-[#E4B03A]" />
            </div>
            <div className="flex items-start gap-3 relative z-10">
              <div>
                <h4 className="text-xs font-black text-[#E4B03A] uppercase tracking-wider mb-1">Government Endorsement</h4>
                <p className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed">
                  This event is officially backed by the Federal Government of Nigeria (Office of the Vice President) in collaboration with Golden Camel and Cow (GCC). Operating in line with the Renewed Hope Agenda.
                </p>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4 text-[#0F4A2F]" />
              About the Carnival
            </h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              The National Livestock Festival is Nigeria's flagship cultural, entertainment, and economic festival. Celebrating pastoral heritage, livestock tourism, outdoor grilling, live music, and cross-state commerce, this 3-day holiday weekend in Abuja showcases the vibrant spirit and economic potential of our nation's livestock sector.
            </p>
          </div>

          {/* Core Attractions Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Star className="w-4 h-4 text-[#E4B03A]" />
              Core Carnival Attractions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Attraction 1 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-[#D8EADF] transition-colors shadow-sm group">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF3EE] flex items-center justify-center text-[#0F4A2F] shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">Animal Sightseeing</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Champion bulls, golden camels, exotic rams, and interactive petting pens.</p>
                  </div>
                </div>
              </div>

              {/* Attraction 2 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-[#FAF6EC] transition-colors shadow-sm">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF6EC] flex items-center justify-center text-[#E4B03A] shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">Equestrian Races</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Traditional horse derbies, camel sprint heats, and royal Durbar pageantry.</p>
                  </div>
                </div>
              </div>

              {/* Attraction 3 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-[#D8EADF] transition-colors shadow-sm">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF3EE] flex items-center justify-center text-[#0F4A2F] shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">BBQ Village</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Sprawling open-air roasting pits, Suya grilling masters, and fresh cuts.</p>
                  </div>
                </div>
              </div>

              {/* Attraction 4 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-[#FAF6EC] transition-colors shadow-sm">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF6EC] flex items-center justify-center text-[#E4B03A] shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">Live Mainstage</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Nightly music, headline artists, cultural dance, and live comedy.</p>
                  </div>
                </div>
              </div>

              {/* Attraction 5 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-[#D8EADF] transition-colors shadow-sm">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF3EE] flex items-center justify-center text-[#0F4A2F] shrink-0">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">Family Funfair</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Midway rides, inflatable courses, games, and camel joy-rides.</p>
                  </div>
                </div>
              </div>

              {/* Attraction 6 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-[#FAF6EC] transition-colors shadow-sm">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF6EC] flex items-center justify-center text-[#E4B03A] shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">Commercial Bazaar</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Bustling market for fashion, food products, gadgets, and farm gear.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admission Policy */}
          <div className="p-4 rounded-2xl bg-[#EBF3EE] border border-[#B8D8C5] flex items-center gap-3">
            <div className="p-2 rounded-full bg-white text-[#0F4A2F] shrink-0 shadow-sm">
              <Ticket className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm text-[#0F4A2F] font-bold">
              Admission is 100% free with an online registered digital QR pass.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 sm:p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              if (onRegister) onRegister();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0F4A2F] text-white font-black text-sm shadow-card hover:bg-emerald-950 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Get Free Entry Pass</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
