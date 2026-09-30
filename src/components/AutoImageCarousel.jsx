import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AutoImageCarousel({ images = [], alt = 'Carnival Image', heightClass = 'h-72 sm:h-96' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [key, setKey] = useState(0); // Force key restart for smooth Ken Burns zoom reset

  if (!images || images.length === 0) {
    return (
      <div className={`w-full ${heightClass} bg-slate-900 flex items-center justify-center text-slate-500 font-bold`}>
        No Images Available
      </div>
    );
  }

  // 7-second auto-switch timer
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setKey((prev) => prev + 1);
    }, 7000);

    return () => clearInterval(timer);
  }, [images.length, currentIndex]);

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setKey((prev) => prev + 1);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setKey((prev) => prev + 1);
  };

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden rounded-2xl bg-slate-900 group`}>
      {/* Images Stack with Smooth Fade and Ken Burns Slow Zoom */}
      {images.map((imgUrl, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={`${imgUrl}-${idx}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              key={`zoom-${key}-${idx}`}
              src={imgUrl}
              alt={`${alt} ${idx + 1}`}
              className={`w-full h-full object-cover transition-transform duration-[7000ms] ease-out ${
                isActive ? 'scale-110' : 'scale-100'
              }`}
              loading="lazy"
            />
          </div>
        );
      })}

      {/* Subtle Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none z-20" />

      {/* Animated 7-Second Progress Bar */}
      {images.length > 1 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30 overflow-hidden">
          <div
            key={`progress-${key}-${currentIndex}`}
            className="h-full bg-amber-400 animate-progress-7s"
          />
        </div>
      )}

      {/* Manual Slide Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Previous Image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Next Image (Auto 7s)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Slide Indicator Dots & Image Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                  setKey((k) => k + 1);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/50 hover:bg-white'
                }`}
                title={`Image ${idx + 1}`}
              />
            ))}
          </div>

          <span className="text-[10px] font-mono font-bold text-white/80 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20">
            {currentIndex + 1} / {images.length} • 7s Timer
          </span>
        </div>
      )}
    </div>
  );
}
