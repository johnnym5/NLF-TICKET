import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import { Accessibility, Cookie, FileText, HelpCircle, Mail, RotateCcw } from 'lucide-react';

const pages = {
  terms: {
    title: 'Terms of Use',
    description: 'Rules for using the National Livestock Festival 2026 registration and digital pass services.',
    icon: FileText,
    sections: [
      ['Using your pass', 'Use only the digital pass assigned to you and present it for verification at the venue. A pass is subject to its assigned access tier, venue capacity, event rules, and security checks. Do not copy, alter, sell, transfer, or use another attendee’s pass. A pass may be refused if it is invalid, duplicated, revoked, or used contrary to these terms.'],
      ['Registration and VIP guests', 'Provide accurate registration details and keep your account credentials and pass secure. A VIP host is responsible for entering accurate names for their invited guests and sharing each guest pass only with its named guest. Guest access remains subject to the host’s available guest allocation and event verification.'],
      ['Venue conduct and safety', 'Follow instructions from event staff, security personnel, and venue officials. We may refuse or end access when reasonably required for safety, capacity management, fraud prevention, or compliance with venue rules and applicable law.'],
      ['Service changes and support', 'We may update event information or these terms when operationally necessary. Material changes will be published in the event application. To report an error or suspected pass misuse, contact support@livestockcarnival.ng.'],
      ['No purchase through this service', 'Event admission is stated by the organizer as free and requires valid accreditation. These terms do not govern any separate purchase made from an exhibitor, vendor, or other third party.']
    ]
  },
  refunds: {
    title: 'Refunds & Cancellations',
    description: 'Information about event registration cancellation and refunds.',
    icon: RotateCcw,
    sections: [
      ['Festival registration', 'Festival admission is offered free of charge and requires valid accreditation. Because this registration does not collect an admission payment, there is no admission fee to refund.'],
      ['Cancel or correct a registration', 'If you no longer plan to attend, or need to correct your registration or a VIP guest name, contact support@livestockcarnival.ng with the registered name and email address. Do not send passwords or complete ticket codes by email.'],
      ['Third-party purchases', 'This policy covers registration and admission through the festival application. Purchases made separately from vendors, exhibitors, transport providers, or other third parties are handled by the seller under that seller’s own cancellation and refund terms.'],
      ['Event changes', 'If the organizer changes or cancels event arrangements, updates will be shared through the event application and available official event channels. Contact support if you need help with your registration.']
    ]
  },
  cookies: {
    title: 'Cookies',
    description: 'How this application uses browser storage to provide registration and event services.',
    icon: Cookie,
    sections: [
      ['Essential browser storage', 'The application may use browser storage such as local storage or session storage to keep essential service state, including your sign-in session, pending VIP invitation, and interface preferences. This storage helps the registration and pass experience work.'],
      ['No advertising cookies', 'The application is not designed to use advertising cookies or to sell browsing activity. If optional analytics or other non-essential tracking is introduced, this notice should be updated to describe it and explain the available choices before it is enabled.'],
      ['Manage storage', 'You can clear site data through your browser settings. Clearing essential storage may sign you out or remove a pending invitation from this browser. You can still contact support@livestockcarnival.ng if you need assistance.']
    ]
  },
  accessibility: {
    title: 'Accessibility',
    description: 'We want attendees to be able to use the event registration and pass services.',
    icon: Accessibility,
    sections: [
      ['Our approach', 'We aim to make the registration, digital pass, and event information usable with common devices and assistive technologies. We continue to improve readable contrast, clear labels, keyboard access, and layouts that adapt to different screen sizes.'],
      ['Request assistance', 'If you encounter an accessibility barrier or need help with registration or your pass, email support@livestockcarnival.ng. Please describe the page and task you were trying to complete; do not include passwords or sensitive identity documents.'],
      ['At the venue', 'For assistance at the festival venue, speak with an event steward or security team member. Venue access and available accommodations may depend on the facilities and event arrangements.']
    ]
  },
  faq: {
    title: 'Frequently Asked Questions',
    description: 'Quick answers about registration, digital passes, and VIP guest access.',
    icon: HelpCircle,
    sections: [
      ['How do I register?', 'Open the event registration page, create or sign in to your account, and complete the requested attendee details. Registration is required for accreditation.'],
      ['Where is my digital pass?', 'After registration, sign in to the event application and open your pass. Keep it available on your device for gate verification. Contact support if you cannot access it.'],
      ['Can I share my pass?', 'No. Each pass is assigned to a named attendee and should only be used by that person. VIP hosts should share each named guest pass only with the guest it was created for.'],
      ['How do VIP guest passes work?', 'A VIP host can manage named guests within their available allocation. Each guest should use their own named pass. Gate staff may verify each guest separately and record attendance against that guest pass.'],
      ['What if my name or email is wrong?', 'Contact support@livestockcarnival.ng with the registered name and email address and describe the correction needed. Do not email your password or full ticket code.'],
      ['Is admission paid?', 'Festival admission is stated by the organizer as free and requires valid accreditation. Any separate vendor or exhibitor purchases are handled by the seller.'],
      ['Who can help me?', 'Email support@livestockcarnival.ng for registration, pass, privacy, and accessibility assistance.']
    ]
  },
  contact: {
    title: 'Contact',
    description: 'Reach the National Livestock Festival support team for registration and event service help.',
    icon: Mail,
    sections: [
      ['Attendee support', 'For registration corrections, pass access, VIP guest lists, privacy questions, or accessibility requests, email our support team. Include the name and email used to register and a short description of the issue. Never send your password or full ticket code.'],
      ['Email', 'support@livestockcarnival.ng']
    ]
  }
};

export default function InfoPageView({ page }) {
  const content = pages[page] || pages.faq;
  const Icon = content.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 space-y-10">
      <ScrollReveal delay={100}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sage-base text-sage-deep flex items-center justify-center mx-auto mb-6">
            <Icon className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">{content.title}</h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">{content.description}</p>
          <p className="text-xs text-slate-400">Last updated October 3, 2026</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border-2 border-slate-200/80 p-6 sm:p-10 shadow-md divide-y divide-slate-100">
          {content.sections.map(([heading, body]) => (
            <section key={heading} className="py-6 first:pt-0 last:pb-0 space-y-3">
              <h2 className="text-lg font-black text-slate-900">{heading}</h2>
              {page === 'contact' && heading === 'Email' ? (
                <a className="text-sage-deep font-bold underline underline-offset-4" href="mailto:support@livestockcarnival.ng">{body}</a>
              ) : (
                <p className="text-slate-600 leading-relaxed font-medium">{body}</p>
              )}
            </section>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
