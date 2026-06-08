import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, UserPlus, Receipt, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: PlusCircle,
    step: '1',
    title: 'Create a Session',
    desc: 'No signup required. Just click "Start New Session" and give it a name. You\'ll get a unique session link and a 5-character short code to share.',
  },
  {
    icon: UserPlus,
    step: '2',
    title: 'Add People',
    desc: 'Add everyone who\'s sharing the bill. Just names — no accounts, no emails. Each person gets added instantly to the session.',
  },
  {
    icon: Receipt,
    step: '3',
    title: 'Add Expenses',
    desc: 'Enter what each person paid. Add description and amount. You can add as many expenses as you need — the running total updates automatically.',
  },
  {
    icon: CheckCircle2,
    step: '4',
    title: 'Settle Up',
    desc: 'See exactly who owes whom and how much. Share the settlement view with everyone via link or short code. No awkward math conversations.',
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 text-center mb-4 tracking-tight">
          How It Works
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 text-center mb-16 max-w-2xl mx-auto">
          Split any group expense in four simple steps.
        </p>

        <div className="space-y-12 sm:space-y-16">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
              <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-200">
                <s.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-lg shadow-slate-200/50">
                <span className="text-sm font-bold text-brand-500 uppercase tracking-wider">Step {s.step}</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-3">{s.title}</h3>
                <p className="text-slate-600 text-lg leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-brand-200 hover:-translate-y-1"
          >
            Start Splitting Now
          </Link>
        </div>
      </div>
    </div>
  );
}
