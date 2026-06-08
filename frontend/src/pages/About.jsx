import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Globe, Github, Mail } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 text-center mb-4 tracking-tight">
          About GroupBillSplitter
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 text-center mb-12 max-w-2xl mx-auto">
          The simplest way to split group expenses — free, private, and built for everyone.
        </p>

        <div className="bg-white rounded-[2rem] shadow-2xl p-6 sm:p-10 lg:p-12 border border-slate-100 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What is GroupBillSplitter?</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              GroupBillSplitter is a free online tool for splitting group bills and shared expenses. 
              Whether it's a restaurant dinner, monthly rent, group trip, or shared utility bill — 
              just create a session, add expenses, and instantly see who owes what.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Why is it free?</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              No ads, no subscriptions, no hidden fees. GroupBillSplitter was built to solve a real 
              problem — awkward group expense calculations. It stays free because bill splitting 
              should be a basic utility, not a paid service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Privacy First</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              We don't ask for signups, emails, or personal data. Session data is encrypted in 
              transit and at rest. Delete your session anytime and all data is permanently removed. 
              See our <Link to="/privacy" className="text-brand-500 hover:underline font-medium">Privacy Policy</Link> for details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact</h2>
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-5 h-5 text-brand-500" />
              <a href="mailto:pravatktimsina@gmail.com" className="text-lg hover:text-brand-500 transition-colors">
                pravatktimsina@gmail.com
              </a>
            </div>
          </section>
        </div>

        <div className="text-center mt-12">
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-brand-200 hover:-translate-y-1"
          >
            Start Your First Session
          </Link>
        </div>
      </div>
    </div>
  );
}
