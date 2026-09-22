import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import { Scale, CheckCircle2, AlertTriangle, ClipboardCheck, ChevronRight } from 'lucide-react';

export default function ComplianceView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 space-y-16">
      <ScrollReveal delay={100}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-champagne-base text-champagne-text flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">Compliance & Safety</h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            The National Livestock Festival adheres to all Federal regulations and international pastoral standards.
          </p>
        </div>
      </ScrollReveal>

      <div className="space-y-12">
        <ScrollReveal delay={200}>
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border-2 border-slate-200/80 p-8 sm:p-12 shadow-md space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-champagne-text" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Regulatory Framework</h2>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Operating in full compliance with the Federal Ministry of Livestock Development. All exhibits, livestock parades, and food pavilions have been audited for safety and hygiene by official health stewards.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-champagne-text" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Health & Safety</h2>
              </div>
              <ul className="space-y-3">
                {[
                  "Mandatory veterinary screening for all livestock entrants.",
                  "Strict food safety protocols for the Barbeque and Suya pavilions.",
                  "Crowd control measures at Old Parade Ground to ensure attendee comfort.",
                  "Zero-tolerance policy for animal mistreatment during the carnival."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-champagne-text" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Terms of Entry</h2>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Admission is 100% free but requires valid accreditation. The Steering Committee reserves the right to refuse entry or remove individuals who do not comply with the carnival safety protocols.
              </p>
            </section>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal delay={400}>
        <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-slate-200/60">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Compliance Hub</p>
          <p className="text-slate-600 font-black">compliance@nlf.gov.ng</p>
        </div>
      </ScrollReveal>
    </div>
  );
}
