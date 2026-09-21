import React, { useState, useEffect } from 'react';
import { Lock, Delete, X, ShieldCheck } from 'lucide-react';
import CryptoJS from 'crypto-js';

export default function PinLock({ onUnlock, onSetPin, isSetting = false }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeypad = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleClear = () => setPin('');

  useEffect(() => {
    if (pin.length === 4) {
      const hash = CryptoJS.SHA256(pin).toString();
      if (isSetting) {
        onSetPin(hash);
        setPin('');
      } else {
        if (hash === localStorage.getItem('gcc_gate_pin_hash')) {
          onUnlock();
          setPin('');
        } else {
          setError(true);
          setPin('');
          setTimeout(() => setError(false), 500);
        }
      }
    }
  }, [pin, isSetting, onUnlock, onSetPin]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-8 select-none">
      <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-8 shadow-2xl">
        <Lock className={`w-8 h-8 ${error ? 'text-rose-500 animate-shake' : 'text-emerald-500'}`} />
      </div>

      <div className="text-center mb-12">
        <h2 className="text-white text-lg font-black uppercase tracking-widest mb-2">
          {isSetting ? 'Set System PIN' : 'Terminal Locked'}
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          {isSetting ? 'Assign a 4-digit code for rapid access' : 'Enter operational code to unlock'}
        </p>
      </div>

      {/* Indicators */}
      <div className="flex gap-6 mb-16">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
            pin.length > i ? 'bg-emerald-500 border-emerald-500 scale-125' : 'border-slate-800'
          } ${error ? 'border-rose-500' : ''}`} />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-[320px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handleKeypad(num)}
            className="h-20 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-white text-3xl font-black transition-all border border-transparent hover:border-slate-800"
          >
            {num}
          </button>
        ))}
        <div />
        <button onClick={() => handleKeypad(0)}
          className="h-20 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-white text-3xl font-black transition-all border border-transparent hover:border-slate-800"
        >
          0
        </button>
        <button onClick={handleClear}
          className="h-20 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-colors"
        >
          <Delete className="w-8 h-8" />
        </button>
      </div>

      <div className="mt-16 flex items-center gap-2 text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
         <ShieldCheck className="w-3 h-3" />
         Encrypted Local State
      </div>
    </div>
  );
}
