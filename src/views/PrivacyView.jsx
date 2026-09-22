import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import { Shield, Lock, Eye, FileText, ChevronRight } from 'lucide-react';

export default function PrivacyView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 space-y-16">
      <ScrollReveal delay={100}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sage-base text-sage-deep flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            Protecting your personal data is a priority for the National Livestock Festival Steering Committee.
          </p>
        </div>
      </ScrollReveal>

      <div className="space-y-12">
        <ScrollReveal delay={200}>
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border-2 border-slate-200/80 p-8 sm:p-12 shadow-md space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-sage-deep" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Data Collection</h2>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                We collect essential information to facilitate your event accreditation, including your full name, email address, and ticket tier. This data is securely stored using Google Firebase (Firestore) and is only accessible by authorized event stewards.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-sage-deep" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">How We Use Your Info</h2>
              </div>
              <ul className="space-y-3">
                {[
                  "Generating your unique scannable QR Digital Pass.",
                  "Real-time gate verification and wristband issuance.",
                  "Official attendance telemetry for ministerial reporting.",
                  "Emergency notifications regarding event schedule changes."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 font-medium">
                    <ChevronRight className="w-4 h-4 mt-1 text-sage-deep shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-sage-deep" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Data Retention</h2>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Attendee records are kept for the duration of the 2026 festival and for a period of 12 months thereafter for audit and compliance purposes with the Federal Ministry of Livestock Development.
              </p>
            </section>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal delay={400}>
        <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-slate-200/60">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Contact Officer</p>
          <p className="text-slate-600 font-black">privacy@nlf.gov.ng</p>
        </div>
      </ScrollReveal>
    </div>
  );
}
