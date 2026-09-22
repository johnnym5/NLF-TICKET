import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import { Database, UserCheck, QrCode, BarChart, ChevronRight } from 'lucide-react';

export default function RegistryView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 space-y-16">
      <ScrollReveal delay={100}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-6 shadow-elevated">
            <Database className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">Official Attendee Registry</h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            The central source of truth for all National Livestock Festival 2026 accreditations.
          </p>
        </div>
      </ScrollReveal>

      <div className="space-y-12">
        <ScrollReveal delay={200}>
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border-2 border-slate-200/80 p-8 sm:p-12 shadow-md space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-slate-800" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Accreditation Process</h2>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Our digital registry ensures a seamless and transparent entry process. Upon registration, each attendee is assigned a unique GCC-2026 identifier synced across our cloud infrastructure.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-slate-800" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Real-Time Verification</h2>
              </div>
              <ul className="space-y-3">
                {[
                  "Automated pass generation with high-contrast QR technology.",
                  "Zero-latency synchronization with gate staff scanners.",
                  "Transparent wristband allocation based on registry tier.",
                  "Integrated duplicate entry detection and fraud prevention."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 font-medium">
                    <ChevronRight className="w-4 h-4 mt-1 text-slate-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <BarChart className="w-5 h-5 text-slate-800" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Public Accountability</h2>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                The registry provides anonymized, real-time turnout telemetry to the Steering Committee to manage venue capacity at Old Parade Ground and ensure public safety.
              </p>
            </section>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal delay={400}>
        <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-slate-200/60">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Registry Inquiries</p>
          <p className="text-slate-600 font-black">registry@nlf.gov.ng</p>
        </div>
      </ScrollReveal>
    </div>
  );
}
