import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, RotateCcw } from 'lucide-react';
import apiClient from '../api/client';

export default function SettlementView({ sessionId, sessionName }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/sessions/${sessionId}/calculate`);
      setResult(response.data);
    } catch (error) {
      alert('Error calculating settlements');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { calculate(); }, [calculate]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-400 space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-3 border-brand-500 border-t-transparent"></div>
      <p className="text-sm text-slate-400">Optimizing debts...</p>
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base text-slate-900 font-medium">Settlements</h3>
        <button onClick={calculate} className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
          Recalculate
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-2.5 bg-green-50 border-b border-green-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">Balanced</span>
          </div>
          <span className="text-xs text-slate-500">Total: <span className="text-slate-700 font-medium">${result?.totalExpenses || '0.00'}</span></span>
        </div>

        <div className="p-3 space-y-1.5">
          {result?.debts.length > 0 ? (
            result.debts.map((debt, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                    {debt.fromParticipantName[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-700 truncate">{debt.fromParticipantName}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">pays</span>
                  <span className="text-sm font-medium text-brand-600">${debt.amount}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">to</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-700 truncate max-w-[80px]">{debt.toParticipantName}</span>
                    <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                      {debt.toParticipantName[0].toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">Everything is already settled!</div>
          )}
        </div>
      </div>
    </div>
  );
}
