import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Share2, Smartphone, Link2, Users } from 'lucide-react';

const features = [
  { icon: Shield, title: '100% Private', desc: 'No signup, no email, no tracking. Your session data is yours — delete it anytime.' },
  { icon: Zap, title: 'Instant Splits', desc: 'Add expenses and see who owes what in real-time. No spreadsheets, no math.' },
  { icon: Share2, title: 'Share in Seconds', desc: 'Share the settlement link or copy the short code. Everyone sees their balance instantly.' },
  { icon: Smartphone, title: 'Works Everywhere', desc: 'Use it on desktop, tablet, or phone. The mobile app is available on Google Play.' },
  { icon: Link2, title: 'Short Codes', desc: 'Every session gets a 5-character short code. Easy to share, easy to remember.' },
  { icon: Users, title: 'Group Ready', desc: 'Split restaurant bills, rent, utilities, travel expenses — anything with 2 or more people.' },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 text-center mb-4 tracking-tight">
          Everything you need to split bills
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 text-center mb-16 max-w-2xl mx-auto">
          No signup, no clutter, just fast bill splitting for any group.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="bg-brand-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-brand-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-brand-200 hover:-translate-y-1"
          >
            Try It Now — No Signup Needed
          </Link>
        </div>
      </div>
    </div>
  );
}
