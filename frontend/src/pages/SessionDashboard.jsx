import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculator, LogOut, Settings } from 'lucide-react';
import apiClient from '../api/client';
import ParticipantLedger from '../components/ledger/ParticipantLedger';
import SettlementView from '../components/SettlementView';

export default function SessionDashboard() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettlements, setShowSettlements] = useState(false);

  const fetchSession = async () => {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}`);
      setSession(response.data);
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
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight truncate">{session.name}</h1>
              <span className="bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap">
                Active
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-500 font-semibold flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
              <span>{session.participantCount} Participants</span> • 
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">ID: {sessionId}</span>
            </p>
          </div>
          
          <button onClick={() => navigate('/')} className="p-3 sm:p-4 text-slate-400 hover:text-red-500 bg-white rounded-2xl border border-slate-200 transition-all shadow-sm hover:shadow-md active:scale-95 flex-shrink-0">
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
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
                />
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-4">
            {showSettlements ? (
              <div className="sticky top-6 sm:top-10">
                <SettlementView sessionId={sessionId} sessionName={session.name} onBack={() => setShowSettlements(false)} />
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
    </div>
  );
}
