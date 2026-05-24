import React, { useState } from 'react';
import { Share2, Copy, Check, Mail, X } from 'lucide-react';

export default function ShareModal({ session, onClose }) {
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/s/${session.shortCode}`;
  const participantList = session.participants.map(p => p.name).join(', ');

  const expensesText = session.items.length > 0
    ? session.items.map(i => {
        const payer = session.participants.find(p => p.id === i.paidByParticipantId);
        return `  ${payer?.name || 'Someone'} paid $${i.amount} for "${i.description}"`;
      }).join('\n')
    : '  (no expenses yet)';

  const shareText = [
    `Split bill: ${session.name}`,
    `Participants: ${participantList}`,
    '',
    'Expenses:',
    expensesText,
    '',
    `Join: ${url}`,
  ].join('\n');

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = [
    { name: 'WhatsApp', url: `https://wa.me/?text=${encodedText}`, color: 'bg-green-500 hover:bg-green-600' },
    { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Twitter / X', url: `https://twitter.com/intent/tweet?text=${encodedText}`, color: 'bg-slate-800 hover:bg-slate-900' },
    { name: 'Telegram', url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, color: 'bg-sky-500 hover:bg-sky-600' },
    { name: 'Email', url: `mailto:?subject=${encodeURIComponent(`Split bill: ${session.name}`)}&body=${encodedText}`, color: 'bg-red-400 hover:bg-red-500' },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-brand-100 p-2 rounded-xl">
              <Share2 className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Share Session</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-5 font-medium">
          Invite others to join <span className="text-slate-700 font-bold">{session.name}</span>
        </p>

        <button onClick={copyLink} className="w-full flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3.5 mb-6 transition-all group">
          <span className="text-sm text-slate-600 font-mono truncate">{url}</span>
          <span className={`flex items-center gap-1.5 text-sm font-bold whitespace-nowrap px-3 py-1.5 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-900 text-white group-hover:bg-slate-800'}`}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>

        <div className="space-y-2.5">
          {shareLinks.map(link => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${link.color} text-white w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]`}
            >
              {link.name === 'Email' && <Mail className="w-4 h-4" />}
              {link.name === 'WhatsApp' && <span className="text-lg leading-none">📱</span>}
              {link.name === 'Facebook' && <span className="text-lg leading-none">f</span>}
              {link.name === 'Twitter / X' && <span className="text-lg leading-none">𝕏</span>}
              {link.name === 'Telegram' && <span className="text-lg leading-none">✈️</span>}
              Share on {link.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
