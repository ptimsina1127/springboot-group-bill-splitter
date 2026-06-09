import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculator, LogOut, QrCode, Share2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import apiClient from '../api/client';
import ParticipantLedger from '../components/ledger/ParticipantLedger';
import SettlementView from '../components/SettlementView';
import ShareModal from '../components/ShareModal';

export default function SessionDashboard() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettlements, setShowSettlements] = useState(null);
  const [editCount, setEditCount] = useState(0);
  const [settlementDismissed, setSettlementDismissed] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleEditingChange = (editing) => {
    setEditCount(prev => editing ? prev + 1 : Math.max(0, prev - 1));
    if (editing) setSettlementDismissed(true);
  };

  const handleRecalculate = () => {
    setSettlementDismissed(false);
    setShowSettlements(true);
  };

  const statusInfo = {
    ACTIVE: { label: 'Editing in progress — click to mark ready for review', next: 'REVIEW', color: 'bg-brand-100 text-brand-600' },
    REVIEW: { label: 'Ready to settle — click to mark as settled', next: 'SETTLED', color: 'bg-amber-100 text-amber-600' },
    SETTLED: { label: 'All paid up — click to archive', next: 'ARCHIVED', color: 'bg-green-100 text-green-600' },
    ARCHIVED: { label: 'Session closed — click to reopen as active', next: 'ACTIVE', color: 'bg-slate-100 text-slate-500' },
  };

  const cycleStatus = async () => {
    const order = ['ACTIVE', 'REVIEW', 'SETTLED', 'ARCHIVED'];
    const stat = session?.status || 'ACTIVE';
    const next = stat === 'ARCHIVED' ? 'ACTIVE' : order[order.indexOf(stat) + 1];
    try {
      await apiClient.put(`/sessions/${sessionId}`, { name: session.name, status: next });
      setSession(prev => ({ ...prev, status: next }));
    } catch (e) { alert('Error updating status'); }
  };

  const fetchSession = async () => {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}`);
      setSession(response.data);
      setShowSettlements(response.data.items.length > 0);
    } catch (error) {
      alert('Session not found!');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSession(); }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-brand-500 border-t-transparent"></div>
    </div>
  );
  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight truncate">{session.name}</h1>
              <button onClick={cycleStatus} title={statusInfo[session.status]?.label || statusInfo.ACTIVE.label}
                className={`${statusInfo[session.status]?.color || statusInfo.ACTIVE.color} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap hover:ring-2 hover:ring-offset-1 transition-all cursor-pointer`}>
                {session.status || 'ACTIVE'}
              </button>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap ${
                editCount > 0
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-green-100 text-green-600'
              }`}>
                {editCount > 0 ? 'Unsaved' : 'Saved'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium text-center sm:text-left">{session.participants.length} Participants</p>
          </div>
          
          <div className="relative group">
            <button onClick={() => navigate('/')} className="p-3 sm:p-4 text-slate-400 hover:text-red-500 bg-white rounded-2xl border border-slate-200 transition-all shadow-sm hover:shadow-md active:scale-95 flex-shrink-0">
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              Exit to Home
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {session.participants.map(p => (
                <ParticipantLedger 
                  key={p.id}
                  sessionId={sessionId}
                  participant={p}
                  items={session.items}
                  allParticipants={session.participants}
                  onUpdate={() => fetchSession()}
                  onEditingChange={handleEditingChange}
                />
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-4">
            {session.shortCode && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Share with Friends</h3>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs bg-brand-100 text-brand-600 px-3 py-1.5 rounded-lg truncate mr-3">
                    {window.location.origin}/s/{session.shortCode}
                  </span>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => setShowShare(true)}
                      className="p-2.5 text-brand-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                      title="Share">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => setShowQR(true)}
                      className="p-2.5 text-brand-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                      title="QR Code">
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {settlementDismissed ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-10 text-center shadow-xl shadow-slate-200/50">
                <div className="bg-slate-50 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 rotate-3">
                  <Calculator className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 sm:mb-3">Resettlement needed</h3>
                <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8 leading-relaxed font-medium">
                  New changes detected. Click Recalculate to update.
                </p>
                <button
                  onClick={handleRecalculate}
                  className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg transition-all shadow-lg hover:shadow-xl active:scale-95 hover:bg-slate-800"
                >
                  Recalculate
                </button>
              </div>
            ) : showSettlements ? (
              <div className="sticky top-6 sm:top-10 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <SettlementView sessionId={sessionId} sessionName={session.name} itemCount={session.items.length} />
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-10 text-center shadow-xl shadow-slate-200/50">
                <div className="bg-slate-50 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 rotate-3">
                  <Calculator className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 sm:mb-3">Ready to settle?</h3>
                <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8 leading-relaxed font-medium">
                  Once everyone has added their expenses, click Settle Up to find the most efficient way to pay each other back.
                </p>
                <button 
                  onClick={() => setShowSettlements(true)}
                  className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg transition-all shadow-lg hover:shadow-xl active:scale-95 hover:bg-slate-800"
                >
                  Calculate Debts
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showShare && session.shortCode && (
        <ShareModal session={session} onClose={() => setShowShare(false)} />
      )}

      {showQR && session.shortCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-900">Share Session</h3>
              <button onClick={() => setShowQR(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Scan to join this session</p>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-4 shadow-sm border">
              <QRCodeSVG value={`${window.location.origin}/s/${session.shortCode}`} size={200} />
            </div>
            <p className="text-xs font-mono bg-slate-50 px-3 py-2 rounded-lg text-slate-600 break-all">
              {window.location.origin}/s/{session.shortCode}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
